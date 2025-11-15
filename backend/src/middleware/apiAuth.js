const { supabaseAdmin } = require('../config/supabase');
const { verifyApiSecret } = require('../utils/apiKeyGenerator');

/**
 * Middleware to authenticate API requests using API key + secret
 * Usage: Add to any route that needs API authentication
 * 
 * Headers required:
 * - X-API-Key: The public API key (pk_live_xxx)
 * - X-API-Secret: The private API secret (sk_live_xxx)
 */
async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key and secret are required. Include X-API-Key and X-API-Secret headers.'
      });
    }

    // Validate format
    if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_')) {
      return res.status(401).json({
        error: 'Invalid API key format',
        message: 'API key must start with pk_live_ or pk_test_'
      });
    }

    if (!apiSecret.startsWith('sk_live_') && !apiSecret.startsWith('sk_test_')) {
      return res.status(401).json({
        error: 'Invalid API secret format',
        message: 'API secret must start with sk_live_ or sk_test_'
      });
    }

    // Get developer from database
    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('id, name, email, api_secret, is_active')
      .eq('api_key', apiKey)
      .single();

    if (error || !developer) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key not found or invalid'
      });
    }

    // Check if account is active
    if (!developer.is_active) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your API access has been disabled. Contact support.'
      });
    }

    // Verify secret
    const isValidSecret = verifyApiSecret(apiSecret, developer.api_secret);
    
    if (!isValidSecret) {
      return res.status(401).json({
        error: 'Invalid API secret',
        message: 'API secret does not match'
      });
    }

    // Attach developer info to request
    req.developer = {
      id: developer.id,
      name: developer.name,
      email: developer.email
    };

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Optional authentication - continues even if no API key provided
 * Useful for endpoints that work both with and without authentication
 */
async function optionalApiAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];

  if (!apiKey || !apiSecret) {
    req.developer = null;
    return next();
  }

  // If credentials provided, validate them
  return authenticateApiKey(req, res, next);
}

module.exports = {
  authenticateApiKey,
  optionalApiAuth
};
