/**
 * Python OCR Service - High Accuracy Multi-Engine OCR
 * 
 * Connects to persistent Python OCR server for fast processing
 * Falls back to Tesseract.js if Python OCR server is unavailable
 */

const http = require('http');
const path = require('path');
const fs = require('fs').promises;

class PythonOCRService {
  constructor() {
    this.ocrServerUrl = process.env.OCR_SERVER_URL || 'http://127.0.0.1:5050';
    this.fallbackService = null;
    this._serverAvailable = null;
    this._lastHealthCheck = 0;
    
    console.log('PythonOCRService initialized, server URL:', this.ocrServerUrl);
  }

  /**
   * Check if OCR is enabled
   */
  isEnabled() {
    return process.env.ENABLE_OCR === 'true';
  }

  /**
   * Check if Python OCR server is available
   */
  async isPythonOCRAvailable() {
    // Cache health check for 30 seconds
    const now = Date.now();
    if (this._serverAvailable !== null && (now - this._lastHealthCheck) < 30000) {
      return this._serverAvailable;
    }

    try {
      const result = await this.httpRequest('/health', 'GET', null, 5000);
      this._serverAvailable = result.status === 'ok';
      this._lastHealthCheck = now;
      console.log('OCR Server health:', this._serverAvailable ? 'OK' : 'DOWN');
      return this._serverAvailable;
    } catch (error) {
      console.warn('OCR Server not available:', error.message);
      this._serverAvailable = false;
      this._lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Make HTTP request to OCR server
   */
  httpRequest(endpoint, method = 'POST', data = null, timeout = 120000) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.ocrServerUrl);
      
      // Prepare body first to get Content-Length
      const body = data ? JSON.stringify(data) : null;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: timeout
      };
      
      // Set Content-Length header for POST requests
      if (body) {
        options.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
      }

