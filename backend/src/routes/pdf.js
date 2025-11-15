const express = require('express');
const { PDFDocument } = require('pdf-lib');
const PDFKit = require('pdfkit');
const sharp = require('sharp');
const archiver = require('archiver');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser, optionalAuth } = require('../middleware/auth');
const { 
  enforceFileLimit, 
  trackUsage, 
  enforceBatchLimit,
  requireFeature 
} = require('../middleware/subscriptionMiddleware');

const router = express.Router();

// Helper function to get file buffer from Supabase Storage
const getFileBuffer = async (filePath) => {
  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
};

// Helper function to save processed file
const saveProcessedFile = async (userId, buffer, filename, mimetype, isAnonymous = false) => {
  const userFolder = userId || 'anonymous';
  const filePath = `${userFolder}/processed/${Date.now()}-${filename}`;

  // Upload to storage with retry logic
  let uploadData, uploadError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await supabaseAdmin.storage
      .from('files')
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false
      });
    
    uploadData = result.data;
    uploadError = result.error;
    
    if (!uploadError) break;
    
    console.log(`Upload attempt ${attempt} failed:`, uploadError.message);
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  if (uploadError) {
    console.error('All upload attempts failed:', uploadError);
    throw new Error(`Failed to save processed file after 3 attempts: ${uploadError.message}`);
  }

  // Save metadata to database
  const { data: fileData, error: dbError } = await supabaseAdmin
    .from('files')
    .insert([
      {
        user_id: userId || null,
        filename: filename,
        path: uploadData.path,
        type: mimetype,
        size: buffer.length,
        is_anonymous: isAnonymous,
        expires_at: isAnonymous ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      }
    ])
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabaseAdmin.storage.from('files').remove([uploadData.path]);
    throw new Error(`Database error: ${dbError.message}`);
  }

  return fileData;
};

// Helper function to log operation
const logOperation = async (userId, fileId, action) => {
  await supabaseAdmin
    .from('history')
    .insert([
      {
        user_id: userId,
        file_id: fileId,
        action: action
      }
    ]);
};

// Merge PDFs - supports both authenticated and anonymous users
router.post('/merge', 
  optionalAuth,
  async (req, res) => {
  try {
    const { fileIds, outputName = 'merged.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== MERGE PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File IDs:', fileIds);

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 files are required for merging' });
    }

    // Get file metadata - different query for authenticated vs anonymous
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .in('id', fileIds);

    if (req.user) {
      // Authenticated user - check ownership
      query = query.eq('user_id', req.user.id);
    } else {
      // Anonymous user - check for anonymous files
      query = query.is('user_id', null);
    }

    const { data: files, error: filesError } = await query;

    if (filesError || !files || files.length !== fileIds.length) {
      console.log('Files error:', filesError);
      console.log('Found files:', files?.length, 'Expected:', fileIds.length);
      return res.status(404).json({ error: 'One or more files not found or access denied' });
    }

    // Verify all files are PDFs
    const nonPdfFiles = files.filter(file => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      return res.status(400).json({ error: 'All files must be PDFs for merging' });
    }

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const fileBuffer = await getFileBuffer(file.path);
      const pdf = await PDFDocument.load(fileBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBuffer = Buffer.from(await mergedPdf.save());

    // Save merged file
    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      mergedBuffer,
      outputName,
      'application/pdf',
      isAnonymous
    );

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, 'merge');
    }

    console.log('Merge completed successfully:', savedFile.id);

    res.json({
      message: 'PDFs merged successfully',
      file: savedFile,
      isAnonymous: isAnonymous
    });
  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message || 'PDF merge failed' });
  }
});

// Split PDF - supports both authenticated and anonymous users
router.post('/split', optionalAuth, async (req, res) => {
  try {
    const { fileId, pages, outputName = 'split.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== SPLIT PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get file metadata - different query for authenticated vs anonymous
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId);

    if (req.user) {
      query = query.eq('user_id', req.user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data: file, error: fileError } = await query.single();

    if (fileError || !file) {
      console.log('File error:', fileError);
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    if (file.type !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const fileBuffer = await getFileBuffer(file.path);
    const pdf = await PDFDocument.load(fileBuffer);
    const totalPages = pdf.getPageCount();

    // If no specific pages provided, split into individual pages
    if (!pages || !Array.isArray(pages)) {
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${outputName.replace('.pdf', '')}_split.zip"`);
      
      archive.pipe(res);

      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);

        const splitBuffer = Buffer.from(await newPdf.save());
        const fileName = `${outputName.replace('.pdf', '')}_page_${i + 1}.pdf`;
        
        archive.append(splitBuffer, { name: fileName });
      }

      // Log operation (only for authenticated users)
      if (req.user) {
        await logOperation(req.user.id, file.id, 'split');
      }
      
      console.log('Split completed successfully (zip)');
      await archive.finalize();
      return;
    }

    // Split specific pages
    const validPages = pages.filter(p => p >= 1 && p <= totalPages);
    if (validPages.length === 0) {
      return res.status(400).json({ error: 'No valid page numbers provided' });
    }

    const newPdf = await PDFDocument.create();
    const pageIndices = validPages.map(p => p - 1); // Convert to 0-based index
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const splitBuffer = Buffer.from(await newPdf.save());
    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      splitBuffer,
      outputName,
      'application/pdf',
      isAnonymous
    );

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, 'split');
    }

    console.log('Split completed successfully:', savedFile.id);

    res.json({
      message: 'PDF split successfully',
      file: savedFile,
      isAnonymous: isAnonymous
    });
  } catch (error) {
    console.error('Split error:', error);
    res.status(500).json({ error: error.message || 'PDF split failed' });
  }
});

