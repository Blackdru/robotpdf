
class OCRService {
  static isAvailable() {
    return process.env.NODE_ENV === 'test' || process.env.OCR_SERVICE_URL;
  }
  
  static async processFile(fileId, options = {}) {
    try {
      // Mock OCR processing for tests
      if (process.env.NODE_ENV === 'test') {
        return {
          extractedText: 'This is mock extracted text from the PDF document.',
          confidence: 0.95,
          language: options.language || 'eng',
          detectedLanguage: 'eng',
          enhancedText: options.enhanceWithAI ? 'Enhanced mock text with AI improvements.' : null,
          translatedText: options.translateTo ? `Translated text to ${options.translateTo}` : null,
          aiEnhanced: options.enhanceWithAI || false
        };
      }
      
      // Real OCR processing would go here
      throw new Error('OCR service not configured for production');
      
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  }
}

module.exports = OCRService;
