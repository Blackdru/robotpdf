import { FileValidation, FileTypes } from '../types/index.js';

export const validateFile = (file) => {
  const errors = [];

  // Check file size
  if (file.size > FileValidation.MAX_FILE_SIZE) {
    errors.push(`File size exceeds ${FileValidation.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  // Check file type
  if (!FileValidation.ALLOWED_TYPES.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

const calculatePasswordStrength = (password) => {
  let score = 0;

  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 3) return 'weak';
  if (score < 5) return 'medium';
  return 'strong';
};

export const validatePDFOperation = (operation, fileIds, options = {}) => {
  const errors = [];

  switch (operation) {
    case 'merge':
      if (!fileIds || fileIds.length < 2) {
        errors.push('At least 2 files are required for merging');
      }
      break;

    case 'split':
      if (!fileIds || fileIds.length !== 1) {
        errors.push('Exactly 1 file is required for splitting');
      }
      if (options.pages && !Array.isArray(options.pages)) {
        errors.push('Pages must be an array of page numbers');
      }
      break;

    case 'compress':
      if (!fileIds || fileIds.length !== 1) {
        errors.push('Exactly 1 file is required for compression');
      }
      if (options.quality && (options.quality < 0.1 || options.quality > 1.0)) {
        errors.push('Quality must be between 0.1 and 1.0');
      }
      break;

    case 'convert':
      if (!fileIds || fileIds.length === 0) {
        errors.push('At least 1 file is required for conversion');
      }
      break;

    default:
      errors.push('Invalid operation type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};