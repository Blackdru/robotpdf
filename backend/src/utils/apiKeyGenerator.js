const crypto = require('crypto');

function generateApiKey(isTest = false) {
  const prefix = isTest ? 'pk_test_' : 'pk_live_';
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .substring(0, 32);
  
  return prefix + key;
}

function generateApiSecret(isTest = false) {
  const prefix = isTest ? 'sk_test_' : 'sk_live_';
  const randomBytes = crypto.randomBytes(48);
  const secret = randomBytes.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .substring(0, 48);
  
  return prefix + secret;
}

/**
 * Hash API secret for secure storage
 */
function hashApiSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Verify API secret against stored hash
 */
function verifyApiSecret(secret, hash) {
  const secretHash = hashApiSecret(secret);
  return crypto.timingSafeEqual(
    Buffer.from(secretHash),
    Buffer.from(hash)
  );
}

/**
 * Generate both API key and secret pair
 */
function generateApiKeyPair(isTest = false) {
  return {
    apiKey: generateApiKey(isTest),
    apiSecret: generateApiSecret(isTest)
  };
}

/**
 * Validate API key format
 */
function isValidApiKeyFormat(apiKey) {
  return /^pk_(live|test)_[A-Za-z0-9]{32}$/.test(apiKey);
}

/**
 * Validate API secret format
 */
function isValidApiSecretFormat(apiSecret) {
  return /^sk_(live|test)_[A-Za-z0-9]{48}$/.test(apiSecret);
}

module.exports = {
  generateApiKey,
  generateApiSecret,
  hashApiSecret,
  verifyApiSecret,
  generateApiKeyPair,
  isValidApiKeyFormat,
  isValidApiSecretFormat
};
