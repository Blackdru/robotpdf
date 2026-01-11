/**
 * Python OCR Service - High Accuracy Multi-Engine OCR
 * 
 * Uses EasyOCR for 80+ language support with on-demand model downloading
 * Falls back to Tesseract.js if Python OCR is unavailable
 * 
 * Supports 80+ languages including:
 * - All Indian languages (Hindi, Telugu, Tamil, Kannada, Malayalam, etc.)
 * - East Asian (Chinese, Japanese, Korean, Vietnamese, Thai)
 * - European languages (German, French, Spanish, Russian, etc.)
 * - Arabic, Hebrew, Persian, Urdu
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class PythonOCRService {
  constructor() {
    // Support custom Python path for virtual environments
    // On Ubuntu: PYTHON_PATH=/home/ubuntu/pdf-venv/bin/python3
    this.pythonPath = process.env.PYTHON_PATH || 'python3' || 'python';
    this.scriptPath = path.join(__dirname, '../../python_services/ocr_service.py');
    this.tempDir = path.join(__dirname, '../../temp');
    this.fallbackService = null;
    this._pythonAvailable = null;
    
    this.ensureTempDir();
    
    console.log('PythonOCRService initialized with Python path:', this.pythonPath);
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  /**
   * Check if OCR is enabled (for compatibility with ocrService interface)
   */
  isEnabled() {
    return process.env.ENABLE_OCR === 'true';
  }

  /**
   * Check if Python OCR is available
   */
  async isPythonOCRAvailable() {
    if (this._pythonAvailable !== null) {
      return this._pythonAvailable;
    }

    try {
      const result = await this.runPythonCommand('health');
      this._pythonAvailable = result.easyocr === true;
      console.log('Python OCR (EasyOCR) availability:', this._pythonAvailable);
      return this._pythonAvailable;
    } catch (error) {
      console.warn('Python OCR not available:', error.message);
      this._pythonAvailable = false;
      return false;
    }
  }

  /**
   * Run Python OCR command
   */
  runPythonCommand(command, inputData = null) {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonPath, [this.scriptPath, command], {
        cwd: path.dirname(this.scriptPath),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        const msg = data.toString();
        stderr += msg;
        console.log('Python stderr:', msg.trim());
      });

      // Send input data if provided
      if (inputData) {
        const jsonData = JSON.stringify(inputData);
        console.log('Sending to Python stdin:', jsonData.length, 'bytes');
        proc.stdin.write(jsonData);
        proc.stdin.end();
      }

      proc.on('close', (code) => {
        console.log('Python process exited with code:', code);
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout.substring(0, 500));
            reject(new Error(`Failed to parse Python output: ${stdout.substring(0, 200)}`));
          }
        } else {
          console.error('Python script failed:', stderr || stdout);
          reject(new Error(`Python script failed (code ${code}): ${stderr || stdout}`));
        }
      });

      proc.on('error', (error) => {
        console.error('Failed to spawn Python:', error);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        proc.kill();
        reject(new Error('Python OCR timeout'));
      }, 300000);
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
   * Convert language codes to EasyOCR format
   */
  convertLanguages(languages) {
    const langMap = {
      'eng': 'en', 'hin': 'hi', 'tel': 'te', 'tam': 'ta', 'kan': 'kn', 'mal': 'ml',
      'mar': 'mr', 'ben': 'bn', 'guj': 'gu', 'pan': 'pa', 'ori': 'or', 'asm': 'as',
      'nep': 'ne', 'san': 'sa', 'urd': 'ur',
      'ara': 'ar', 'fas': 'fa', 'heb': 'he',
      'chi_sim': 'ch_sim', 'chi_tra': 'ch_tra', 'jpn': 'ja', 'kor': 'ko',
      'vie': 'vi', 'tha': 'th', 'mya': 'my', 'khm': 'km', 'lao': 'lo',
      'rus': 'ru', 'ukr': 'uk', 'bel': 'be', 'bul': 'bg', 'srp': 'sr', 'mkd': 'mk',
      'deu': 'de', 'fra': 'fr', 'spa': 'es', 'por': 'pt', 'ita': 'it', 'nld': 'nl',
      'pol': 'pl', 'ces': 'cs', 'slk': 'sk', 'ron': 'ro', 'hun': 'hu',
      'dan': 'da', 'nor': 'no', 'swe': 'sv', 'fin': 'fi',
      'ell': 'el', 'tur': 'tr', 'ind': 'id', 'msa': 'ms', 'fil': 'tl',
      'kat': 'ka', 'hye': 'hy', 'mon': 'mn',
    };
    
    if (!Array.isArray(languages)) {
      languages = languages.includes('+') ? languages.split('+') : [languages];
    }
    
    return languages.map(lang => langMap[lang] || lang);
  }

  /**
   * Extract text from image with EasyOCR (80+ languages)
   */
  async extractTextFromImage(imageBuffer, options = {}) {
    const {
      languages = ['eng'],
      enhanceWithAI = true,
      useFallback = true
    } = options;

    try {
      // Check if Python OCR is available
      if (await this.isPythonOCRAvailable()) {
        console.log('Using EasyOCR for image extraction');
        
        const easyLangs = this.convertLanguages(languages);
        console.log('EasyOCR languages:', easyLangs);
        
        const base64Data = imageBuffer.toString('base64');
        console.log('Image data size:', base64Data.length, 'bytes');
        
        try {
          const result = await this.runPythonCommand('image', {
            data: base64Data,
            languages: easyLangs,
            enhance: true
          });

          console.log('EasyOCR result:', result.error ? `Error: ${result.error}` : `${result.text?.length || 0} chars`);

          if (result.text && !result.error) {
            console.log(`EasyOCR successful: ${result.text.length} chars, confidence: ${result.confidence}`);
            
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
            language: easyLangs.join('+'),
            engine: 'easyocr',
            aiEnhanced,
            method: 'python_easyocr'
          };
        } else {
          // EasyOCR returned error or empty result
          console.error('EasyOCR failed:', result.error || 'Empty result');
        }
        } catch (pythonError) {
          console.error('Python EasyOCR error:', pythonError.message);
        }
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

      throw new Error('EasyOCR failed and fallback disabled');

    } catch (error) {
      console.error('Image OCR error:', error.message);
      
      if (useFallback) {
        const fallback = this.getFallbackService();
        return await fallback.extractTextFromImage(imageBuffer, options);
      }
      throw error;
    }
  }

  /**
   * Extract text from PDF with EasyOCR (80+ languages)
   */
  async extractTextFromPDF(pdfBuffer, options = {}) {
    const {
      languages = ['eng'],
      maxPages = 50,
      enhanceWithAI = true,
      useFallback = true
    } = options;

    try {
      if (await this.isPythonOCRAvailable()) {
        console.log('Using EasyOCR for PDF extraction');
        
        const easyLangs = this.convertLanguages(languages);
        const base64Data = pdfBuffer.toString('base64');
        
        const result = await this.runPythonCommand('pdf', {
          data: base64Data,
          languages: easyLangs,
          enhance: true,
          max_pages: maxPages
        });

        if (result.text && !result.error) {
          console.log(`EasyOCR PDF successful: ${result.text.length} chars, ${result.page_count} pages`);
          
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
            pageCount: result.page_count || 1,
            pages: result.pages || [],
            language: easyLangs.join('+'),
            engine: 'easyocr',
            aiEnhanced,
            method: 'python_easyocr'
          };
        }
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

      throw new Error('EasyOCR PDF failed and fallback disabled');

    } catch (error) {
      console.error('PDF OCR error:', error.message);
      
      if (useFallback) {
        const fallback = this.getFallbackService();
        return await fallback.extractTextFromPDF(pdfBuffer, options);
      }
      throw error;
    }
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
      // Determine languages - EasyOCR has compatibility restrictions
      // Indian languages (hi, te, ta, etc.) can only be paired with English
      let languages = ['en', 'hi'];  // Default: English + Hindi
      
      if (language === 'auto') {
        languages = ['en', 'hi'];  // Auto defaults to English + Hindi
      } else if (language.includes('+')) {
        languages = language.split('+');
      } else {
        languages = [language];
      }

      // Extract text
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
   * Get supported languages (80+ via EasyOCR)
   */
  async getSupportedLanguages() {
    try {
      const result = await this.runPythonCommand('languages');
      if (result && !result.error) {
        return result;
      }
    } catch (error) {
      console.warn('Failed to get EasyOCR languages:', error.message);
    }

    // Return default languages
    return {
      'en': 'English', 'hi': 'Hindi (हिंदी)', 'te': 'Telugu (తెలుగు)',
      'ta': 'Tamil (தமிழ்)', 'kn': 'Kannada (ಕನ್ನಡ)', 'ml': 'Malayalam (മലയാളം)',
      'mr': 'Marathi (मराठी)', 'bn': 'Bengali (বাংলা)', 'gu': 'Gujarati (ગુજરાતી)',
      'ar': 'Arabic (العربية)', 'fa': 'Persian (فارسی)', 'ur': 'Urdu (اردو)',
      'ch_sim': 'Chinese Simplified (简体中文)', 'ch_tra': 'Chinese Traditional (繁體中文)',
      'ja': 'Japanese (日本語)', 'ko': 'Korean (한국어)',
      'ru': 'Russian (Русский)', 'de': 'German (Deutsch)', 'fr': 'French (Français)',
      'es': 'Spanish (Español)', 'pt': 'Portuguese (Português)', 'it': 'Italian (Italiano)',
      'th': 'Thai (ไทย)', 'vi': 'Vietnamese (Tiếng Việt)',
      'auto': 'Auto-detect (All Languages)'
    };
  }

  /**
   * Check OCR service health
   */
  async checkHealth() {
    const health = {
      easyocr: false,
      tesseractFallback: false,
      languageCount: 80
    };

    try {
      health.easyocr = await this.isPythonOCRAvailable();
    } catch (error) {
      console.warn('EasyOCR health check failed:', error.message);
    }

    try {
      const fallback = this.getFallbackService();
      health.tesseractFallback = await fallback.checkTesseractHealth();
    } catch (error) {
      console.warn('Tesseract fallback health check failed:', error.message);
    }

    return health;
  }
}

module.exports = new PythonOCRService();
