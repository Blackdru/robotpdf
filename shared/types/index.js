// Shared types and interfaces for the iLovePDF platform

// User types
export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin'
};

// File types
export const FileTypes = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

// PDF operations
export const PDFOperations = {
  MERGE: 'merge',
  SPLIT: 'split',
  COMPRESS: 'compress',
  CONVERT: 'convert'
};

// History actions
export const HistoryActions = {
  UPLOAD: 'upload',
  MERGE: 'merge',
  SPLIT: 'split',
  COMPRESS: 'compress',
  CONVERT: 'convert',
  DOWNLOAD: 'download',
  DELETE: 'delete'
};

// API response structure
export const createApiResponse = (data, message = 'Success', error = null) => ({
  data,
  message,
  error,
  timestamp: new Date().toISOString()
});

// File validation rules
export const FileValidation = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    FileTypes.PDF,
    FileTypes.JPEG,
    FileTypes.PNG,
    FileTypes.DOC,
    FileTypes.DOCX,
    FileTypes.XLS,
    FileTypes.XLSX
  ],
  MAX_FILES_PER_UPLOAD: 10
};

// User limits
export const UserLimits = {
  FREE: {
    MAX_FILES: 1000,
    MAX_STORAGE: 5 * 1024 * 1024 * 1024, // 5GB
    MAX_OPERATIONS_PER_DAY: 50
  },
  PRO: {
    MAX_FILES: 10000,
    MAX_STORAGE: 50 * 1024 * 1024 * 1024, // 50GB
    MAX_OPERATIONS_PER_DAY: 500
  },
  PREMIUM: {
    MAX_FILES: -1, // Unlimited
    MAX_STORAGE: -1, // Unlimited
    MAX_OPERATIONS_PER_DAY: -1 // Unlimited
  }
};