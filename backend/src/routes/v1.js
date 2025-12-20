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
const { createFileResponse } = require('../utils/fileEncoder');

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

// POST /v1/ocr - Enhanced OCR with AI
router.post('/ocr', trackApiUsage('ocr_pro'), upload.single('file'), async (req, res) => {
  try {
    console.log('=== V1 OCR API ENDPOINT CALLED ===');
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF or image file'
      });
    }

    const { 
      language = 'auto',
      enhance_image = 'true',
      ai_enhanced = 'true',
      extract_original = 'false'
    } = req.body;

    console.log('OCR API Settings:', { 
      language, 
      enhance_image, 
      ai_enhanced, 
      extract_original,
      fileType: req.file.mimetype,
      fileName: req.file.originalname
    });

    // Upload file to storage first
    const userFolder = req.developer.id;
    const filePath = `${userFolder}/${Date.now()}-${req.file.originalname}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('files')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Save file metadata
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('files')
      .insert([{
        user_id: null, // API files don't have user_id
        filename: req.file.originalname,
        original_name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        path: uploadData.path,
        metadata: {
          api_request: true,
          developer_id: req.developer.id
        }
      }])
      .select()
      .single();

    if (fileError) {
      await supabaseAdmin.storage.from('files').remove([uploadData.path]);
      throw new Error(`Failed to save file metadata: ${fileError.message}`);
    }

    // Perform enhanced OCR
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
    console.log('Calling ocrService.extractTextWithAI with options:', {
      language: language,
      enhanceImage: enhance_image === 'true',
      enhanceWithAI: ai_enhanced === 'true',
      extractOriginal: extract_original === 'true',
      fileType: fileType
    });
    
    const result = await ocrService.extractTextWithAI(req.file.buffer, {
      language: language,
      enhanceImage: enhance_image === 'true',
      enhanceWithAI: ai_enhanced === 'true',
      extractOriginal: extract_original === 'true',
      fileType: fileType
    });

    console.log('OCR Result:', {
      textLength: result.text?.length,
      originalTextLength: result.originalText?.length,
      enhancedTextLength: result.enhancedText?.length,
      aiEnhanced: result.aiEnhanced,
      localCleaned: result.localCleaned,
      confidence: result.confidence
    });

    // Clean up uploaded file
    await supabaseAdmin.storage.from('files').remove([uploadData.path]);
    await supabaseAdmin.from('files').delete().eq('id', fileData.id);

    res.json({
      success: true,
      data: {
        text: result.text,
        original_text: result.originalText,
        enhanced_text: result.enhancedText,
        detected_language: result.detectedLanguage,
        confidence: result.confidence,
        page_count: result.pageCount,
        pages: result.pages,
        ai_enhanced: result.aiEnhanced,
        processing_options: result.processingOptions
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
      data: createFileResponse(result.buffer, {
        original_size: req.file.size,
        compressed_size: result.size,
        compression_ratio: ((1 - result.size / req.file.size) * 100).toFixed(2) + '%',
        filename: req.file.originalname
      })
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
      data: createFileResponse(result.buffer, {
        page_count: req.files.length,
        filename: 'converted.pdf'
      })
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
      data: createFileResponse(result, {
        format: 'docx',
        filename: req.file.originalname.replace(/\.pdf$/i, '.docx')
      })
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

    const result = await officeConversionService.pdfBufferToExcel(req.file.buffer);

    res.json({
      success: true,
      data: createFileResponse(result, {
        format: 'xlsx',
        filename: req.file.originalname.replace(/\.pdf$/i, '.xlsx')
      })
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
      data: createFileResponse(result, {
        format: 'pptx',
        filename: req.file.originalname.replace(/\.pdf$/i, '.pptx')
      })
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
      data: createFileResponse(result.buffer, {
        file_count: req.files.length,
        filename: 'merged.pdf'
      })
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

    const { pages, split_mode = 'single' } = req.body;
    
    if (!pages) {
      return res.status(400).json({
        error: 'Missing pages parameter',
        message: 'Please specify which pages to extract (e.g., "1-3,5,7-9") or "all" to split into individual pages'
      });
    }

    // If split_mode is 'individual', split into separate PDFs and return as ZIP
    if (split_mode === 'individual' || pages === 'all') {
      const archiver = require('archiver');
      const PDFLib = require('pdf-lib');
      const sourcePdf = await PDFLib.PDFDocument.load(req.file.buffer);
      const totalPages = sourcePdf.getPageCount();
      
      // Create ZIP archive in memory
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];
      
      archive.on('data', chunk => chunks.push(chunk));
      archive.on('error', err => { throw err; });
      
      const archivePromise = new Promise((resolve) => {
        archive.on('end', () => resolve(Buffer.concat(chunks)));
      });
      
      // Split each page into individual PDF
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFLib.PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        
        const filename = `page_${i + 1}.pdf`;
        archive.append(Buffer.from(pdfBytes), { name: filename });
      }
      
      archive.finalize();
      const zipBuffer = await archivePromise;
      
      res.json({
        success: true,
        data: createFileResponse(zipBuffer, {
          page_count: totalPages,
          file_count: totalPages,
          format: 'zip',
          filename: req.file.originalname.replace(/\.pdf$/i, '_split.zip')
        })
      });
    } else {
      // Single PDF with selected pages
      const result = await advancedPdfService.splitPdf(req.file.buffer, pages);
      
      res.json({
        success: true,
        data: createFileResponse(result.buffer, {
          page_count: result.pageCount,
          filename: req.file.originalname.replace(/\.pdf$/i, '_split.pdf')
        })
      });
    }
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
      data: createFileResponse(buffer, {
        format: format,
        filename: `resume_${Date.now()}.${format}`
      })
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
