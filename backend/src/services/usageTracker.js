const { supabaseAdmin } = require('../config/supabase');

/**
 * Record API usage for a developer
 * @param {string} developerId - Developer UUID
 * @param {string} toolName - Tool name (e.g., 'ocr_pro', 'chat_pdf')
 * @returns {Promise<Object>} Usage status with allowed flag, limit, used, and remaining
 */
async function recordUsage(developerId, toolName) {
  try {
    // Call the database function to increment usage and check limits
    const { data, error } = await supabaseAdmin.rpc('increment_developer_usage', {
      p_developer_id: developerId,
      p_tool_name: toolName
    });

    if (error) {
      console.error('Usage tracking error:', error);
      throw new Error('Failed to track usage');
    }

    return data;
  } catch (error) {
    console.error('Record usage error:', error);
    throw error;
  }
}

/**
 * Get current usage stats for a developer
 * @param {string} developerId - Developer UUID
 * @returns {Promise<Object>} Usage statistics
 */
async function getUsageStats(developerId) {
  try {
    // Get overall limits
    const { data: limits, error: limitsError } = await supabaseAdmin
      .from('developer_limits')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    if (limitsError && limitsError.code !== 'PGRST116') {
      throw limitsError;
    }

    // Get per-tool usage
    const { data: toolUsage, error: usageError } = await supabaseAdmin
      .from('developer_usage')
      .select('tool_name, usage_count, last_used_at')
      .eq('developer_id', developerId)
      .order('usage_count', { ascending: false });

    if (usageError) {
      throw usageError;
    }

    const currentMonth = new Date().toISOString().substring(0, 7);
    
    return {
      monthly_limit: limits?.monthly_limit || 1000,
      current_month_used: limits?.current_month_used || 0,
      remaining: (limits?.monthly_limit || 1000) - (limits?.current_month_used || 0),
      current_month: currentMonth,
      rate_limit_per_minute: limits?.rate_limit_per_minute || 100,
      tools: toolUsage || []
    };
  } catch (error) {
    console.error('Get usage stats error:', error);
    throw error;
  }
}

/**
 * Log API request for debugging and auditing
 * @param {Object} logData - Log data including developer_id, endpoint, method, etc.
 */
async function logApiRequest(logData) {
  try {
    const { error } = await supabaseAdmin
      .from('developer_api_logs')
      .insert({
        developer_id: logData.developer_id,
        endpoint: logData.endpoint,
        method: logData.method,
        status_code: logData.status_code,
        request_body: logData.request_body,
        response_body: logData.response_body,
        error_message: logData.error_message,
        ip_address: logData.ip_address,
        user_agent: logData.user_agent,
        processing_time_ms: logData.processing_time_ms
      });

    if (error) {
      console.error('API log error:', error);
    }
  } catch (error) {
    console.error('Log API request error:', error);
  }
}

/**
 * Middleware to track usage and check limits
 * @param {string} toolName - Tool name to track
 */
function trackUsage(toolName) {
  return async (req, res, next) => {
    try {
      const developerId = req.developer?.id;
      
      if (!developerId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Developer authentication required'
        });
      }

      // Record usage and check limits
      const usageResult = await recordUsage(developerId, toolName);

      if (!usageResult.allowed) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: `You have reached your monthly limit of ${usageResult.limit} requests. Please upgrade your plan or wait until next month.`,
          limit: usageResult.limit,
          used: usageResult.used,
          remaining: usageResult.remaining
        });
      }

      // Attach usage info to request for logging
      req.usageInfo = usageResult;

      next();
    } catch (error) {
      console.error('Track usage middleware error:', error);
      return res.status(500).json({
        error: 'Usage tracking failed',
        message: 'An error occurred while tracking usage'
      });
    }
  };
}

/**
 * Middleware to log API requests
 */
function apiLogger(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;

  let responseBody;
  res.send = function (data) {
    responseBody = data;
    originalSend.call(this, data);
  };

  res.on('finish', () => {
    const processingTime = Date.now() - startTime;
    
    logApiRequest({
      developer_id: req.developer?.id,
      endpoint: req.originalUrl,
      method: req.method,
      status_code: res.statusCode,
      request_body: req.body,
      response_body: responseBody ? JSON.parse(responseBody) : null,
      error_message: res.statusCode >= 400 ? responseBody : null,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      processing_time_ms: processingTime
    }).catch(err => console.error('Failed to log API request:', err));
  });

  next();
}

module.exports = {
  recordUsage,
  getUsageStats,
  logApiRequest,
  trackUsage,
  apiLogger
};
