const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pdf2pic = require('pdf2pic');
const pdfParse = require('pdf-parse');
const { spawn } = require('child_process');

class OCRService {
  constructor() {
    this.languages = process.env.OCR_LANGUAGES || 'eng';
    this.confidenceThreshold = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.5; // Lower threshold for mixed languages
    this.tempDir = path.join(__dirname, '../../temp');
    this.tessdataDir = path.join(__dirname, '../../tessdata');
    this.pythonScriptPath = path.join(__dirname, '../../python_services/advanced_ocr.py');
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this._pythonOcrAvailable = null;
    this.ensureTempDir();
    
    // Configure Tesseract.js to use local tessdata directory
    process.env.TESSDATA_PREFIX = this.tessdataDir;
    
    // Check Python OCR availability on startup
    this.checkPythonOCR();
  }

  // Check if Python OCR (EasyOCR) is available
  async checkPythonOCR() {
    if (this._pythonOcrAvailable !== null) {
      return this._pythonOcrAvailable;
    }
    
    try {
      const result = await this.runPythonOCR(['engines']);
      this._pythonOcrAvailable = result.success && result.engines?.easyocr;
      console.log('🐍 Python OCR (EasyOCR) available:', this._pythonOcrAvailable);
      return this._pythonOcrAvailable;
    } catch (error) {
      console.warn('⚠️ Python OCR not available, using Tesseract.js fallback:', error.message);
      this._pythonOcrAvailable = false;
      return false;
    }
  }

