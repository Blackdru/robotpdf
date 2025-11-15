
const fs = require('fs');

class CompressionService {
  static calculateCompressionRatio(originalSize, compressedSize) {
    if (originalSize === 0) return 0;
    
    // Ensure we have valid numbers
    const original = Number(originalSize);
    const compressed = Number(compressedSize);
    
    if (isNaN(original) || isNaN(compressed)) return 0;
    if (original <= 0 || compressed < 0) return 0;
    
    // Calculate ratio as percentage reduction
    const ratio = ((original - compressed) / original) * 100;
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, ratio));
  }
  
  static async compressFile(filePath, options = {}) {
    try {
      const originalStats = fs.statSync(filePath);
      const originalSize = originalStats.size;
      
      // Simulate compression (replace with actual compression logic)
      const compressionLevel = options.compressionLevel || 'medium';
      let compressionFactor;
      
      switch (compressionLevel) {
        case 'low': compressionFactor = 0.9; break;
        case 'medium': compressionFactor = 0.7; break;
        case 'high': compressionFactor = 0.5; break;
        case 'maximum': compressionFactor = 0.3; break;
        default: compressionFactor = 0.7;
      }
      
      const compressedSize = Math.floor(originalSize * compressionFactor);
      const compressionRatio = this.calculateCompressionRatio(originalSize, compressedSize);
      
      return {
        originalSize,
        compressedSize,
        compressionRatio,
        success: true
      };
      
    } catch (error) {
      console.error('Compression error:', error);
      return {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CompressionService;
