const { supabaseAdmin } = require('../config/supabase');

/**
 * Rate limiting middleware for API requests
 * Checks developer's rate limit and quota
 */

// In-memory store for rate limiting (per minute)
const rateLimitStore = new Map();

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

async function checkRateLimit(req, res, next) {
  try {
    if (!req.developer) {
      return next();
    }

    const developerId = req.developer.id;
    const now = Date.now();

    // Get rate limits from database
    const { data: limits, error } = await supabaseAdmin
      .from('developer_limits')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    if (error) {
      console.error('Rate limit check error:', error);
      return next(); // Continue anyway on error
    }

    // Check monthly quota
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    if (limits.current_month !== currentMonth) {
      // Reset monthly usage if new month
      await supabaseAdmin
        .from('developer_limits')
        .update({
          current_month_used: 0,
          current_month: currentMonth
        })
        .eq('developer_id', developerId);
      
      limits.current_month_used = 0;
    }

    if (limits.current_month_used >= limits.monthly_limit) {
      return res.status(429).json({
        error: 'Monthly quota exceeded',
        message: `You have reached your monthly limit of ${limits.monthly_limit} requests. Upgrade your plan or wait for the next billing cycle.`,
        limit: limits.monthly_limit,
        used: limits.current_month_used,
        remaining: 0,
        reset_date: new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1)
      });
    }

    // Check per-minute rate limit
    const rateLimitKey = `ratelimit:${developerId}`;
    let rateData = rateLimitStore.get(rateLimitKey);

    if (!rateData || now - rateData.resetTime > 60000) {
      // Create new rate limit window
      rateData = {
        count: 0,
        resetTime: now
      };
      rateLimitStore.set(rateLimitKey, rateData);
    }

    if (rateData.count >= limits.rate_limit_per_minute) {
      const resetIn = Math.ceil((60000 - (now - rateData.resetTime)) / 1000);
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Rate limit: ${limits.rate_limit_per_minute} requests per minute.`,
        limit: limits.rate_limit_per_minute,
        reset_in_seconds: resetIn
      });
    }

    // Increment counters
    rateData.count++;
    
    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', limits.rate_limit_per_minute);
    res.setHeader('X-RateLimit-Remaining', limits.rate_limit_per_minute - rateData.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateData.resetTime / 1000) + 60);
    res.setHeader('X-Quota-Limit', limits.monthly_limit);
    res.setHeader('X-Quota-Used', limits.current_month_used);
    res.setHeader('X-Quota-Remaining', limits.monthly_limit - limits.current_month_used);

    // Store for usage tracking
    req.rateLimitInfo = {
      monthlyLimit: limits.monthly_limit,
      monthlyUsed: limits.current_month_used,
      rateLimitPerMinute: limits.rate_limit_per_minute
    };

    next();
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    next(); // Continue on error
  }
}

module.exports = {
  checkRateLimit
};