// Compress PDF - supports both authenticated and anonymous users
router.post('/compress', optionalAuth, async (req, res) => {
  try {
    const { fileId, quality = 0.7, outputName = 'compressed.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== COMPRESS PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get file metadata - different query for authenticated vs anonymous
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId);

    if (req.user) {
      query = query.eq('user_id', req.user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data: file, error: fileError } = await query.single();

    if (fileError || !file) {
      console.log('File error:', fileError);
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    if (file.type !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const fileBuffer = await getFileBuffer(file.path);
    const pdf = await PDFDocument.load(fileBuffer);

    // Try multiple compression strategies
    let compressedBuffer;
    let compressionWorked = false;
    
    // Strategy 1: Basic compression
    try {
      compressedBuffer = Buffer.from(await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
        updateFieldAppearances: false
      }));
      
      if (compressedBuffer.length < fileBuffer.length) {
        compressionWorked = true;
      }
    } catch (error) {
      console.log('Basic compression failed:', error.message);
    }
    
    // Strategy 2: More aggressive compression if basic didn't work
    if (!compressionWorked) {
      try {
        compressedBuffer = Buffer.from(await pdf.save({
          useObjectStreams: false,
          addDefaultPage: false,
          objectsPerTick: 10,
          updateFieldAppearances: false
        }));
        
        if (compressedBuffer.length < fileBuffer.length) {
          compressionWorked = true;
        }
      } catch (error) {
        console.log('Aggressive compression failed:', error.message);
      }
    }
    
    // If no compression worked, return the original with a message
    if (!compressionWorked || compressedBuffer.length >= fileBuffer.length) {
      // Return original file as "compressed" with a note
      const savedFile = await saveProcessedFile(
        req.user?.id || null,
        fileBuffer,
        outputName.replace('.pdf', '_already_optimized.pdf'),
        'application/pdf',
        isAnonymous
      );
      
      // Log operation (only for authenticated users)
      if (req.user) {
        await logOperation(req.user.id, savedFile.id, 'compress');
      }
      
      console.log('Compress completed (already optimized):', savedFile.id);
      
      return res.json({
        message: 'PDF is already well optimized. Original file returned.',
        file: savedFile,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: '0%',
        note: 'File was already optimized',
        isAnonymous: isAnonymous
      });
    }

    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      compressedBuffer,
      outputName,
      'application/pdf',
      isAnonymous
    );

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, 'compress');
    }

    const compressionRatio = ((file.size - compressedBuffer.length) / file.size * 100).toFixed(1);

    console.log('Compress completed successfully:', savedFile.id);

    res.json({
      message: 'PDF compressed successfully',
      file: savedFile,
      originalSize: file.size,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      isAnonymous: isAnonymous
    });
  } catch (error) {
    console.error('Compress error:', error);
    res.status(500).json({ error: error.message || 'PDF compression failed' });
  }
});

