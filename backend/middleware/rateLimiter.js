
// Rate limiter with test bypass
const rateLimit = require('express-rate-limit');

// Test environment bypass
if (process.env.NODE_ENV === 'test') {
  module.exports = (req, res, next) => {
    console.log('⚠️  Rate limiting bypassed for test environment');
    next();
  };
} else {
  // Production rate limiting
  module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
}
