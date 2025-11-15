const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateApiKeyPair, hashApiSecret, verifyApiSecret } = require('../utils/apiKeyGenerator');

/**
 * Developer Portal Routes - For developers to manage their own API keys
 * All routes require user authentication
 */

// Middleware: Authenticate user
router.use(authenticateUser);

/**
 * GET /api/dev/portal/stats
 * Get developer dashboard stats
 */
router.get('/portal/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get developer account
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('metadata->>user_id', userId)
      .single();

    if (!developer) {
      return res.json({
        success: true,
        data: {
          totalRequests: 0,
          monthlyLimit: 0,
          activeKeys: 0,
          uptime: '99.9%',
          hasDeveloperAccount: false
        }
      });
    }

    // Get usage stats
    const { data: limits } = await supabaseAdmin
      .from('developer_limits')
      .select('*')
      .eq('developer_id', developer.id)
      .single();

    // Count active keys
    const { count: keyCount } = await supabaseAdmin
      .from('developers')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>user_id', userId)
      .eq('is_active', true);

    res.json({
      success: true,
      data: {
        totalRequests: limits?.current_month_used || 0,
        monthlyLimit: limits?.monthly_limit || 0,
        activeKeys: keyCount || 0,
        uptime: '99.9%',
        hasDeveloperAccount: true
      }
    });
  } catch (error) {
    console.error('Get portal stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch portal stats',
      message: error.message
    });
  }
});

/**
 * GET /api/dev/keys
 * List all API keys for the authenticated user
 */
router.get('/keys', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: keys, error } = await supabaseAdmin
      .from('developers')
      .select(`
        id,
        name,
        email,
        api_key,
        is_active,
        created_at,
        updated_at
      `)
      .eq('metadata->>user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get usage data separately for each key
    const formattedKeys = await Promise.all(keys.map(async (key) => {
      const { data: usage } = await supabaseAdmin
        .from('developer_usage')
        .select('last_used_at')
        .eq('developer_id', key.id)
        .order('last_used_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: key.id,
        name: key.name || 'API Key',
        api_key: key.api_key,
        created_at: key.created_at,
        last_used: usage?.last_used_at || null,
        is_active: key.is_active
      };
    }));

    res.json({
      success: true,
      data: formattedKeys || []
    });
  } catch (error) {
    console.error('List keys error:', error);
    res.status(500).json({
      error: 'Failed to list API keys',
      message: error.message
    });
  }
});

/**
 * POST /api/dev/keys
 * Create a new API key
 */
router.post('/keys', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, monthly_limit = 1000 } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Key name is required'
      });
    }

    // Check if user already has developer account
    const { count } = await supabaseAdmin
      .from('developers')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>user_id', userId);

    // Limit to 5 keys per user
    if (count >= 5) {
      return res.status(400).json({
        error: 'Maximum 5 API keys per user. Delete unused keys to create new ones.'
      });
    }

    // Generate API key pair
    const { apiKey, apiSecret } = generateApiKeyPair(false);
    const hashedSecret = hashApiSecret(apiSecret);

    // Insert developer
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .insert({
        name,
        email: req.user.email,
        api_key: apiKey,
        api_secret: hashedSecret,
        is_active: true,
        metadata: {
          user_id: userId,
          created_by: req.user.email
        }
      })
      .select()
      .single();

    if (devError) throw devError;

    // Create usage limits
    const currentMonth = new Date().toISOString().substring(0, 7);
    await supabaseAdmin
      .from('developer_limits')
      .insert({
        developer_id: developer.id,
        monthly_limit: monthly_limit,
        current_month_used: 0,
        current_month: currentMonth,
        rate_limit_per_minute: 100
      });

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: developer.id,
        name: developer.name,
        api_key: apiKey,
        api_secret: apiSecret, // Only shown once!
        created_at: developer.created_at,
        warning: '⚠️ Save the API secret now! It will never be shown again.'
      }
    });
  } catch (error) {
    console.error('Create key error:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      message: error.message
    });
  }
});

/**
 * DELETE /api/dev/keys/:id
 * Delete an API key
 */
