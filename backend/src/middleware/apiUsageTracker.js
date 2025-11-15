const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to track API usage
 * Should be placed after authentication and rate limiting
 */
function trackApiUsage(toolName) {
  return async (req, res, next) => {
    if (!req.developer) {
      return next();
    }

    const developerId = req.developer.id;
    const startTime = Date.now();

    // Store original send function
    const originalSend = res.send;
    const originalJson = res.json;

    // Override send to capture response
    let responseBody;
    let responseCaptured = false;

    res.send = function (body) {
      if (!responseCaptured) {
        responseBody = body;
        responseCaptured = true;
      }
      return originalSend.call(this, body);
    };

    res.json = function (body) {
      if (!responseCaptured) {
        responseBody = body;
        responseCaptured = true;
      }
      return originalJson.call(this, body);
    };

    // Capture response finish event
    res.on('finish', async () => {
      try {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Increment usage counters
        await incrementUsage(developerId, toolName);

        // Log the API call
        await logApiCall({
          developerId,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode: res.statusCode,
          requestBody: sanitizeRequestBody(req.body),
          responseBody: sanitizeResponseBody(responseBody),
          errorMessage: res.statusCode >= 400 ? getErrorMessage(responseBody) : null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          processingTime
        });
      } catch (error) {
        console.error('Usage tracking error:', error);
        // Don't throw - tracking failures shouldn't affect the response
      }
    });

    next();
  };
}

/**
 * Increment usage counters in database
 */
async function incrementUsage(developerId, toolName) {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Increment monthly usage
    const { data: limits } = await supabaseAdmin
      .from('developer_limits')
      .select('current_month_used')
      .eq('developer_id', developerId)
      .eq('current_month', currentMonth)
      .single();

    if (limits) {
      await supabaseAdmin
        .from('developer_limits')
        .update({
          current_month_used: (limits.current_month_used || 0) + 1
        })
        .eq('developer_id', developerId)
        .eq('current_month', currentMonth);
    }

    // Update or create tool-specific usage
    const { error: usageError } = await supabaseAdmin
      .from('developer_usage')
      .upsert({
        developer_id: developerId,
        tool_name: toolName,
        usage_count: 1, // This will be incremented by DB trigger
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'developer_id,tool_name',
        ignoreDuplicates: false
      });

    // If upsert failed, try manual increment
    if (usageError) {
      const { data: existing } = await supabaseAdmin
        .from('developer_usage')
        .select('usage_count')
        .eq('developer_id', developerId)
        .eq('tool_name', toolName)
        .single();

      if (existing) {
        await supabaseAdmin
          .from('developer_usage')
          .update({
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('developer_id', developerId)
          .eq('tool_name', toolName);
      } else {
        await supabaseAdmin
          .from('developer_usage')
          .insert({
            developer_id: developerId,
            tool_name: toolName,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });
      }
    }
  } catch (error) {
    console.error('Increment usage error:', error);
  }
}

/**
 * Log API call to database
 */
async function logApiCall(logData) {
  try {
    await supabaseAdmin
      .from('developer_api_logs')
      .insert({
        developer_id: logData.developerId,
        endpoint: logData.endpoint,
        method: logData.method,
        status_code: logData.statusCode,
        request_body: logData.requestBody,
        response_body: logData.responseBody,
        error_message: logData.errorMessage,
        ip_address: logData.ipAddress,
        user_agent: logData.userAgent,
        processing_time_ms: logData.processingTime
      });
  } catch (error) {
    console.error('Log API call error:', error);
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'secret', 'token', 'api_key', 'credit_card'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Truncate large fields
  if (JSON.stringify(sanitized).length > 10000) {
    return { truncated: true, preview: JSON.stringify(sanitized).substring(0, 1000) + '...' };
  }

  return sanitized;
}

/**
 * Sanitize response body for logging
 */
function sanitizeResponseBody(body) {
  if (!body) return null;

  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Truncate large responses
    const stringified = JSON.stringify(parsed);
    if (stringified.length > 10000) {
      return { truncated: true, preview: stringified.substring(0, 1000) + '...' };
    }

    return parsed;
  } catch {
    // If not JSON, just truncate
    const str = String(body);
    if (str.length > 1000) {
      return { truncated: true, preview: str.substring(0, 1000) + '...' };
    }
    return str;
  }
}

/**
 * Extract error message from response
 */
function getErrorMessage(responseBody) {
  if (!responseBody) return 'Unknown error';
  
  try {
    const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    return parsed.error || parsed.message || 'Unknown error';
  } catch {
    return String(responseBody).substring(0, 500);
  }
}

module.exports = {
  trackApiUsage
};
