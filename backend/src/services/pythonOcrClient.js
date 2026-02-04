/**
 * Python EasyOCR Server Client
 * Connects to the Python OCR server for faster, more accurate OCR
 */

const axios = require('axios');

class PythonOcrClient {
  constructor() {
    this.serverUrl = process.env.OCR_SERVER_URL || 'http://127.0.0.1:5050';
    this.timeout = 120000; // 2 minutes timeout
    this.isAvailable = null;
    this.lastHealthCheck = null;
    this.healthCheckInterval = 60000; // Check every minute
  }

  /**
   * Check if Python OCR server is available
   */
  async checkHealth() {
    // Cache health check for 1 minute
    if (this.lastHealthCheck && Date.now() - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isAvailable;
    }

    try {
      const response = await axios.get(`${this.serverUrl}/health`, {
        timeout: 5000
      });
      
      this.isAvailable = response.data.status === 'ok';
      this.lastHealthCheck = Date.now();
      
      if (this.isAvailable) {
        console.log('✓ Python OCR server is available:', response.data);
      }
      
      return this.isAvailable;
    } catch (error) {
      console.warn('Python OCR server not available:', error.message);
      this.isAvailable = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  /**
   * Get supported languages from Python server
   */
  async getSupportedLanguages() {
    try {
      const response = await axios.get(`${this.serverUrl}/languages`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error getting languages from Python server:', error.message);
      return {};
    }
  }

  /**
   * Convert language code from Tesseract format to EasyOCR format
   */
  convertLanguageCode(tessLang) {
    const langMap = {
      'eng': 'en',
      'hin': 'hi',
      'spa': 'es',
      'fra': 'fr',
      'deu': 'de',
      'ita': 'it',
      'por': 'pt',
      'rus': 'ru',
      'chi_sim': 'ch_sim',
      'chi_tra': 'ch_tra',
      'jpn': 'ja',
      'kor': 'ko',
      'ara': 'ar',
      'tel': 'te',
      'tam': 'ta',
      'kan': 'kn',
      'mal': 'ml',
      'mar': 'mr',
      'ben': 'bn',
      'tha': 'th',
      'vie': 'vi'
    };

    // Handle multi-language codes (e.g., 'eng+hin')
    if (tessLang.includes('+')) {
      const langs = tessLang.split('+');
      return langs.map(l => langMap[l] || l).filter(Boolean);
    }

    // Handle auto mode
    if (tessLang === 'auto') {
      return ['en', 'hi']; // Default to English + Hindi
    }

    return [langMap[tessLang] || tessLang];
  }

  /**
   * Process image with Python EasyOCR server
   */
  async processImage(imageBuffer, options = {}) {
    try {
      const { language = 'auto', enhance = true } = options;
      
      // Convert language codes
      const languages = this.convertLanguageCode(language);
      
      // Convert buffer to base64
      const base64Data = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `${this.serverUrl}/ocr/image`,
        {
          data: base64Data,
          languages: languages,
          enhance: enhance
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Python OCR image processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Process PDF with Python EasyOCR server
   */
  async processPDF(pdfBuffer, options = {}) {
    try {
      const { language = 'auto', enhance = true, maxPages = 100 } = options;
      
      // Convert language codes
      const languages = this.convertLanguageCode(language);
      
      // Convert buffer to base64
      const base64Data = pdfBuffer.toString('base64');
      
      const response = await axios.post(
        `${this.serverUrl}/ocr/pdf`,
        {
          data: base64Data,
          languages: languages,
          enhance: enhance,
          max_pages: maxPages
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Python OCR PDF processing failed:', error.message);
      throw error;
    }
  }
}

module.exports = new PythonOcrClient();