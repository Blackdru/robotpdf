/**
 * File Encoder Utility
 * Provides consistent base64 encoding for file responses across all API endpoints
 */

/**
 * Encode a buffer to base64 string with validation
 * @param {Buffer} buffer - The file buffer to encode
 * @param {string} filename - Original filename for logging
 * @returns {string} Base64 encoded string
 */
function encodeFileToBase64(buffer, filename = 'unknown') {
  try {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Input must be a Buffer');
    }

    if (buffer.length === 0) {
      throw new Error('Buffer is empty');
    }

    // Convert buffer to base64
    const base64String = buffer.toString('base64');

    // Validate the base64 string
    if (!base64String || base64String.length === 0) {
      throw new Error('Base64 encoding resulted in empty string');
    }

    // Log for debugging (remove in production if needed)
    console.log(`Encoded file: ${filename}, Original size: ${buffer.length}, Base64 length: ${base64String.length}`);

    return base64String;
  } catch (error) {
    console.error(`Error encoding file ${filename}:`, error);
    throw new Error(`Failed to encode file: ${error.message}`);
  }
}

/**
 * Decode a base64 string to buffer with validation
 * @param {string} base64String - The base64 string to decode
 * @returns {Buffer} Decoded buffer
 */
function decodeBase64ToBuffer(base64String) {
  try {
    if (typeof base64String !== 'string') {
      throw new Error('Input must be a string');
    }

    if (base64String.length === 0) {
      throw new Error('Base64 string is empty');
    }

    // Remove any whitespace or newlines that might have been added
    const cleanBase64 = base64String.replace(/\s/g, '');

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      throw new Error('Invalid base64 string format');
    }

    // Decode to buffer
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length === 0) {
      throw new Error('Decoded buffer is empty');
    }

    return buffer;
  } catch (error) {
    console.error('Error decoding base64:', error);
    throw new Error(`Failed to decode base64: ${error.message}`);
  }
}

/**
 * Create a standardized file response object
 * @param {Buffer} buffer - The file buffer
 * @param {Object} metadata - Additional metadata about the file
 * @returns {Object} Standardized response object
 */
function createFileResponse(buffer, metadata = {}) {
  try {
    const base64String = encodeFileToBase64(buffer, metadata.filename);

    return {
      file_size: buffer.length,
      file_base64: base64String,
      ...metadata
    };
  } catch (error) {
    console.error('Error creating file response:', error);
    throw error;
  }
}

/**
 * Validate that a buffer can be properly encoded and decoded
 * @param {Buffer} buffer - The buffer to validate
 * @returns {boolean} True if valid
 */
function validateBufferEncoding(buffer) {
  try {
    const encoded = buffer.toString('base64');
    const decoded = Buffer.from(encoded, 'base64');
    return buffer.equals(decoded);
  } catch (error) {
    console.error('Buffer validation failed:', error);
    return false;
  }
}

module.exports = {
  encodeFileToBase64,
  decodeBase64ToBuffer,
  createFileResponse,
  validateBufferEncoding
};
