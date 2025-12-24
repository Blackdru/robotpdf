/**
 * Unified OCR Service
 * 
 * Provides a single interface for OCR with automatic engine selection:
 * 1. Python OCR (EasyOCR/PaddleOCR) - 99% accuracy, 100+ languages
 * 2. Tesseract.js - Fallback with good accuracy
 * 
 * Usage:
 *   const ocrService = require('./unifiedOcrService');
 *   const result = await ocrService.extractText(buffer, { language: 'eng+hin' });
 */

const pythonOcrService = require('./pythonOcrService');
const tesseractOcrService = require('./ocrService');

class UnifiedOCRService {
  constructor() {
    this._initialized = false;
    this._preferredEngine = null;
  }

  /**
   * Initialize and determine the best available OCR engine
   */
  async initialize() {
    if (this._initialized) return;

    console.log('🔍 Initializing Unified OCR Service...');

    // Check Python OCR availability
    const pythonAvailable = await pythonOcrService.isPythonOCRAvailable();
    
    if (pythonAvailable) {
      this._preferredEngine = 'python';
      console.log('✓ Python OCR available - using as primary engine');
    } else {
      this._preferredEngine = 'tesseract';
      console.log('⚠ Python OCR not available - using Tesseract.js as primary');
    }

    this._initialized = true;
  }

  /**
   * Check if OCR is enabled
   */
  isEnabled() {
    return process.env.ENABLE_OCR === 'true';
  }

  /**
   * Get the current OCR engine status
   */
  async getStatus() {
    await this.initialize();
    
    const pythonHealth = await pythonOcrService.checkHealth();
    const tesseractHealth = await tesseractOcrService.checkTesseractHealth();

    return {
      enabled: this.isEnabled(),
      preferredEngine: this._preferredEngine,
      engines: {
        python: {
          available: pythonHealth.pythonOCR,
          engines: pythonHealth.engines
        },
        tesseract: {
          available: tesseractHealth
        }
      }
    };
  }

  /**
   * Extract text from image buffer
   * 
   * @param {Buffer} imageBuffer - Image data
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractTextFromImage(imageBuffer, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('OCR is not enabled');
    }

    await this.initialize();

    const {
      language = 'eng',
      enhanceWithAI = true,
      forceEngine = null
    } = options;

    // Determine which engine to use
    const engine = forceEngine || this._preferredEngine;

    console.log(`📷 Extracting text from image using ${engine} engine`);

    if (engine === 'python') {
      return await pythonOcrService.extractTextFromImage(imageBuffer, {
        languages: this._parseLanguages(language),
        enhanceWithAI,
        useFallback: true
      });
    }

    return await tesseractOcrService.extractTextFromImage(imageBuffer, {
      language,
      enhanceImage: true
    });
  }

  /**
   * Extract text from PDF buffer
   * 
   * @param {Buffer} pdfBuffer - PDF data
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractTextFromPDF(pdfBuffer, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('OCR is not enabled');
    }

    await this.initialize();

    const {
      language = 'eng',
      enhanceWithAI = true,
      maxPages = 100,
      forceEngine = null
    } = options;

    const engine = forceEngine || this._preferredEngine;

    console.log(`📄 Extracting text from PDF using ${engine} engine`);

    if (engine === 'python') {
      return await pythonOcrService.extractTextFromPDF(pdfBuffer, {
        languages: this._parseLanguages(language),
        enhanceWithAI,
        maxPages,
        useFallback: true
      });
    }

    return await tesseractOcrService.extractTextFromPDF(pdfBuffer, {
      language,
      enhanceImage: true,
      maxPages
    });
  }

  /**
   * Extract text with AI enhancement - Main high-accuracy method
   * 
   * @param {Buffer} buffer - File buffer
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} Enhanced OCR result
   */
  async extractTextWithAI(buffer, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('OCR is not enabled');
    }

    await this.initialize();

    const {
      enhanceWithAI = true,
      extractOriginal = false,
      language = 'auto',
      fileType = 'pdf',
      forceEngine = null
    } = options;

    const engine = forceEngine || this._preferredEngine;

    console.log(`🚀 Advanced OCR with AI enhancement using ${engine} engine`);

    if (engine === 'python') {
      return await pythonOcrService.extractTextWithAI(buffer, {
        enhanceWithAI,
        extractOriginal,
        language,
        fileType
      });
    }

    return await tesseractOcrService.extractTextWithAI(buffer, {
      enhanceWithAI,
      extractOriginal,
      language,
      fileType
    });
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages() {
    await this.initialize();

    if (this._preferredEngine === 'python') {
      return await pythonOcrService.getSupportedLanguages();
    }

    return tesseractOcrService.getSupportedLanguages();
  }

  /**
   * Parse language string into array
   */
  _parseLanguages(language) {
    if (Array.isArray(language)) return language;
    if (language === 'auto') return ['eng'];
    return language.split(/[+,]/).filter(l => l.trim());
  }

  /**
   * Clean text locally (without AI)
   */
  cleanTextLocally(text) {
    return tesseractOcrService.cleanTextLocally(text);
  }

  /**
   * Decode HTML entities
   */
  decodeHtmlEntities(text) {
    return tesseractOcrService.decodeHtmlEntities(text);
  }
}

// Export singleton
module.exports = new UnifiedOCRService();
