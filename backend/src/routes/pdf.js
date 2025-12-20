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

  console.log(`[saveProcessedFile] Saving file: ${filename}, path: ${filePath}, size: ${buffer?.length || 0} bytes`);

  if (!buffer || buffer.length === 0) {
    throw new Error('Cannot save empty file buffer');
  }

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
    
    if (!uploadError) {
      console.log(`[saveProcessedFile] Upload successful on attempt ${attempt}, path: ${uploadData?.path}`);
      break;
    }
    
    console.log(`Upload attempt ${attempt} failed:`, uploadError.message);
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  if (uploadError) {
    console.error('All upload attempts failed:', uploadError);
    throw new Error(`Failed to save processed file after 3 attempts: ${uploadError.message}`);
  }

  // Use the path returned by storage (uploadData.path) which is the actual storage path
  const storagePath = uploadData.path || filePath;
  console.log(`[saveProcessedFile] Storage path: ${storagePath}`);

  // Save metadata to database
  const { data: fileData, error: dbError } = await supabaseAdmin
    .from('files')
    .insert([
      {
        user_id: userId || null,
        filename: filename,
        path: storagePath,
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
    await supabaseAdmin.storage.from('files').remove([storagePath]);
    throw new Error(`Database error: ${dbError.message}`);
  }

  console.log(`[saveProcessedFile] File saved successfully with ID: ${fileData.id}`);
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

    // Sort files to match the order of fileIds array
    const orderedFiles = fileIds.map(id => files.find(file => file.id === id)).filter(Boolean);

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    for (const file of orderedFiles) {
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
// Supports 3 modes: 'all-pages', 'single-pdf', 'individual-pdfs'
router.post('/split', optionalAuth, async (req, res) => {
  try {
    const { fileId, pages, splitMode = 'all-pages', outputName = 'split.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== SPLIT PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);
    console.log('Split Mode:', splitMode);
    console.log('Pages:', pages);

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

    // Mode 1: Split all pages into individual PDFs
    if (splitMode === 'all-pages') {
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${outputName.replace('.pdf', '')}_all_pages.zip"`);
      
      archive.pipe(res);

      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);

        const splitBuffer = Buffer.from(await newPdf.save());
        const fileName = `${outputName.replace('.pdf', '')}_page_${i + 1}.pdf`;
        
        archive.append(splitBuffer, { name: fileName });
      }

      if (req.user) {
        await logOperation(req.user.id, file.id, 'split');
      }
      
      console.log('Split completed (all pages to individual PDFs)');
      await archive.finalize();
      return;
    }

    // Validate pages for modes that require them
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'Page numbers are required for this split mode' });
    }

    const validPages = pages.filter(p => p >= 1 && p <= totalPages);
    if (validPages.length === 0) {
      return res.status(400).json({ error: 'No valid page numbers provided' });
    }

    // Mode 2: Combine specified pages into a single PDF
    if (splitMode === 'single-pdf') {
      const newPdf = await PDFDocument.create();
      const pageIndices = validPages.map(p => p - 1);
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

      if (req.user) {
        await logOperation(req.user.id, savedFile.id, 'split');
      }

      console.log('Split completed (pages to single PDF):', savedFile.id);

      res.json({
        message: 'PDF split successfully',
        file: savedFile,
        isAnonymous: isAnonymous
      });
      return;
    }

    // Mode 3: Split specified pages into individual PDFs
    if (splitMode === 'individual-pdfs') {
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${outputName.replace('.pdf', '')}_selected_pages.zip"`);
      
      archive.pipe(res);

      for (const pageNum of validPages) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [pageNum - 1]);
        newPdf.addPage(page);

        const splitBuffer = Buffer.from(await newPdf.save());
        const fileName = `${outputName.replace('.pdf', '')}_page_${pageNum}.pdf`;
        
        archive.append(splitBuffer, { name: fileName });
      }

      if (req.user) {
        await logOperation(req.user.id, file.id, 'split');
      }
      
      console.log('Split completed (selected pages to individual PDFs)');
      await archive.finalize();
      return;
    }

    return res.status(400).json({ error: 'Invalid split mode. Use: all-pages, single-pdf, or individual-pdfs' });
  } catch (error) {
    console.error('Split error:', error);
    res.status(500).json({ error: error.message || 'PDF split failed' });
  }
});