router.delete('/keys/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.id;

    // Verify ownership
    const { data: key } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('id', keyId)
      .eq('metadata->>user_id', userId)
      .single();

    if (!key) {
      return res.status(404).json({
        error: 'API key not found or unauthorized'
      });
    }

    const { error } = await supabaseAdmin
      .from('developers')
      .delete()
      .eq('id', keyId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({
      error: 'Failed to delete API key',
      message: error.message
    });
  }
});

/**
 * POST /api/dev/keys/:id/regenerate
 * Regenerate API secret for a key
 */
router.post('/keys/:id/regenerate', async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.id;

    // Verify ownership
    const { data: key } = await supabaseAdmin
      .from('developers')
      .select('id, name, api_key')
      .eq('id', keyId)
      .eq('metadata->>user_id', userId)
      .single();

    if (!key) {
      return res.status(404).json({
        error: 'API key not found or unauthorized'
      });
    }

    // Generate new secret (keep same API key)
    const { apiSecret } = generateApiKeyPair(false);
    const hashedSecret = hashApiSecret(apiSecret);

    const { error } = await supabaseAdmin
      .from('developers')
      .update({
        api_secret: hashedSecret,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'API secret regenerated successfully',
      data: {
        id: key.id,
        name: key.name,
        api_key: key.api_key,
        api_secret: apiSecret,
        warning: '⚠️ Save the new API secret now! It will never be shown again.'
      }
    });
  } catch (error) {
    console.error('Regenerate key error:', error);
    res.status(500).json({
      error: 'Failed to regenerate API key',
      message: error.message
    });
  }
});

/**
 * GET /api/dev/usage
 * Get usage statistics for the authenticated user
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30d' } = req.query;

    // Get all developer IDs for this user
    const { data: developers } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('metadata->>user_id', userId);

    if (!developers || developers.length === 0) {
      return res.json({
        success: true,
        data: {
          monthly_limit: 0,
          current_month_used: 0,
          remaining: 0,
          rate_limit_per_minute: 0,
          tools: []
        }
      });
    }

    const developerIds = developers.map(d => d.id);

    // Get aggregated limits
    const { data: limits } = await supabaseAdmin
      .from('developer_limits')
      .select('*')
      .in('developer_id', developerIds);

    const totalLimit = limits?.reduce((sum, l) => sum + (l.monthly_limit || 0), 0) || 0;
    const totalUsed = limits?.reduce((sum, l) => sum + (l.current_month_used || 0), 0) || 0;

    // Get per-tool usage
    const { data: toolUsage } = await supabaseAdmin
      .from('developer_usage')
      .select('tool_name, usage_count, last_used_at')
      .in('developer_id', developerIds)
      .order('usage_count', { ascending: false });

    // Aggregate by tool
    const aggregated = {};
    toolUsage?.forEach(usage => {
      if (!aggregated[usage.tool_name]) {
        aggregated[usage.tool_name] = {
          tool_name: usage.tool_name,
          usage_count: 0,
          last_used_at: usage.last_used_at
        };
      }
      aggregated[usage.tool_name].usage_count += usage.usage_count;
      if (usage.last_used_at > aggregated[usage.tool_name].last_used_at) {
        aggregated[usage.tool_name].last_used_at = usage.last_used_at;
      }
    });

    res.json({
      success: true,
      data: {
        monthly_limit: totalLimit,
        current_month_used: totalUsed,
        remaining: totalLimit - totalUsed,
        rate_limit_per_minute: limits?.[0]?.rate_limit_per_minute || 0,
        tools: Object.values(aggregated)
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage data',
      message: error.message
    });
  }
});

/**
 * GET /api/dev/logs
 * Get API call logs
 */
router.get('/logs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Get all developer IDs for this user
    const { data: developers } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('metadata->>user_id', userId);

    if (!developers || developers.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const developerIds = developers.map(d => d.id);

    const { data: logs, error } = await supabaseAdmin
      .from('developer_api_logs')
      .select('*')
      .in('developer_id', developerIds)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
});

module.exports = router;
