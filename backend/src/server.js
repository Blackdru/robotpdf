const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import cleanup scheduler
const cleanupScheduler = require('./services/cleanupScheduler');
const subscriptionExpiryService = require('./services/subscriptionExpiryService');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const fileRoutes = require('./routes/files');
const pdfRoutes = require('./routes/pdf');
const advancedPdfRoutes = require('./routes/advancedPdf');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const batchRoutes = require('./routes/batch');
const folderRoutes = require('./routes/folders');
const subscriptionRoutes = require('./routes/subscriptions');
const webhookRoutes = require('./routes/webhooks');
const contactRoutes = require('./routes/contact');
const resumeRoutes = require('./routes/resumes');
const v1ApiRoutes = require('./routes/v1');
const developerRoutes = require('./routes/developers');
const devPortalRoutes = require('./routes/devPortal');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required when behind reverse proxy (Nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      // HTTPS (Production - Recommended)
      'https://robotpdf.com',
      'https://www.robotpdf.com',
      'https://server.robotpdf.com',
      // HTTP (Non-SSL - For testing/staging)
      'http://robotpdf.com',
      'http://www.robotpdf.com',
      'http://server.robotpdf.com'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:19006'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours - cache preflight requests
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing middleware - Increased limits for advanced tools
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
console.log('Loading routes...');
app.use('/api/auth', authRoutes);
console.log('Auth routes loaded');
app.use('/api/users', userRoutes);
console.log('User routes loaded');
app.use('/api/files', fileRoutes);
console.log('File routes loaded');
app.use('/api/pdf', pdfRoutes);
console.log('PDF routes loaded');
app.use('/api/pdf/advanced', advancedPdfRoutes);
console.log('Advanced PDF routes loaded');
app.use('/api/admin', adminRoutes);
console.log('Admin routes loaded');
app.use('/api/ai', aiRoutes);
console.log('AI routes loaded');
app.use('/api/batch', batchRoutes);
console.log('Batch routes loaded');
app.use('/api/folders', folderRoutes);
console.log('Folder routes loaded');
app.use('/api/subscriptions', subscriptionRoutes);
console.log('Subscription routes loaded');
app.use('/api/webhooks', webhookRoutes);
console.log('Webhook routes loaded');
app.use('/api/contact', contactRoutes);
console.log('Contact routes loaded');
app.use('/api/v1', v1ApiRoutes);
console.log('V1 Developer API routes loaded');
app.use('/api/resumes', resumeRoutes);
console.log('Resume routes loaded (web app)');
app.use('/api/developers', developerRoutes);
console.log('Developer management routes loaded');
app.use('/api/dev', devPortalRoutes);
console.log('Developer portal routes loaded');
app.use('/api/analytics', analyticsRoutes);
console.log('Analytics routes loaded');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size exceeds the limit. Free tools support up to 10MB, Advanced tools support up to 100MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum 10 files at once.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected field in file upload.' 
      });
    }
    return res.status(400).json({ 
      error: `File upload error: ${err.message}` 
    });
  }
  
  // Handle file type errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  
  // Handle timeout errors
  if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
    return res.status(408).json({ 
      error: 'Request timeout. Please try again with a smaller file or check your connection.' 
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Start cleanup scheduler
  cleanupScheduler.start();
  
  // Start subscription expiry checker
  subscriptionExpiryService.startPeriodicCheck();
});

// Increase timeout for long-running operations (OCR, AI processing, large files)
server.timeout = 600000; // 10 minutes for large file processing
server.keepAliveTimeout = 600000; // 10 minutes
server.headersTimeout = 610000; // Slightly more than keepAliveTimeout

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  cleanupScheduler.stop();
  subscriptionExpiryService.stopPeriodicCheck();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  cleanupScheduler.stop();
  subscriptionExpiryService.stopPeriodicCheck();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;