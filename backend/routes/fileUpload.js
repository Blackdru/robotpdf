
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for testing
    cb(null, true);
  }
});

// Upload endpoint with comprehensive error handling
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    console.log('📁 Upload request received');
    console.log('File in request:', !!req.file);
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Request must include a file in the "file" field'
      });
    }
    
    console.log('✅ File uploaded:', req.file.filename);
    console.log('File details:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    const fileInfo = {
      id: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedAt: new Date().toISOString()
    };
    
    res.status(201).json({ 
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo 
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get file info endpoint
router.get('/:fileId', (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.fileId);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({
        id: req.params.fileId,
        exists: true,
        size: stats.size,
        modified: stats.mtime
      });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error checking file' });
  }
});

// Delete file endpoint
router.delete('/:fileId', (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.fileId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️  File deleted:', req.params.fileId);
    }
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// Health check endpoint
router.get('/health/check', (req, res) => {
  res.json({ 
    status: 'healthy',
    uploadsDir: uploadsDir,
    dirExists: fs.existsSync(uploadsDir)
  });
});

module.exports = router;
