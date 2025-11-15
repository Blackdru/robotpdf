const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateApiKey } = require('../middleware/apiAuth');
const { checkRateLimit } = require('../middleware/apiRateLimit');
const { trackApiUsage } = require('../middleware/apiUsageTracker');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const advancedPdfService = require('../services/advancedPdfService');
const officeConversionService = require('../services/officeConversionService');
const resumeGenerator = require('../services/resumeGenerator');
const resumeExport = require('../services/resumeExport');
const { supabaseAdmin } = require('../config/supabase');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, images (JPEG, PNG, TIFF, BMP, WebP), and Office documents.`));
    }
  }
});

// Apply API authentication and rate limiting to all routes
router.use(authenticateApiKey);
router.use(checkRateLimit);

// Health check endpoint
router.get('/health', trackApiUsage('health'), (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    developer: {
      id: req.developer.id,
      name: req.developer.name
    }
  });
});

// Get usage statistics
router.get('/usage', trackApiUsage('usage_stats'), async (req, res) => {
  try {
    const developerId = req.developer.id;
    
    // Get limits
    const { data: limits } = await supabaseAdmin
      .from('developer_limits')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    // Get usage
    const { data: usage } = await supabaseAdmin
      .from('developer_usage')
      .select('*')
      .eq('developer_id', developerId);

    res.json({
      success: true,
      data: {
        monthly_limit: limits?.monthly_limit || 0,
        current_month_used: limits?.current_month_used || 0,
        remaining: (limits?.monthly_limit || 0) - (limits?.current_month_used || 0),
        rate_limit_per_minute: limits?.rate_limit_per_minute || 100,
        current_month: limits?.current_month,
        tools: usage || []
      }
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: error.message
    });
  }
});

// POST /v1/ocr - Advanced OCR Pro
router.post('/ocr', trackApiUsage('ocr_pro'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF or image file'
      });
    }

    const { language = 'eng', enhance = 'true' } = req.body;
    
    const result = await ocrService.extractTextFromImage(req.file.buffer, {
      language: language,
      enhanceImage: enhance === 'true'
    });

    res.json({
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        language: language,
        page_count: 1
      }
    });
  } catch (error) {
    console.error('OCR API error:', error);
    res.status(500).json({
      error: 'OCR processing failed',
      message: error.message
    });
  }
});

// POST /v1/chat - AI Document Chat
router.post('/chat', trackApiUsage('chat_pdf'), async (req, res) => {
  try {
    const { document_text, message, context = [] } = req.body;

    if (!document_text || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'document_text and message are required'
      });
    }

    const relevantChunks = [{ chunk_text: document_text.substring(0, 10000) }];
    const response = await aiService.chatWithPDF(message, relevantChunks, context);

    res.json({
      success: true,
      data: {
        response: response,
        model: aiService.model
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Chat processing failed',
      message: error.message
    });
  }
});

// POST /v1/summarize - Smart Summary Pro
router.post('/summarize', trackApiUsage('summarize'), async (req, res) => {
  try {
    const { text, summary_type = 'auto' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'text is required'
      });
    }

    const summary = await aiService.summarizeText(text, summary_type);

    res.json({
      success: true,
      data: {
        summary: summary,
        word_count: summary.split(/\s+/).length,
        summary_type: summary_type
      }
    });
  } catch (error) {
    console.error('Summarize API error:', error);
    res.status(500).json({
      error: 'Summarization failed',
      message: error.message
    });
  }
});

// POST /v1/compress - Smart Compress Pro
router.post('/compress', trackApiUsage('compress'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF file'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }

    const { quality = 'medium' } = req.body;
    
    const result = await advancedPdfService.compressPdf(req.file.buffer, {
      quality: quality
    });

    res.json({
      success: true,
      data: {
        original_size: req.file.size,
        compressed_size: result.size,
        compression_ratio: ((1 - result.size / req.file.size) * 100).toFixed(2) + '%',
        file_base64: result.buffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Compress API error:', error);
    res.status(500).json({
      error: 'Compression failed',
      message: error.message
    });
  }
});

// POST /v1/images-to-pdf - Images to PDF Pro
router.post('/images-to-pdf', trackApiUsage('images_to_pdf'), upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please upload at least one image file'
      });
    }

    const imageBuffers = req.files.map(file => file.buffer);
    const result = await advancedPdfService.imagesToPdf(imageBuffers, {
      pageSize: req.body.page_size || 'A4',
      orientation: req.body.orientation || 'portrait'
    });

    res.json({
      success: true,
      data: {
        page_count: req.files.length,
        file_size: result.size,
        file_base64: result.buffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Images to PDF API error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// POST /v1/convert/pdf-to-docx - PDF to Office Converter
router.post('/convert/pdf-to-docx', trackApiUsage('pdf_to_docx'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF file'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }

    const result = await officeConversionService.pdfToDocx(req.file.buffer);

    res.json({
      success: true,
      data: {
        file_size: result.length,
        file_base64: result.toString('base64'),
        format: 'docx'
      }
    });
  } catch (error) {
    console.error('PDF to DOCX API error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// POST /v1/convert/pdf-to-excel - PDF to Excel
router.post('/convert/pdf-to-excel', trackApiUsage('pdf_to_excel'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF file'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }

    const result = await officeConversionService.pdfToExcel(req.file.buffer);

    res.json({
      success: true,
      data: {
        file_size: result.length,
        file_base64: result.toString('base64'),
        format: 'xlsx'
      }
    });
  } catch (error) {
    console.error('PDF to Excel API error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// POST /v1/convert/pdf-to-ppt - PDF to PowerPoint
router.post('/convert/pdf-to-ppt', trackApiUsage('pdf_to_ppt'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF file'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }

    const result = await officeConversionService.pdfToPpt(req.file.buffer);

    res.json({
      success: true,
      data: {
        file_size: result.length,
        file_base64: result.toString('base64'),
        format: 'pptx'
      }
    });
  } catch (error) {
    console.error('PDF to PPT API error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// POST /v1/merge - Merge PDFs
router.post('/merge', trackApiUsage('merge_pdf'), upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        error: 'Insufficient files',
        message: 'Please upload at least 2 PDF files to merge'
      });
    }

    const pdfBuffers = req.files.map(file => file.buffer);
    const result = await advancedPdfService.mergePdfs(pdfBuffers);

    res.json({
      success: true,
      data: {
        file_count: req.files.length,
        file_size: result.size,
        file_base64: result.buffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Merge PDF API error:', error);
    res.status(500).json({
      error: 'Merge failed',
      message: error.message
    });
  }
});

// POST /v1/split - Split PDF
router.post('/split', trackApiUsage('split_pdf'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF file'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }

    const { pages } = req.body;
    
    if (!pages) {
      return res.status(400).json({
        error: 'Missing pages parameter',
        message: 'Please specify which pages to extract (e.g., "1-3,5,7-9")'
      });
    }

    const result = await advancedPdfService.splitPdf(req.file.buffer, pages);

    res.json({
      success: true,
      data: {
        page_count: result.pageCount,
        file_size: result.size,
        file_base64: result.buffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Split PDF API error:', error);
    res.status(500).json({
      error: 'Split failed',
      message: error.message
    });
  }
});

// POST /v1/resumes/generate - AI Resume Generator
router.post('/resumes/generate', trackApiUsage('resume_generate'), async (req, res) => {
  try {
    const { userData, options } = req.body;

    if (!userData || !userData.name || !userData.email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userData with name and email is required'
      });
    }

    const validation = resumeGenerator.validateMandatoryFields(userData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing mandatory fields',
        message: `Required fields: ${validation.missingFields.join(', ')}`,
        missingFields: validation.missingFields
      });
    }

    const generatedResume = await resumeGenerator.generateResume(userData, options);

    res.json({
      success: true,
      data: {
        resume: generatedResume,
        metadata: {
          generatedAt: generatedResume.metadata.generatedAt,
          model: generatedResume.metadata.model
        }
      }
    });
  } catch (error) {
    console.error('Resume generation API error:', error);
    res.status(500).json({
      error: 'Resume generation failed',
      message: error.message
    });
  }
});

// POST /v1/resumes/export - Export Resume to PDF/DOCX
router.post('/resumes/export', trackApiUsage('resume_export'), async (req, res) => {
  try {
    const { resumeData, format = 'pdf' } = req.body;

    if (!resumeData) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'resumeData is required'
      });
    }

    if (!['pdf', 'docx'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Format must be either pdf or docx'
      });
    }

    const path = require('path');
    const fs = require('fs').promises;
    const tempDir = path.join(__dirname, '../../temp');
    const filename = `resume_${Date.now()}`;
    let outputPath;
    let buffer;

    if (format === 'pdf') {
      outputPath = path.join(tempDir, `${filename}.pdf`);
      await resumeExport.generatePDF(resumeData, outputPath);
      buffer = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(console.error);
    } else {
      outputPath = path.join(tempDir, `${filename}.docx`);
      await resumeExport.generateWord(resumeData, outputPath);
      buffer = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(console.error);
    }

    res.json({
      success: true,
      data: {
        format: format,
        file_size: buffer.length,
        file_base64: buffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Resume export API error:', error);
    res.status(500).json({
      error: 'Resume export failed',
      message: error.message
    });
  }
});

// GET /v1/resumes/templates - Get Available Templates
router.get('/resumes/templates', trackApiUsage('resume_templates'), (req, res) => {
  try {
    const templates = resumeGenerator.getTemplates();
    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('Templates API error:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

// GET /v1/resumes/industries - Get Available Industries
router.get('/resumes/industries', trackApiUsage('resume_industries'), (req, res) => {
  try {
    const industries = resumeGenerator.getIndustries();
    res.json({
      success: true,
      data: { industries }
    });
  } catch (error) {
    console.error('Industries API error:', error);
    res.status(500).json({
      error: 'Failed to fetch industries',
      message: error.message
    });
  }
});

// GET /v1/resumes/experience-levels - Get Experience Levels
router.get('/resumes/experience-levels', trackApiUsage('resume_levels'), (req, res) => {
  try {
    const levels = resumeGenerator.getExperienceLevels();
    res.json({
      success: true,
      data: { levels }
    });
  } catch (error) {
    console.error('Experience levels API error:', error);
    res.status(500).json({
      error: 'Failed to fetch experience levels',
      message: error.message
    });
  }
});

// Error handler for this router
router.use((error, req, res, next) => {
  console.error('V1 API Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 100MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 10 files allowed'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message
  });
});

module.exports = router;
