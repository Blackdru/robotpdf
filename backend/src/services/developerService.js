const { supabaseAdmin } = require('../config/supabase');
const { generateApiKeyPair, hashApiSecret } = require('../utils/apiKeyGenerator');

class DeveloperService {
  /**
   * Create a new developer account with API keys
   * @param {Object} data - Developer data
   * @returns {Promise<Object>} Created developer with API keys
   */
  async createDeveloper(data) {
    try {
      const { name, email, monthlyLimit = 1000, rateLimitPerMinute = 100, metadata = {} } = data;

      if (!name) {
        throw new Error('Developer name is required');
      }

      // Generate API key pair
      const { apiKey, apiSecret } = generateApiKeyPair(false); // Production keys
      const hashedSecret = hashApiSecret(apiSecret);

      // Insert developer
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .insert({
          name,
          email,
          api_key: apiKey,
          api_secret: hashedSecret,
          is_active: true,
          metadata
        })
        .select()
        .single();

      if (devError) {
        throw new Error(`Failed to create developer: ${devError.message}`);
      }

      // Create usage limits
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { error: limitError } = await supabaseAdmin
        .from('developer_limits')
        .insert({
          developer_id: developer.id,
          monthly_limit: monthlyLimit,
          current_month_used: 0,
          current_month: currentMonth,
          rate_limit_per_minute: rateLimitPerMinute
        });

      if (limitError) {
        console.error('Failed to create limits:', limitError);
      }

      // Return developer info with unhashed secret (ONLY TIME it's visible)
      return {
        id: developer.id,
        name: developer.name,
        email: developer.email,
        api_key: apiKey,
        api_secret: apiSecret, // Plain text secret - save this!
        is_active: developer.is_active,
        monthly_limit: monthlyLimit,
        rate_limit_per_minute: rateLimitPerMinute,
        created_at: developer.created_at,
        warning: 'Save the API secret now! It will not be shown again.'
      };
    } catch (error) {
      console.error('Create developer error:', error);
      throw error;
    }
  }

  /**
   * List all developers
   * @returns {Promise<Array>} List of developers
   */
  async listDevelopers() {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .select(`
          *,
          developer_limits(monthly_limit, current_month_used, current_month, rate_limit_per_minute)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list developers: ${error.message}`);
      }

      return data.map(dev => ({
        id: dev.id,
        name: dev.name,
        email: dev.email,
        api_key: dev.api_key,
        is_active: dev.is_active,
        limits: dev.developer_limits?.[0] || null,
        created_at: dev.created_at
      }));
    } catch (error) {
      console.error('List developers error:', error);
      throw error;
    }
  }

  /**
   * Get developer by ID
   * @param {string} developerId - Developer UUID
   * @returns {Promise<Object>} Developer details
   */
  async getDeveloper(developerId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .select(`
          *,
          developer_limits(*),
          developer_usage(tool_name, usage_count, last_used_at)
        `)
        .eq('id', developerId)
        .single();

      if (error) {
        throw new Error(`Failed to get developer: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        api_key: data.api_key,
        is_active: data.is_active,
        metadata: data.metadata,
        limits: data.developer_limits?.[0] || null,
        usage: data.developer_usage || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Get developer error:', error);
      throw error;
    }
  }

  /**
   * Update developer
   * @param {string} developerId - Developer UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated developer
   */
  async updateDeveloper(developerId, updates) {
    try {
      const allowedFields = ['name', 'email', 'is_active', 'metadata'];
      const filteredUpdates = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      const { data, error } = await supabaseAdmin
        .from('developers')
        .update(filteredUpdates)
        .eq('id', developerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update developer: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Update developer error:', error);
      throw error;
    }
  }

  /**
   * Update developer limits
   * @param {string} developerId - Developer UUID
   * @param {Object} limits - Limit updates
   * @returns {Promise<Object>} Updated limits
   */
  async updateLimits(developerId, limits) {
    try {
      const { monthly_limit, rate_limit_per_minute } = limits;
      const updates = {};

      if (monthly_limit !== undefined) {
        updates.monthly_limit = monthly_limit;
      }
      if (rate_limit_per_minute !== undefined) {
        updates.rate_limit_per_minute = rate_limit_per_minute;
      }

      const { data, error } = await supabaseAdmin
        .from('developer_limits')
        .update(updates)
        .eq('developer_id', developerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update limits: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Update limits error:', error);
      throw error;
    }
  }

  /**
   * Delete developer
   * @param {string} developerId - Developer UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDeveloper(developerId) {
    try {
      const { error } = await supabaseAdmin
        .from('developers')
        .delete()
        .eq('id', developerId);

      if (error) {
        throw new Error(`Failed to delete developer: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete developer error:', error);
      throw error;
    }
  }

  /**
   * Regenerate API keys for a developer
   * @param {string} developerId - Developer UUID
   * @returns {Promise<Object>} New API keys
   */
  async regenerateKeys(developerId) {
    try {
      // Generate new keys
      const { apiKey, apiSecret } = generateApiKeyPair(false);
      const hashedSecret = hashApiSecret(apiSecret);

      // Update developer
      const { data, error } = await supabaseAdmin
        .from('developers')
        .update({
          api_key: apiKey,
          api_secret: hashedSecret
        })
        .eq('id', developerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to regenerate keys: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        api_key: apiKey,
        api_secret: apiSecret,
        warning: 'Save the new API secret now! It will not be shown again.'
      };
    } catch (error) {
      console.error('Regenerate keys error:', error);
      throw error;
    }
  }

  /**
   * Get developer usage logs
   * @param {string} developerId - Developer UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Usage logs
   */
  async getUsageLogs(developerId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;

      const { data, error } = await supabaseAdmin
        .from('developer_api_logs')
        .select('*')
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get usage logs: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get usage logs error:', error);
      throw error;
    }
  }

  /**
   * Reset monthly usage for a developer
   * @param {string} developerId - Developer UUID
   * @returns {Promise<Object>} Updated limits
   */
  async resetMonthlyUsage(developerId) {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);

      const { data, error } = await supabaseAdmin
        .from('developer_limits')
        .update({
          current_month_used: 0,
          current_month: currentMonth
        })
        .eq('developer_id', developerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reset usage: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Reset monthly usage error:', error);
      throw error;
    }
  }
}

module.exports = new DeveloperService();