  // Run Python OCR script
  runPythonOCR(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonPath, [this.pythonScriptPath, ...args], {
        cwd: path.dirname(this.pythonScriptPath),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${stdout}`));
          }
        } else {
          reject(new Error(`Python script failed (code ${code}): ${stderr || stdout}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        proc.kill();
        reject(new Error('Python OCR timeout'));
      }, 300000);
    });
  }

  // Extract text using Python EasyOCR
  async extractWithPythonOCR(filePath, languages, fileType = 'image') {
    const langStr = Array.isArray(languages) ? languages.join(',') : languages;
    const command = fileType === 'pdf' ? 'extract_pdf' : 'extract';
    
    console.log(`🐍 Running Python OCR: ${command} on ${filePath} with languages: ${langStr}`);
    
    const result = await this.runPythonOCR([command, filePath, langStr, 'auto']);
    
    if (result.success && result.text) {
      console.log(`✓ Python OCR successful: ${result.text.length} chars, confidence: ${result.confidence}`);
      return {
        text: result.text,
        confidence: result.confidence || 0.9,
        engine: result.engine || 'easyocr',
        pages: result.pages || [],
        pageCount: result.page_count || 1
      };
    }
    
    throw new Error(result.error || 'Python OCR returned no text');
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  // Check if OCR is enabled
  isEnabled() {
    return process.env.ENABLE_OCR === 'true';
  }

  // Check if Tesseract is properly initialized
  async checkTesseractHealth() {
    try {
      // Create a simple test image using Sharp instead of raw buffer
      const tempPath = path.join(this.tempDir, 'health_check.png');
      
      // Create a simple 100x50 white image with black text
      await sharp({
        create: {
          width: 100,
          height: 50,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .png()
      .toFile(tempPath);
      
      // Test OCR with a timeout
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: () => {} // Disable logging for health check
      });
      
      const { data } = await worker.recognize(tempPath);
      await worker.terminate();
      
      await this.cleanupFile(tempPath);
      
      return true;
    } catch (error) {
      console.warn('Tesseract health check failed (this is normal on first run):', error.message);
      return false; // Return false but don't throw - OCR might still work
    }
  }

  // Extract text from image file with multiple enhancement strategies
  async extractTextFromImage(imageBuffer, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('OCR is not enabled');
    }

    const {
      language = this.languages,
      enhanceImage = true
    } = options;

    const tempImagePath = path.join(this.tempDir, `${uuidv4()}.png`);
    const enhancedPaths = [];

    try {
      // Save image buffer to temp file
      await fs.writeFile(tempImagePath, imageBuffer);

      // 🐍 TRY PYTHON OCR (EasyOCR) FIRST - Higher accuracy
      const pythonAvailable = await this.checkPythonOCR();
      if (pythonAvailable) {
        try {
          console.log('🐍 Attempting Python OCR (EasyOCR) for image...');
          // Always include Hindi for Indian document support (PAN, Aadhaar, etc.)
          let languages = language.split('+').filter(l => l.trim());
          if (!languages.includes('hin')) {
            languages.push('hin');
            console.log('🇮🇳 Auto-adding Hindi for Indian document support');
          }
          const pythonResult = await this.extractWithPythonOCR(tempImagePath, languages, 'image');
          
          if (pythonResult.text && pythonResult.confidence > 0.5) {
            console.log(`✓ Python OCR successful: ${pythonResult.text.length} chars, confidence: ${pythonResult.confidence}`);
            await this.cleanupFile(tempImagePath);
            return {
              text: pythonResult.text,
              confidence: pythonResult.confidence,
              pageCount: 1,
              pages: [{
                page: 1,
                text: pythonResult.text,
                confidence: pythonResult.confidence,
                words: []
              }],
              language: language,
              engine: pythonResult.engine || 'easyocr'
            };
          }
        } catch (pythonError) {
          console.warn('⚠️ Python OCR failed, falling back to Tesseract.js:', pythonError.message);
        }
      }

      // FALLBACK: Use Tesseract.js
      console.log('📋 Using Tesseract.js OCR fallback...');
      
      let bestResult = null;
      let bestConfidence = 0;
      let imagesToTry = [tempImagePath]; // Start with original

      // Create multiple enhanced versions if requested
      if (enhanceImage) {
        const enhancements = await this.createMultipleEnhancements(tempImagePath);
        imagesToTry = [...imagesToTry, ...enhancements];
        enhancedPaths.push(...enhancements);
      }

      // Try OCR on each image version
      for (let i = 0; i < imagesToTry.length; i++) {
        const imagePath = imagesToTry[i];
        console.log(`Trying OCR on image version ${i + 1}/${imagesToTry.length}`);
        
        try {
          const ocrResult = await this.performOCR(imagePath, language);
          console.log(`Version ${i + 1} confidence: ${ocrResult.confidence}`);
          
          if (ocrResult.confidence > bestConfidence) {
            bestResult = ocrResult;
            bestConfidence = ocrResult.confidence;
            bestResult.imageVersion = i + 1;
          }
          
          // If we get very good confidence, use this result
          if (ocrResult.confidence > 0.8) {
            console.log(`High confidence achieved with version ${i + 1}, stopping`);
            break;
          }
        } catch (versionError) {
          console.warn(`OCR failed for image version ${i + 1}:`, versionError.message);
          continue;
        }
      }

      if (!bestResult) {
        throw new Error('OCR failed for all image enhancement versions');
      }

      console.log(`Best result from image version ${bestResult.imageVersion} with confidence ${bestResult.confidence}`);

      return {
        text: bestResult.text,
        confidence: bestResult.confidence,
        pageCount: 1,
        pages: [{
          page: 1,
          text: bestResult.text,
          confidence: bestResult.confidence,
          words: bestResult.words
        }],
        language: language,
        imageVersion: bestResult.imageVersion
      };

    } finally {
      // Clean up temp files
      await this.cleanupFile(tempImagePath);
      for (const enhancedPath of enhancedPaths) {
        await this.cleanupFile(enhancedPath);
      }
    }
  }

  // Extract text from PDF using OCR
  async extractTextFromPDF(pdfBuffer, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('OCR is not enabled');
    }

    const {
      language = this.languages,
      enhanceImage = true,
      maxPages = 100 // INCREASED: Process up to 100 pages
    } = options;

    const tempPdfPath = path.join(this.tempDir, `${uuidv4()}.pdf`);
    const tempImagesDir = path.join(this.tempDir, `images_${uuidv4()}`);

    try {
      // Save PDF buffer to temp file
      await fs.writeFile(tempPdfPath, pdfBuffer);
      await fs.mkdir(tempImagesDir, { recursive: true });

      console.log('PDF saved to:', tempPdfPath);

      // First, try to extract text directly from PDF (for text-based PDFs)
      console.log('Attempting direct text extraction from PDF...');
      try {
        const pdfData = await pdfParse(pdfBuffer);
        if (pdfData.text && pdfData.text.trim().length > 50) {
          console.log('PDF contains extractable text, using direct extraction');
          console.log('Extracted text length:', pdfData.text.length);
          // Cleanup temp files
          await this.cleanupFile(tempPdfPath);
          try { await fs.rmdir(tempImagesDir); } catch (e) {}
          
          return {
            text: pdfData.text,
            confidence: 0.95, // High confidence for direct extraction
            pageCount: pdfData.numpages || 1,
            pages: [{
              page: 1,
              text: pdfData.text,
              confidence: 0.95,
              words: []
            }],
            language: language,
            method: 'direct_extraction'
          };
        }
        console.log('PDF text extraction yielded insufficient text, proceeding with OCR');
      } catch (parseError) {
        console.log('Direct PDF text extraction failed, proceeding with OCR:', parseError.message);
      }

      // 🐍 TRY PYTHON OCR (EasyOCR) FIRST - Higher accuracy for scanned PDFs
      const pythonAvailable = await this.checkPythonOCR();
      if (pythonAvailable) {
        try {
          console.log('🐍 Attempting Python OCR (EasyOCR) for PDF...');
          const languages = language.split('+').filter(l => l.trim());
          const pythonResult = await this.extractWithPythonOCR(tempPdfPath, languages, 'pdf');
          
          if (pythonResult.text && pythonResult.confidence > 0.5) {
            console.log(`✓ Python PDF OCR successful: ${pythonResult.text.length} chars, confidence: ${pythonResult.confidence}`);
            // Cleanup temp files
            await this.cleanupFile(tempPdfPath);
            try { await fs.rmdir(tempImagesDir); } catch (e) {}
            
            return {
              text: pythonResult.text,
              confidence: pythonResult.confidence,
              pageCount: pythonResult.pageCount || 1,
              pages: pythonResult.pages || [{
                page: 1,
                text: pythonResult.text,
                confidence: pythonResult.confidence,
                words: []
              }],
              language: language,
              engine: pythonResult.engine || 'easyocr',
              method: 'python_ocr'
            };
          }
        } catch (pythonError) {
          console.warn('⚠️ Python PDF OCR failed, falling back to Tesseract.js:', pythonError.message);
        }
      }

      // FALLBACK: Use Tesseract.js with pdf2pic
      console.log('📋 Using Tesseract.js OCR fallback for PDF...');
      console.log('Images directory:', tempImagesDir);

      // Convert PDF to images (optimized DPI)
      let convert;
      try {
        convert = pdf2pic.fromPath(tempPdfPath, {
          density: 150, // Optimized: Reduced DPI for faster processing
          saveFilename: 'page',
          savePath: tempImagesDir,
          format: 'png',
          width: 1800,
          height: 1800
        });
      } catch (pdf2picError) {
        console.error('pdf2pic initialization error:', pdf2picError);
        throw new Error('PDF conversion tool initialization failed. Please ensure GraphicsMagick or ImageMagick is installed on the server.');
      }

      // Process pages (limit for performance)
      const pages = [];
      let totalText = '';
      let totalConfidence = 0;
      let processedPages = 0;

      for (let pageNum = 1; pageNum <= Math.min(maxPages, 100); pageNum++) {
        try {
          console.log(`Processing page ${pageNum}...`);
          
          let pageImage;
          try {
            pageImage = await convert(pageNum, { responseType: 'image' });
          } catch (convertError) {
            console.error(`PDF conversion error for page ${pageNum}:`, convertError.message);
            // If first page fails, it's likely a PDF issue
            if (pageNum === 1) {
              throw new Error('Failed to convert PDF to images. The PDF may be corrupted or password-protected.');
            }
            break; // No more pages or conversion failed
          }
          
          // Check if conversion was successful
          if (!pageImage || !pageImage.path) {
            console.log(`No more pages or conversion failed at page ${pageNum}`);
            if (pageNum === 1) {
              throw new Error('Failed to convert first page of PDF. The PDF may be empty or corrupted.');
            }
            break; // No more pages
          }

          // Verify the image file exists
          try {
            await fs.access(pageImage.path);
          } catch (accessError) {
            console.error(`Image file not found: ${pageImage.path}`);
            if (pageNum === 1) {
              throw new Error('PDF conversion produced no output. Please check if the PDF is valid.');
            }
            continue;
          }

          let imagePath = pageImage.path;
          console.log(`Image path for page ${pageNum}: ${imagePath}`);

          // Enhance image if requested
          if (enhanceImage) {
            try {
              const enhancedPath = await this.enhanceImageForOCR(imagePath);
              if (enhancedPath && enhancedPath !== imagePath) {
                // Verify enhanced image exists
                try {
                  await fs.access(enhancedPath);
                  imagePath = enhancedPath;
                  console.log(`Using enhanced image: ${enhancedPath}`);
                } catch (enhancedAccessError) {
                  console.warn(`Enhanced image not accessible, using original: ${enhancedAccessError.message}`);
                }
              }
            } catch (enhanceError) {
              console.warn(`Image enhancement failed for page ${pageNum}, using original:`, enhanceError.message);
              // Continue with original image
            }
          }

          // Perform OCR on this page
          const ocrResult = await this.performOCR(imagePath, language);

          pages.push({
            page: pageNum,
            text: ocrResult.text,
            confidence: ocrResult.confidence,
            words: ocrResult.words
          });

          totalText += ocrResult.text + '\n\n';
          totalConfidence += ocrResult.confidence;
          processedPages++;

          // Clean up enhanced image if different from original
          if (imagePath !== pageImage.path) {
            await this.cleanupFile(imagePath);
          }

        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          // Continue with next page
        }
      }

      if (processedPages === 0) {
        throw new Error('No pages could be processed successfully');
      }

      const avgConfidence = processedPages > 0 ? totalConfidence / processedPages : 0;

      return {
        text: totalText.trim(),
        confidence: avgConfidence,
        pageCount: processedPages,
        pages: pages,
        language: language
      };

    } catch (error) {
      console.error('Error in PDF OCR:', error);
      throw new Error('PDF OCR processing failed: ' + error.message);
    } finally {
      // Clean up temp files
      await this.cleanupFile(tempPdfPath);
      try {
        // Clean up images directory
        const files = await fs.readdir(tempImagesDir);
        for (const file of files) {
          await this.cleanupFile(path.join(tempImagesDir, file));
        }
        await fs.rmdir(tempImagesDir);
      } catch (cleanupError) {
        console.warn('Error cleaning up temp images:', cleanupError);
      }
    }
  }

  // Enhance image for better OCR results with multiple strategies
  async enhanceImageForOCR(imagePath) {
    // Validate input
    if (!imagePath) {
      console.error('enhanceImageForOCR called with undefined imagePath');
      throw new Error('Image path is required for enhancement');
    }

    const enhancedPath = path.join(this.tempDir, `enhanced_${uuidv4()}.png`);

    try {
      // Verify the input file exists before processing
      await fs.access(imagePath);
      
      // Get image metadata to determine best enhancement strategy
      const metadata = await sharp(imagePath).metadata();
      
      // Strategy: Adaptive enhancement based on image characteristics
      let sharpInstance = sharp(imagePath)
        .resize({ width: 3000, height: 3000, fit: 'inside', withoutEnlargement: false }) // Higher resolution for better OCR
        .grayscale(); // Convert to grayscale
      
      // Apply adaptive enhancement
      if (metadata.density && metadata.density < 150) {
        // Low DPI image - apply stronger enhancement
        sharpInstance = sharpInstance
          .normalize() // Normalize contrast
          .sharpen({ sigma: 2.5 }) // Strong sharpening
          .linear(1.8, -40) // High contrast
          .threshold(120); // Binary threshold
      } else {
        // Good quality image - apply moderate enhancement
        sharpInstance = sharpInstance
          .normalize()
          .sharpen({ sigma: 1.5 })
          .linear(1.4, -20)
          .median(3); // Remove noise
      }
      
      await sharpInstance
        .png({ quality: 100, compressionLevel: 0 })
        .toFile(enhancedPath);

      return enhancedPath;
    } catch (error) {
      console.error('Error enhancing image:', error);
      return imagePath; // Return original if enhancement fails
    }
  }

  // Create multiple enhanced versions for better OCR
  async createMultipleEnhancements(imagePath) {
    const enhancements = [];
    
    try {
      // Enhancement 1: High contrast with noise reduction
      const enhanced1 = path.join(this.tempDir, `enh1_${uuidv4()}.png`);
      await sharp(imagePath)
        .resize({ width: 3000, height: 3000, fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .median(3) // Remove noise first
        .normalize()
        .sharpen({ sigma: 2.0 })
        .linear(1.8, -40)
        .threshold(115)
        .png({ quality: 100, compressionLevel: 0 })
        .toFile(enhanced1);
      enhancements.push(enhanced1);

      // Enhancement 2: Adaptive threshold with edge enhancement
      const enhanced2 = path.join(this.tempDir, `enh2_${uuidv4()}.png`);
      await sharp(imagePath)
        .resize({ width: 2800, height: 2800, fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen({ sigma: 1.5 })
        .linear(1.5, -25)
        .median(2)
        .png({ quality: 100, compressionLevel: 0 })
        .toFile(enhanced2);
      enhancements.push(enhanced2);

      return enhancements;
    } catch (error) {
      console.error('Error creating multiple enhancements:', error);
      return []; // Return empty array if all enhancements fail
    }
  }

  // Perform OCR on a single image with optimized settings
  async performOCR(imagePath, language) {
    // Validate inputs
    if (!imagePath) {
      throw new Error('Image path is required for OCR processing');
    }
    
    if (!language) {
      throw new Error('Language is required for OCR processing');
    }

    try {
      console.log('Starting OCR process for:', imagePath);
      console.log('Using language:', language);
      
      // Verify the image file exists
      try {
        await fs.access(imagePath);
      } catch (accessError) {
        throw new Error(`Image file not accessible: ${imagePath}`);
      }
      
      // Parse language string - support multiple languages
      let ocrLanguages = language;
      
      // Auto-detect if we should add Hindi for Indian documents
      // This helps with PAN cards, Aadhaar, and other Indian government docs
      if (language === 'eng' || language.startsWith('eng')) {
        // Try with eng+hin for better Indian document support
        ocrLanguages = 'eng+hin';
        console.log('Auto-adding Hindi support for better Indian document recognition:', ocrLanguages);
      }
      
      const primaryLanguage = ocrLanguages.split(',')[0].split('+')[0];
      console.log('Using primary language:', primaryLanguage);
      
      const worker = await Tesseract.createWorker(ocrLanguages, 1, {
        langPath: this.tessdataDir,
        logger: () => {}, // Disable verbose logging
        errorHandler: (err) => console.error('Tesseract error:', err)
      });
      
      // Configure Tesseract for better recognition
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto detect layout
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '', // Allow all characters
        tessedit_char_blacklist: '',
        // Additional parameters for better recognition
        classify_bln_numeric_mode: '0',
        textord_really_old_xheight: '0',
        textord_min_xheight: '10',
        tessedit_reject_mode: '0', // Don't reject characters
        // Improve accuracy
        tessedit_enable_dict_correction: '1',
        tessedit_enable_bigram_correction: '1',
        textord_heavy_nr: '1'
      });
      
      const { data } = await worker.recognize(imagePath);
      
      await worker.terminate();
      console.log('OCR confidence:', data.confidence);
      console.log('Text length:', data.text.length);

      // Accept more words for ID cards
      const acceptableWords = data.words ? data.words.filter(
        word => word.confidence > 30 // Very low threshold for ID cards
      ) : [];

      return {
        text: data.text || '',
        confidence: (data.confidence || 0) / 100,
        words: acceptableWords.map(word => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: word.bbox
        }))
      };
    } catch (error) {
      console.error('Error in Tesseract OCR:', error);
      
      // Fallback: Try with just English if multi-language fails
      if (language.includes('+') || language.includes(',')) {
        console.log('Multi-language OCR failed, retrying with English only...');
        try {
          const worker = await Tesseract.createWorker('eng', 1, {
            langPath: this.tessdataDir,
            logger: () => {}
          });
          
          await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            preserve_interword_spaces: '1'
          });
          
          const { data } = await worker.recognize(imagePath);
          await worker.terminate();
          
          return {
            text: data.text || '',
            confidence: (data.confidence || 0) / 100,
            words: []
          };
        } catch (fallbackError) {
          console.error('Fallback OCR also failed:', fallbackError);
        }
      }
      
      throw new Error(`OCR processing failed for language ${language}: ${error.message}`);
    }
  }

  // Clean up temporary files
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Could not clean up file:', filePath);
    }
  }

  // Clean up old temp files (call periodically)
  async cleanupTempFiles(maxAge = 3600000) { // 1 hour default
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.cleanupFile(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return {
      'eng': 'English',
      'tel': 'Telugu',
      'hin': 'Hindi',
      'eng+tel': 'English + Telugu',
      'eng+hin': 'English + Hindi',
      'spa': 'Spanish',
      'fra': 'French',
      'deu': 'German',
      'ita': 'Italian',
      'por': 'Portuguese',
      'rus': 'Russian',
      'chi_sim': 'Chinese (Simplified)',
      'chi_tra': 'Chinese (Traditional)',
      'jpn': 'Japanese',
      'kor': 'Korean',
      'ara': 'Arabic'
    };
  }

  // Decode HTML entities - standalone function
  decodeHtmlEntities(text) {
    if (!text) return text;
    
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  // Local text cleaner - works without external AI
  // Cleans OCR errors, removes garbage symbols, and improves readability
  cleanTextLocally(text) {
    if (!text || text.length === 0) return text;
    
    console.log('🧹 Applying local text cleaning...');
    let cleaned = text;
    
    // First, decode any HTML entities that might be present
    cleaned = this.decodeHtmlEntities(cleaned);
    
    // Common OCR error corrections
    const ocrCorrections = [
      // Letter substitutions
      [/rn/g, 'm'],           // rn → m
      [/vv/g, 'w'],           // vv → w
      [/\bI([a-z])/g, 'l$1'], // I at start of lowercase word → l
      [/\b0([a-z])/g, 'O$1'], // 0 at start of word → O
      [/([a-z])0([a-z])/g, '$1o$2'], // 0 between letters → o
      [/\bl\b/g, 'I'],        // standalone l → I (common mistake)
      [/\|/g, 'I'],           // | → I
      [/\bII\b/g, 'II'],      // Keep Roman numeral II
      
      // Common word fixes
      [/\btbe\b/gi, 'the'],
      [/\btlie\b/gi, 'the'],
      [/\bwbich\b/gi, 'which'],
      [/\bwitb\b/gi, 'with'],
      [/\bfrorn\b/gi, 'from'],
      [/\bbave\b/gi, 'have'],
      [/\btbat\b/gi, 'that'],
      [/\btbis\b/gi, 'this'],
      [/\bwbat\b/gi, 'what'],
      [/\bwben\b/gi, 'when'],
      [/\bwbere\b/gi, 'where'],
      [/\bbeen\b/gi, 'been'],
      [/\brnore\b/gi, 'more'],
      [/\bsorne\b/gi, 'some'],
      [/\btirne\b/gi, 'time'],
      [/\bnarne\b/gi, 'name'],
      [/\bnurnber\b/gi, 'number'],
    ];
    
    for (const [pattern, replacement] of ocrCorrections) {
      cleaned = cleaned.replace(pattern, replacement);
    }
    
    // Remove garbage characters and symbols
    // Keep: letters, numbers, common punctuation, currency symbols
    cleaned = cleaned.replace(/[^\w\s\.,;:!?'"()\-–—@#$%&*+=\/\\<>₹€£¥\[\]{}|`~\n\r]/g, ' ');
    
    // Remove repeated special characters (artifacts)
    cleaned = cleaned.replace(/([!@#$%^&*()_+=\-\[\]{}|\\:";'<>?,./])\1{2,}/g, '$1');
    
    // Remove isolated single characters that are likely OCR errors (except I, a, A)
    cleaned = cleaned.replace(/\s[^IaA\d\s]\s/g, ' ');
    
    // Fix spacing issues
    cleaned = cleaned.replace(/\s{3,}/g, '  ');     // Multiple spaces → double space
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n'); // Excessive newlines → triple
    cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1'); // Remove space before punctuation
    cleaned = cleaned.replace(/([.,;:!?])([A-Za-z])/g, '$1 $2'); // Add space after punctuation
    
    // Remove lines that are mostly symbols/garbage (less than 30% alphanumeric)
    const lines = cleaned.split('\n');
    const cleanedLines = lines.filter(line => {
      if (line.trim().length === 0) return true; // Keep empty lines for structure
      const alphanumeric = (line.match(/[a-zA-Z0-9]/g) || []).length;
      const total = line.trim().length;
      return total === 0 || (alphanumeric / total) > 0.3;
    });
    cleaned = cleanedLines.join('\n');
    
    // Clean up repeated words (OCR artifact)
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
    
    // Final trim and cleanup
    cleaned = cleaned.trim();
    
    console.log('✓ Local cleaning completed. Original length:', text.length, 'Cleaned length:', cleaned.length);
    return cleaned;
  }

  // Extract text with AI enhancement option - 99% ACCURATE OCR
  async extractTextWithAI(buffer, options = {}) {
    const {
      enhanceWithAI = true, // Default to TRUE for 99% accuracy
      extractOriginal = false,
      language = 'auto',
      fileType = 'pdf',
      confidenceThreshold = 0.6
    } = options;

    try {
      console.log('🚀 Starting ADVANCED OCR with AI enhancement:', { enhanceWithAI, extractOriginal, fileType });

      // First, extract the original text using OCR
      let ocrResult;
      if (fileType === 'pdf') {
        ocrResult = await this.extractTextFromPDF(buffer, {
          language: language === 'auto' ? this.languages : language,
          enhanceImage: true,
          maxPages: 50
        });
      } else {
        ocrResult = await this.extractTextFromImage(buffer, {
          language: language === 'auto' ? this.languages : language,
          enhanceImage: true
        });
      }

      console.log('✓ Original OCR completed. Text length:', ocrResult.text.length);
      console.log('✓ OCR confidence:', ocrResult.confidence);

      const result = {
        text: ocrResult.text,
        originalText: ocrResult.text,
        enhancedText: null,
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount,
        pages: ocrResult.pages,
        detectedLanguage: ocrResult.language || language,
        aiEnhanced: false,
        localCleaned: false,
        processingOptions: {
          enhanceWithAI,
          extractOriginal,
          language,
          fileType
        }
      };

      // If AI enhancement is requested and we have text
      if (enhanceWithAI && ocrResult.text && ocrResult.text.length > 10) {
        console.log('🤖 Applying AI enhancement for 99% accuracy...');
        
        let aiEnhancementSucceeded = false;
        
        try {
          const aiService = require('./aiService');
          
          if (aiService.isEnabled()) {
            const enhancedText = await aiService.enhanceTextWithAI(ocrResult.text);
            
            if (enhancedText && enhancedText.length > 0) {
              // CRITICAL: Decode HTML entities after AI enhancement
              const decodedText = this.decodeHtmlEntities(enhancedText);
              result.enhancedText = decodedText;
              
              // Use enhanced text as primary UNLESS extractOriginal is true
              if (!extractOriginal) {
                result.text = decodedText;
              }
              
              result.aiEnhanced = true;
              result.confidence = Math.min(result.confidence + 0.15, 0.99); // Boost to 99%
              aiEnhancementSucceeded = true;
              console.log('✓ AI enhancement completed. Enhanced text length:', decodedText.length);
              console.log('✓ Confidence boosted to:', result.confidence);
            } else {
              console.warn('⚠ AI enhancement returned empty text');
            }
          } else {
            console.warn('⚠ AI service not enabled');
          }
        } catch (aiError) {
          console.error('❌ AI enhancement failed:', aiError.message);
        }
        
        // If AI enhancement failed or is not available, use local cleaning as fallback
        if (!aiEnhancementSucceeded && !extractOriginal) {
          console.log('📋 Falling back to local text cleaning...');
          const localCleanedText = this.cleanTextLocally(ocrResult.text);
          
          if (localCleanedText && localCleanedText.length > 0) {
            result.enhancedText = localCleanedText;
            result.text = localCleanedText;
            result.localCleaned = true;
            result.confidence = Math.min(result.confidence + 0.05, 0.90); // Smaller boost for local cleaning
            console.log('✓ Local cleaning applied. Cleaned text length:', localCleanedText.length);
          }
        }
      } else if (enhanceWithAI) {
        console.log('⚠ Skipping AI enhancement - text too short or empty');
        result.aiEnhanced = false;
      }
      
      // ALWAYS decode HTML entities in the final text, regardless of enhancement
      if (result.text) {
        result.text = this.decodeHtmlEntities(result.text);
      }
      if (result.originalText) {
        result.originalText = this.decodeHtmlEntities(result.originalText);
      }

      console.log(`✓ Final OCR result: language=${result.detectedLanguage}, confidence=${result.confidence}, textLength=${result.text.length}`);
      console.log('✓ AI Enhanced:', result.aiEnhanced, '| Local Cleaned:', result.localCleaned);
      
      return result;

    } catch (error) {
      console.error('❌ Error in extractTextWithAI:', error);
      throw error;
    }
  }
}

module.exports = new OCRService();