// Compress PDF - supports both authenticated and anonymous users
// Uses Ghostscript for real compression when available, falls back to pdf-lib
router.post('/compress', optionalAuth, async (req, res) => {
  try {
    const { fileId, quality = 'medium', outputName = 'compressed.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== COMPRESS PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);
    console.log('Quality:', quality);

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
    let compressedBuffer;
    let compressionWorked = false;
    let compressionMethod = 'pdf-lib';

    // Try Ghostscript first (better compression)
    try {
      const { spawn } = require('child_process');
      const fs = require('fs').promises;
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `output_${Date.now()}.pdf`);
      
      // Write input file
      await fs.writeFile(inputPath, fileBuffer);
      
      // Map quality to Ghostscript settings
      const qualityMap = {
        'low': '/screen',
        'medium': '/ebook',
        'high': '/printer'
      };
      const gsQuality = qualityMap[quality] || '/ebook';
      
      // Find Ghostscript
      const gsCmd = process.platform === 'win32' ? 'gswin64c' : 'gs';
      
      const gsResult = await new Promise((resolve, reject) => {
        const args = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=${gsQuality}`,
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dDetectDuplicateImages=true',
          '-dCompressFonts=true',
          '-dSubsetFonts=true',
          `-sOutputFile=${outputPath}`,
          inputPath
        ];
        
        const gsProcess = spawn(gsCmd, args, { timeout: 120000 });
        let stderr = '';
        
        gsProcess.stderr.on('data', (data) => { stderr += data.toString(); });
        
        gsProcess.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true });
          } else {
            reject(new Error(`Ghostscript failed: ${stderr}`));
          }
        });
        
        gsProcess.on('error', (err) => {
          reject(new Error(`Ghostscript not available: ${err.message}`));
        });
      });
      
      // Read compressed file
      compressedBuffer = await fs.readFile(outputPath);
      
      // Cleanup temp files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
      
      if (compressedBuffer.length < fileBuffer.length) {
        compressionWorked = true;
        compressionMethod = 'ghostscript';
        console.log('Ghostscript compression successful');
      } else {
        console.log('Ghostscript did not reduce file size');
      }
    } catch (gsError) {
      console.log('Ghostscript compression failed, falling back to pdf-lib:', gsError.message);
    }

    // Fallback to pdf-lib if Ghostscript didn't work
    if (!compressionWorked) {
      const pdf = await PDFDocument.load(fileBuffer);
      
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
        console.log('Basic pdf-lib compression failed:', error.message);
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
          console.log('Aggressive pdf-lib compression failed:', error.message);
        }
      }
    }
    
    // If no compression worked, return the original with a message
    if (!compressionWorked || compressedBuffer.length >= fileBuffer.length) {
      const savedFile = await saveProcessedFile(
        req.user?.id || null,
        fileBuffer,
        outputName.replace('.pdf', '_already_optimized.pdf'),
        'application/pdf',
        isAnonymous
      );
      
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
        note: 'File was already optimized. Try a PDF with images for better compression.',
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

    if (req.user) {
      await logOperation(req.user.id, savedFile.id, 'compress');
    }

    const compressionRatio = ((file.size - compressedBuffer.length) / file.size * 100).toFixed(1);

    console.log(`Compress completed successfully (${compressionMethod}):`, savedFile.id);
    console.log(`Original: ${file.size} bytes, Compressed: ${compressedBuffer.length} bytes (${compressionRatio}% reduction)`);

    res.json({
      message: 'PDF compressed successfully',
      file: savedFile,
      originalSize: file.size,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      method: compressionMethod,
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
    } else if (outputFormat === 'pptx') {
      // PDF to PowerPoint
      outputFilename = file.filename.replace(/\.pdf$/i, '.pptx');
      outputMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      conversionType = 'pdf-to-pptx';
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
      if (conversionType === 'pdf-to-word' || conversionType === 'pdf-to-excel' || conversionType === 'pdf-to-pptx') {
        // PDF to Office conversion
        let format;
        if (conversionType === 'pdf-to-word') format = 'docx';
        else if (conversionType === 'pdf-to-excel') format = 'xlsx';
        else if (conversionType === 'pdf-to-pptx') format = 'pptx';
        
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

    // Verify converted buffer is valid
    if (!convertedBuffer || convertedBuffer.length === 0) {
      throw new Error('Conversion produced empty file');
    }
    
    console.log(`[simple-convert] Converted buffer size: ${convertedBuffer.length} bytes`);

    // Save converted file
    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      convertedBuffer,
      outputFilename,
      outputMimeType,
      isAnonymous
    );

    // Small delay to ensure storage is synced
    await new Promise(resolve => setTimeout(resolve, 500));

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, conversionType);
    }

    console.log('Simple convert completed successfully:', savedFile.id, 'path:', savedFile.path);

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

// Check PDF to Word conversion service status (pdf2docx availability)
router.get('/conversion-status', async (req, res) => {
  try {
    const pdf2docxService = require('../services/pdf2docxService');
    // Force a fresh check to ensure accurate status
    const status = await pdf2docxService.checkAvailability(true);
    
    res.json({
      pdf2docx: {
        available: status.available,
        reason: status.reason || null,
        pythonCommand: status.pythonCommand || null,
        description: status.available 
          ? 'PDF to Word conversion with exact format preservation is available'
          : 'PDF to Word will use basic text extraction (install pdf2docx for better results)'
      },
      basicConversion: {
        available: true,
        description: 'Basic PDF to Word conversion using text extraction'
      }
    });
  } catch (error) {
    res.json({
      pdf2docx: {
        available: false,
        reason: error.message,
        description: 'PDF to Word will use basic text extraction'
      },
      basicConversion: {
        available: true,
        description: 'Basic PDF to Word conversion using text extraction'
      }
    });
  }
});

// Convert direct text input to PDF with advanced options
router.post('/convert/direct-text-to-pdf', optionalAuth, async (req, res) => {
  try {
    const { 
      text, 
      outputName = 'text-converted.pdf',
      options = {}
    } = req.body;
    const isAnonymous = !req.user;

    console.log('=== DIRECT TEXT TO PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('Text length:', text?.length || 0);
    console.log('Options:', options);

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    let processedText = text;

    // AI Enhancement if enabled
    if (options.enableAIEnhancement) {
      try {
        const aiService = require('../services/aiService');
        const enhancementPrompt = getEnhancementPrompt(options.aiEnhancementMode, options.writingTone);
        
        console.log('Enhancing text with AI...');
        const enhancedResult = await aiService.enhanceText(text, enhancementPrompt);
        if (enhancedResult && enhancedResult.enhancedText) {
          processedText = enhancedResult.enhancedText;
          console.log('Text enhanced successfully');
        }
      } catch (aiError) {
        console.error('AI enhancement failed, using original text:', aiError.message);
        // Continue with original text if AI fails
      }
    }

    // Parse options with defaults
    const fontSize = parseInt(options.fontSize) || 12;
    const fontFamily = options.fontFamily || 'Helvetica';
    const pageSize = options.pageSize || 'A4';
    const lineSpacing = parseFloat(options.lineSpacing) || 1.5;
    
    // Calculate margins
    let margins = { top: 72, bottom: 72, left: 72, right: 72 }; // 1 inch default
    if (options.margins === 'narrow') {
      margins = { top: 36, bottom: 36, left: 36, right: 36 };
    } else if (options.margins === 'wide') {
      margins = { top: 108, bottom: 108, left: 108, right: 108 };
    } else if (options.margins === 'custom') {
      margins = {
        top: parseInt(options.marginTop) || 72,
        bottom: parseInt(options.marginBottom) || 72,
        left: parseInt(options.marginLeft) || 72,
        right: parseInt(options.marginRight) || 72
      };
    }

    // Create PDF using PDFKit with advanced options
    const doc = new PDFKit({
      size: pageSize,
      margins: margins,
      bufferPages: true
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Add header if enabled
    if (options.addHeader && options.headerText) {
      doc.fontSize(10).font('Helvetica').text(options.headerText, {
        align: 'center'
      });
      doc.moveDown();
    }

    // Add timestamp if enabled
    if (options.addTimestamp) {
      doc.fontSize(9).font('Helvetica').fillColor('#666666').text(
        `Generated: ${new Date().toLocaleString()}`,
        { align: 'right' }
      );
      doc.fillColor('#000000').moveDown();
    }

    // Add main text content with formatting
    const lineGap = (lineSpacing - 1) * fontSize;
    doc.fontSize(fontSize).font(fontFamily).text(processedText, {
      align: 'left',
      lineGap: lineGap
    });

    // Add footer if enabled
    if (options.addFooter && options.footerText) {
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text(options.footerText, {
        align: 'center'
      });
    }

    // Add page numbers if enabled
    if (options.addPageNumbers) {
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).font('Helvetica').text(
          `Page ${i + 1} of ${pages.count}`,
          0,
          doc.page.height - 50,
          { align: 'center' }
        );
      }
    }

    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

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
      await logOperation(req.user.id, savedFile.id, 'direct-text-to-pdf');
    }

    console.log('Direct text to PDF completed successfully:', savedFile.id);

    res.json({
      message: 'Text converted to PDF successfully',
      file: savedFile,
      aiEnhanced: options.enableAIEnhancement || false,
      isAnonymous: isAnonymous
    });

  } catch (error) {
    console.error('Direct text to PDF error:', error);
    res.status(500).json({ error: error.message || 'Text to PDF conversion failed' });
  }
});

// Helper function to get AI enhancement prompt
function getEnhancementPrompt(mode, tone) {
  const toneInstructions = {
    neutral: 'Maintain a neutral, clear tone.',
    formal: 'Use formal, professional language.',
    casual: 'Use a friendly, conversational tone.',
    academic: 'Use academic, scholarly language with proper citations format.',
    business: 'Use business-appropriate, professional language.'
  };

  const modeInstructions = {
    fix: 'Fix only grammar, spelling, and punctuation errors. Keep the original structure and style.',
    improve: 'Improve readability while fixing grammar. Enhance clarity and flow without changing the meaning.',
    professional: 'Rewrite to sound more professional and polished. Fix all errors and improve structure.',
    structure: 'Organize the content with proper headings, paragraphs, and bullet points where appropriate.',
    summarize: 'Summarize the key points while maintaining clarity and completeness.'
  };

  return `${modeInstructions[mode] || modeInstructions.improve} ${toneInstructions[tone] || toneInstructions.neutral}`;
}

// Convert Text files to PDF
router.post('/convert/text-to-pdf', optionalAuth, async (req, res) => {
  try {
    const { fileIds, outputName = 'text-converted.pdf' } = req.body;
    const isAnonymous = !req.user;

    console.log('=== TEXT TO PDF REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File IDs:', fileIds);

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least 1 text file is required' });
    }

    // Get file metadata
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

    // Verify all files are text files
    const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/octet-stream'];
    const textExtensions = ['.txt', '.md', '.csv', '.text'];
    const nonTextFiles = files.filter(file => {
      const isTextType = textTypes.includes(file.type);
      const hasTextExtension = textExtensions.some(ext => file.filename.toLowerCase().endsWith(ext));
      return !isTextType && !hasTextExtension;
    });

    if (nonTextFiles.length > 0) {
      console.log('File types found:', files.map(f => ({ name: f.filename, type: f.type })));
      return res.status(400).json({ 
        error: 'All files must be text files (TXT, MD, CSV)',
        foundTypes: files.map(f => f.type)
      });
    }

    // Create PDF using PDFKit
    const doc = new PDFKit({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Process each text file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const textBuffer = await getFileBuffer(file.path);
      const textContent = textBuffer.toString('utf-8');

      // Add file name as header
      if (i > 0) {
        doc.addPage();
      }
      
      doc.fontSize(14).font('Helvetica-Bold').text(file.filename, { underline: true });
      doc.moveDown();

      // Add text content with wrapping
      doc.fontSize(11).font('Helvetica').text(textContent, {
        align: 'left',
        lineGap: 3
      });
    }

    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

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
      await logOperation(req.user.id, savedFile.id, 'text-to-pdf');
    }

    console.log('Text to PDF completed successfully:', savedFile.id);

    res.json({
      message: 'Text files converted to PDF successfully',
      file: savedFile,
      isAnonymous: isAnonymous
    });

  } catch (error) {
    console.error('Text to PDF error:', error);
    res.status(500).json({ error: error.message || 'Text to PDF conversion failed' });
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

// Compress Image - supports both authenticated and anonymous users
router.post('/compress-image', optionalAuth, async (req, res) => {
  try {
    const { 
      fileId, 
      quality = 80, 
      compressionMode = 'quality',
      targetSizeKB = null,
      minQuality = 30,
      outputFormat = 'original',
      preserveMetadata = false,
      resizeImage = false,
      maxDimension = 1920,
      outputName = 'compressed'
    } = req.body;
    const isAnonymous = !req.user;

    console.log('=== COMPRESS IMAGE REQUEST ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File ID:', fileId);
    console.log('Compression mode:', compressionMode);
    console.log('Quality:', quality);
    console.log('Target size KB:', targetSizeKB);

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

    // Verify it's an image
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!imageTypes.includes(file.type)) {
      return res.status(400).json({ error: 'File must be an image (JPEG, PNG, WebP, GIF, or BMP)' });
    }

    const fileBuffer = await getFileBuffer(file.path);
    const originalSize = fileBuffer.length;
    console.log('Original file size:', originalSize, 'bytes');

    // Determine output format
    let targetFormat = outputFormat;
    if (outputFormat === 'original') {
      if (file.type === 'image/png') targetFormat = 'png';
      else if (file.type === 'image/webp') targetFormat = 'webp';
      else if (file.type === 'image/gif') targetFormat = 'png'; // Convert GIF to PNG
      else targetFormat = 'jpeg';
    }

    let processedBuffer;
    let finalQuality = quality;

    // Get image metadata
    const imageMetadata = await sharp(fileBuffer).metadata();
    console.log('Image dimensions:', imageMetadata.width, 'x', imageMetadata.height);

    // Resize if needed
    let sharpInstance = sharp(fileBuffer);
    
    if (resizeImage && maxDimension) {
      const maxCurrentDim = Math.max(imageMetadata.width, imageMetadata.height);
      if (maxCurrentDim > maxDimension) {
        console.log('Resizing image to max dimension:', maxDimension);
        sharpInstance = sharpInstance.resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Preserve or strip metadata
    if (!preserveMetadata) {
      sharpInstance = sharpInstance.rotate(); // Auto-rotate based on EXIF, then strip
    } else {
      sharpInstance = sharpInstance.withMetadata();
    }

    // Quality-based compression
    if (compressionMode === 'quality') {
      // For quality <= 60, always use JPEG for better compression
      if (quality <= 60 && targetFormat !== 'webp') {
        targetFormat = 'jpeg';
      }
      
      // Apply compression based on output format
      if (targetFormat === 'jpeg') {
        processedBuffer = await sharpInstance.jpeg({ quality: quality, mozjpeg: true }).toBuffer();
      } else if (targetFormat === 'png') {
        const compressionLevel = Math.round((100 - quality) / 10); // 0-9 compression level
        processedBuffer = await sharpInstance.png({ compressionLevel: Math.min(9, Math.max(0, compressionLevel)) }).toBuffer();
      } else if (targetFormat === 'webp') {
        processedBuffer = await sharpInstance.webp({ quality: quality }).toBuffer();
      }
    } 
    // Size-based compression
    else if (compressionMode === 'size' && targetSizeKB) {
      const targetSizeBytes = targetSizeKB * 1024;
      
      {
        // Use JPEG for best compatibility
        console.log('Target size:', targetSizeBytes, 'bytes');
        const testFormat = targetFormat === 'png' ? 'jpeg' : targetFormat;
        
        let testInstance = sharp(fileBuffer);
        if (!preserveMetadata) testInstance = testInstance.rotate();
        
        // Binary search for optimal quality
        let low = minQuality;
        let high = 100;
        let attempts = 0;
        const maxAttempts = 12;
        let bestBuffer = null;
        let bestQuality = minQuality;
        let bestDiff = Infinity;
        
        while (attempts < maxAttempts && high - low > 2) {
          const currentQuality = Math.round((low + high) / 2);
          
          let tempBuffer;
          if (testFormat === 'jpeg') {
            tempBuffer = await testInstance.clone().jpeg({ quality: currentQuality, mozjpeg: true }).toBuffer();
          } else if (testFormat === 'png') {
            const compressionLevel = Math.round((100 - currentQuality) / 10);
            tempBuffer = await testInstance.clone().png({ compressionLevel: Math.min(9, Math.max(0, compressionLevel)) }).toBuffer();
          } else if (testFormat === 'webp') {
            tempBuffer = await testInstance.clone().webp({ quality: currentQuality, effort: 6 }).toBuffer();
          }
          
          const sizeDiff = Math.abs(tempBuffer.length - targetSizeBytes);
          console.log(`Attempt ${attempts + 1}: Quality ${currentQuality}%, Size: ${tempBuffer.length} bytes`);
          
          // Keep track of the best result (closest to target without exceeding)
          if (tempBuffer.length <= targetSizeBytes && sizeDiff < bestDiff) {
            bestBuffer = tempBuffer;
            bestQuality = currentQuality;
            bestDiff = sizeDiff;
            if (targetFormat === 'png') targetFormat = 'jpeg';
          }
          
          if (tempBuffer.length > targetSizeBytes) {
            high = currentQuality - 1;
          } else {
            low = currentQuality + 1;
          }
          
          attempts++;
        }
        
        if (bestBuffer) {
          processedBuffer = bestBuffer;
          finalQuality = bestQuality;
          
          console.log(`Binary search complete: Quality ${bestQuality}%, Size: ${processedBuffer.length} bytes (${(processedBuffer.length/targetSizeBytes*100).toFixed(1)}% of target)`);
          
          // Try to get closer to target if we're significantly under
          if (processedBuffer.length < targetSizeBytes * 0.85) {
            console.log('Result is far from target, trying alternative compression strategies...');
            
            // Try incrementally higher qualities to get closer
            for (let tryQuality = bestQuality + 1; tryQuality <= 100; tryQuality++) {
              let testBuffer;
              if (testFormat === 'jpeg') {
                testBuffer = await testInstance.clone().jpeg({ quality: tryQuality, mozjpeg: true }).toBuffer();
              } else if (testFormat === 'webp') {
                testBuffer = await testInstance.clone().webp({ quality: tryQuality, effort: 6 }).toBuffer();
              } else {
                break;
              }
              
              console.log(`Trying quality ${tryQuality}%: Size ${testBuffer.length} bytes (${(testBuffer.length/targetSizeBytes*100).toFixed(1)}% of target)`);
              
              if (testBuffer.length <= targetSizeBytes) {
                processedBuffer = testBuffer;
                finalQuality = tryQuality;
              } else {
                break;
              }
            }
            
            console.log(`Final result: Quality ${finalQuality}%, Size: ${processedBuffer.length} bytes (${(processedBuffer.length/targetSizeBytes*100).toFixed(1)}% of target)`);
          }
        }
        
        // If still no success, try resizing
        if (!processedBuffer || processedBuffer.length > targetSizeBytes) {
          console.log('Could not reach target size with quality alone, trying resize');
          const scaleFactor = Math.sqrt(targetSizeBytes / originalSize);
          const newWidth = Math.round(imageMetadata.width * scaleFactor * 0.9);
          
          processedBuffer = await sharp(fileBuffer)
            .resize({ width: newWidth, withoutEnlargement: true })
            .jpeg({ quality: 75, mozjpeg: true })
            .toBuffer();
          
          targetFormat = 'jpeg';
          finalQuality = 75;
          console.log('Resized and compressed to:', processedBuffer.length, 'bytes');
        }
      }
    }

    const compressedSize = processedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    console.log('Compressed size:', compressedSize, 'bytes');
    console.log('Compression ratio:', compressionRatio, '%');

    // Determine file extension and mime type
    let fileExtension, mimeType;
    if (targetFormat === 'jpeg') {
      fileExtension = 'jpg';
      mimeType = 'image/jpeg';
    } else if (targetFormat === 'png') {
      fileExtension = 'png';
      mimeType = 'image/png';
    } else if (targetFormat === 'webp') {
      fileExtension = 'webp';
      mimeType = 'image/webp';
    }

    const finalOutputName = `${outputName}.${fileExtension}`;

    // Save the compressed image
    const savedFile = await saveProcessedFile(
      req.user?.id || null,
      processedBuffer,
      finalOutputName,
      mimeType,
      isAnonymous
    );

    // Log operation (only for authenticated users)
    if (req.user) {
      await logOperation(req.user.id, savedFile.id, 'compress-image');
    }

    console.log('Image compression completed:', savedFile.id);

    res.json({
      message: 'Image compressed successfully',
      file: savedFile,
      stats: {
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: parseFloat(compressionRatio),
        finalQuality: finalQuality,
        outputFormat: targetFormat
      },
      isAnonymous: isAnonymous
    });

  } catch (error) {
    console.error('Image compression error:', error);
    res.status(500).json({ error: error.message || 'Image compression failed' });
  }
});

module.exports = router;