// Convert images to PDF - supports both authenticated and anonymous users
router.post('/convert/images-to-pdf', optionalAuth, async (req, res) => {
  try {
    const { fileIds, outputName = 'converted.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== CONVERT IMAGES TO PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File IDs:', fileIds);

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least 1 image file is required' });
    }

    // Get file metadata - different query for authenticated vs anonymous
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .in('id', fileIds);

    if (req.user) {
      query = query.eq('user_id', req.user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data: files, error: filesError } = await query;

    if (filesError || !files || files.length !== fileIds.length) {
      console.log('Files error:', filesError);
      console.log('Found files:', files?.length, 'Expected:', fileIds.length);
      return res.status(404).json({ error: 'One or more files not found or access denied' });
    }

    // Verify all files are images
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const nonImageFiles = files.filter(file => !imageTypes.includes(file.type));
    if (nonImageFiles.length > 0) {
      console.log('File types found:', files.map(f => ({ name: f.filename, type: f.type })));
      return res.status(400).json({ 
        error: 'All files must be images (JPEG, JPG, PNG, GIF, WebP)',
        foundTypes: files.map(f => f.type)
      });
    }

    const pdf = await PDFDocument.create();

    for (const file of files) {
      const imageBuffer = await getFileBuffer(file.path);
      
      // Process image with sharp to ensure compatibility
      let processedImage;
      let image;
      
      if (file.type === 'image/png') {
        processedImage = await sharp(imageBuffer)
          .png({ quality: 90 })
          .toBuffer();
        image = await pdf.embedPng(processedImage);
      } else {
        processedImage = await sharp(imageBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        image = await pdf.embedJpg(processedImage);
      }

      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const pdfBuffer = Buffer.from(await pdf.save());

    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      pdfBuffer,
      outputName,
      'application/pdf',
      isAnonymous
    );

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, 'convert');
    }

    console.log('Convert completed successfully:', savedFile.id);

    res.json({
      message: 'Images converted to PDF successfully',
      file: savedFile,
      isAnonymous: isAnonymous
    });
  } catch (error) {
    console.error('Convert images error:', error);
    res.status(500).json({ error: error.message || 'Image to PDF conversion failed' });
  }
});

// HTML to PDF - Convert webpage URL to PDF
router.post('/html-to-pdf', optionalAuth, async (req, res) => {
  try {
    const { url, outputName = 'webpage.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== HTML TO PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('URL:', url);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use puppeteer to convert HTML to PDF
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (err) {
      console.error('Puppeteer not available:', err);
      return res.status(503).json({ 
        error: 'HTML to PDF conversion is temporarily unavailable.' 
      });
    }
    
    let browser;
    try {
      // Launch browser - use system Chromium on ARM architecture
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-software-rasterizer'
        ],
        timeout: 30000
      }).catch(err => {
        console.error('Browser launch failed:', err);
        throw new Error('Failed to initialize browser.');
      });

      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });

      // Navigate to URL with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();

      // Save PDF file
      const savedFile = await saveProcessedFile(
        req.user?.id || null,
        pdfBuffer,
        outputName,
        'application/pdf',
        isAnonymous
      );

      // Log operation (only for authenticated users)
      if (req.user) {
        await logOperation(req.user.id, savedFile.id, 'html-to-pdf');
      }

      console.log('HTML to PDF completed successfully:', savedFile.id);

      res.json({
        message: 'Webpage converted to PDF successfully',
        file: savedFile,
        isAnonymous: isAnonymous
      });

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }

  } catch (error) {
    console.error('HTML to PDF error:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: 'Request timeout. The webpage took too long to load.' });
    }
    
    if (error.message.includes('net::ERR') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      return res.status(400).json({ error: 'Failed to load webpage. Please check the URL and try again.' });
    }
    
    if (error.message.includes('Failed to save processed file')) {
      return res.status(500).json({ error: 'Failed to save PDF. Storage service may be unavailable.' });
    }
    
    if (error.message.includes('Failed to initialize browser')) {
      return res.status(503).json({ error: 'PDF generation service is temporarily unavailable.' });
    }
    
    res.status(500).json({ error: error.message || 'HTML to PDF conversion failed' });
  }
});

// HTML File to PDF - Convert uploaded HTML file to PDF
router.post('/html-file-to-pdf', optionalAuth, async (req, res) => {
  try {
    const { fileId, outputName = 'webpage.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== HTML FILE TO PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get file metadata
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId);

    if (req.user) {
      query = query.eq('user_id', req.user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data: file, error: fileError } = await query.single();

    if (fileError || !file) {
      console.log('File error:', fileError);
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Validate file type
    if (!file.type.includes('html') && !file.filename.match(/\.(html|htm)$/i)) {
      return res.status(400).json({ error: 'File must be an HTML file (.html or .htm)' });
    }

    // Get file buffer
    const fileBuffer = await getFileBuffer(file.path);
    const htmlContent = fileBuffer.toString('utf-8');

    // Use puppeteer to convert HTML to PDF
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (err) {
      console.error('Puppeteer not available:', err);
      return res.status(503).json({ 
        error: 'HTML to PDF conversion is temporarily unavailable.' 
      });
    }
    
    let browser;
    try {
      // Launch browser - use system Chromium on ARM architecture
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-software-rasterizer'
        ],
        timeout: 30000
      }).catch(err => {
        console.error('Browser launch failed:', err);
        throw new Error('Failed to initialize browser.');
      });

      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });

      // Set HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();

      // Save PDF file
      const savedFile = await saveProcessedFile(
        req.user?.id || null,
        pdfBuffer,
        outputName,
        'application/pdf',
        isAnonymous
      );

      // Log operation (only for authenticated users)
      if (req.user) {
        await logOperation(req.user.id, savedFile.id, 'html-file-to-pdf');
      }

      console.log('HTML file to PDF completed successfully:', savedFile.id);

      res.json({
        message: 'HTML file converted to PDF successfully',
        file: savedFile,
        isAnonymous: isAnonymous
      });

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }

  } catch (error) {
    console.error('HTML file to PDF error:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: 'Request timeout. The HTML file took too long to process.' });
    }
    
    res.status(500).json({ error: error.message || 'HTML file to PDF conversion failed' });
  }
});