      const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseBody));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${responseBody.substring(0, 100)}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  /**
   * Get the fallback Tesseract.js service
   */
  getFallbackService() {
    if (!this.fallbackService) {
      this.fallbackService = require('./ocrService');
    }
    return this.fallbackService;
  }

  /**
   * Extract text from image with EasyOCR
   */
  async extractTextFromImage(imageBuffer, options = {}) {
    const {
      languages = ['en', 'hi'],
      enhanceWithAI = true,
      useFallback = true
    } = options;

    try {
      if (await this.isPythonOCRAvailable()) {
        console.log('Using EasyOCR server for image extraction');
        
        const base64Data = imageBuffer.toString('base64');
        console.log('Sending image to OCR server:', base64Data.length, 'bytes');
        
        const result = await this.httpRequest('/ocr/image', 'POST', {
          data: base64Data,
          languages: languages,
          enhance: true
        });

        if (result.text && !result.error) {
          console.log(`EasyOCR successful: ${result.text.length} chars in ${result.processing_time}s`);
          
          // AI enhancement
          let finalText = result.text;
          let aiEnhanced = false;
          
          if (enhanceWithAI && result.text.length > 10) {
            try {
              const aiService = require('./aiService');
              if (aiService.isEnabled()) {
                finalText = await aiService.enhanceTextWithAI(result.text);
                aiEnhanced = true;
              }
            } catch (aiError) {
              console.warn('AI enhancement failed:', aiError.message);
            }
          }

          return {
            text: finalText,
            originalText: result.text,
            confidence: Math.min((result.confidence || 0.8) + (aiEnhanced ? 0.1 : 0), 0.99),
            pageCount: 1,
            pages: [{ page: 1, text: finalText, confidence: result.confidence }],
            language: languages.join('+'),
            engine: 'easyocr',
            aiEnhanced,
            method: 'python_easyocr'
          };
        } else {
          console.error('EasyOCR returned error:', result.error);
        }
      }
    } catch (error) {
      console.error('EasyOCR server error:', error.message);
    }

    // Fallback to Tesseract.js
    if (useFallback) {
      console.log('Falling back to Tesseract.js OCR');
      const fallback = this.getFallbackService();
      return await fallback.extractTextFromImage(imageBuffer, {
        language: Array.isArray(languages) ? languages.join('+') : languages,
        enhanceImage: true
      });
    }

    throw new Error('OCR failed and fallback disabled');
  }

  /**
   * Extract text from PDF with EasyOCR
   */
  async extractTextFromPDF(pdfBuffer, options = {}) {
    const {
      languages = ['en', 'hi'],
      maxPages = 20,
      enhanceWithAI = true,
      useFallback = true
    } = options;

    try {
      if (await this.isPythonOCRAvailable()) {
        console.log('Using EasyOCR server for PDF extraction');
        
        const base64Data = pdfBuffer.toString('base64');
        
        const result = await this.httpRequest('/ocr/pdf', 'POST', {
          data: base64Data,
          languages: languages,
          enhance: true,
          max_pages: maxPages
        }, 300000); // 5 min timeout for PDFs

        if (result.text && !result.error) {
          console.log(`EasyOCR PDF successful: ${result.text.length} chars, ${result.page_count} pages`);
          
          let finalText = result.text;
          let aiEnhanced = false;
          
          if (enhanceWithAI && result.text.length > 10) {
            try {
              const aiService = require('./aiService');
              if (aiService.isEnabled()) {
                finalText = await aiService.enhanceTextWithAI(result.text);
                aiEnhanced = true;
              }
            } catch (aiError) {
              console.warn('AI enhancement failed:', aiError.message);
            }
          }

          return {
            text: finalText,
            originalText: result.text,
            confidence: Math.min((result.confidence || 0.8) + (aiEnhanced ? 0.1 : 0), 0.99),
            pageCount: result.page_count || 1,
            pages: result.pages || [],
            language: languages.join('+'),
            engine: 'easyocr',
            aiEnhanced,
            method: 'python_easyocr'
          };
        } else {
          console.error('EasyOCR PDF error:', result.error);
        }
      }
    } catch (error) {
      console.error('EasyOCR PDF server error:', error.message);
    }

    // Fallback
    if (useFallback) {
      console.log('Falling back to Tesseract.js OCR for PDF');
      const fallback = this.getFallbackService();
      return await fallback.extractTextFromPDF(pdfBuffer, {
        language: Array.isArray(languages) ? languages.join('+') : languages,
        enhanceImage: true,
        maxPages
      });
    }

    throw new Error('PDF OCR failed and fallback disabled');
  }

  /**
   * Extract text with AI enhancement - Main entry point
   */
  async extractTextWithAI(buffer, options = {}) {
    const {
      enhanceWithAI = true,
      extractOriginal = false,
      language = 'auto',
      fileType = 'pdf'
    } = options;

    console.log('🚀 Starting EasyOCR with AI enhancement');
    console.log('Options:', { enhanceWithAI, extractOriginal, language, fileType });

    try {
      // Default to English + Hindi
      let languages = ['en', 'hi'];
      
      if (language !== 'auto') {
        if (language.includes('+')) {
          languages = language.split('+');
        } else {
          languages = [language];
        }
      }

      let ocrResult;
      if (fileType === 'pdf') {
        ocrResult = await this.extractTextFromPDF(buffer, { languages, enhanceWithAI, useFallback: true });
      } else {
        ocrResult = await this.extractTextFromImage(buffer, { languages, enhanceWithAI, useFallback: true });
      }

      return {
        text: extractOriginal ? ocrResult.originalText : ocrResult.text,
        originalText: ocrResult.originalText || ocrResult.text,
        enhancedText: ocrResult.aiEnhanced ? ocrResult.text : null,
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount,
        pages: ocrResult.pages,
        detectedLanguage: ocrResult.language || language,
        aiEnhanced: ocrResult.aiEnhanced || false,
        localCleaned: false,
        engine: ocrResult.engine || 'easyocr',
        method: ocrResult.method || 'python_easyocr',
        processingOptions: { enhanceWithAI, extractOriginal, language, fileType }
      };

    } catch (error) {
      console.error('❌ EasyOCR failed:', error.message);
      console.log('📋 Using Tesseract.js fallback');
      const fallback = this.getFallbackService();
      return await fallback.extractTextWithAI(buffer, options);
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages() {
    try {
      if (await this.isPythonOCRAvailable()) {
        return await this.httpRequest('/languages', 'GET', null, 5000);
      }
    } catch (error) {
      console.warn('Failed to get languages from OCR server');
    }

    return {
      'en': 'English', 'hi': 'Hindi', 'te': 'Telugu', 'ta': 'Tamil',
      'ar': 'Arabic', 'ru': 'Russian', 'de': 'German', 'fr': 'French',
      'es': 'Spanish', 'ja': 'Japanese', 'ko': 'Korean', 'ch_sim': 'Chinese'
    };
  }

  /**
   * Check health
   */
  async checkHealth() {
    const health = {
      easyocr: false,
      tesseractFallback: false
    };

    try {
      health.easyocr = await this.isPythonOCRAvailable();
    } catch (e) {}

    try {
      const fallback = this.getFallbackService();
      health.tesseractFallback = await fallback.checkTesseractHealth();
    } catch (e) {}

    return health;
  }
}

module.exports = new PythonOCRService();