// Simple Convert - PDF to Word, Word to PDF, PDF to Excel, Excel to PDF
router.post('/simple-convert', optionalAuth, async (req, res) => {
  try {
    const { fileId, outputFormat, sourceFormat } = req.body;
    const isAnonymous = !req.user;

    console.log('=== SIMPLE CONVERT REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);
    console.log('Output Format:', outputFormat);
    console.log('Source Format:', sourceFormat);

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!outputFormat) {
      return res.status(400).json({ error: 'Output format is required' });
    }

    // Get file metadata
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId);

    if (req.user) {
      query = query.eq('user_id', req.user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data: file, error: fileError } = await query.single();

    if (fileError || !file) {
      console.log('File error:', fileError);
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Determine conversion type and output filename
    let outputFilename;
    let outputMimeType;
    let conversionType;

    if (outputFormat === 'docx') {
      // PDF to Word
      outputFilename = file.filename.replace(/\.pdf$/i, '.docx');
      outputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      conversionType = 'pdf-to-word';
    } else if (outputFormat === 'xlsx') {
      // PDF to Excel
      outputFilename = file.filename.replace(/\.pdf$/i, '.xlsx');
      outputMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      conversionType = 'pdf-to-excel';
    } else if (outputFormat === 'pdf' && (sourceFormat === 'word' || sourceFormat === 'excel')) {
      // Office to PDF
      outputFilename = file.filename.replace(/\.(doc|docx|xls|xlsx)$/i, '.pdf');
      outputMimeType = 'application/pdf';
      conversionType = sourceFormat === 'word' ? 'word-to-pdf' : 'excel-to-pdf';
    } else {
      return res.status(400).json({ error: 'Unsupported conversion format' });
    }

    // Get file buffer
    const fileBuffer = await getFileBuffer(file.path);

    let convertedBuffer;

    // Use the new office conversion service
    const officeConversionService = require('../services/officeConversionService');
    
    try {
      if (conversionType === 'pdf-to-word' || conversionType === 'pdf-to-excel') {
        // PDF to Office conversion
        const format = conversionType === 'pdf-to-word' ? 'docx' : 'xlsx';
        convertedBuffer = await officeConversionService.convertPdfToOffice(
          fileBuffer,
          format,
          file.filename
        );
      } else if (conversionType === 'word-to-pdf' || conversionType === 'excel-to-pdf') {
        // Office to PDF conversion
        convertedBuffer = await officeConversionService.convertOfficeToPdf(
          fileBuffer,
          file.type,
          file.filename
        );
      }
    } catch (error) {
      console.error('Conversion error:', error);
      throw new Error(`Failed to convert file: ${error.message}`);
    }

    // Save converted file
    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      convertedBuffer,
      outputFilename,
      outputMimeType,
      isAnonymous
    );

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, conversionType);
    }

    console.log('Simple convert completed successfully:', savedFile.id);

    res.json({
      message: `File converted successfully to ${outputFormat.toUpperCase()}`,
      file: savedFile,
      conversionType: conversionType,
      isAnonymous: isAnonymous
    });

  } catch (error) {
    console.error('Simple convert error:', error);
    res.status(500).json({ error: error.message || 'File conversion failed' });
  }
});

// Get PDF info
router.get('/info/:fileId', authenticateUser, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.type !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const fileBuffer = await getFileBuffer(file.path);
    const pdf = await PDFDocument.load(fileBuffer);

    const info = {
      pageCount: pdf.getPageCount(),
      title: pdf.getTitle() || 'Untitled',
      author: pdf.getAuthor() || 'Unknown',
      subject: pdf.getSubject() || '',
      creator: pdf.getCreator() || 'Unknown',
      producer: pdf.getProducer() || 'Unknown',
      creationDate: pdf.getCreationDate(),
      modificationDate: pdf.getModificationDate(),
      fileSize: file.size,
      filename: file.filename
    };

    res.json({
      file: file,
      info: info
    });
  } catch (error) {
    console.error('PDF info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get PDF info' });
  }
});

module.exports = router;