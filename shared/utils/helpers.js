export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const getFileIcon = (mimeType) => {
  const iconMap = {
    'application/pdf': 'file-pdf-box',
    'image/jpeg': 'file-image',
    'image/jpg': 'file-image',
    'image/png': 'file-image',
    'application/msword': 'file-word-box',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file-word-box',
    'application/vnd.ms-excel': 'file-excel-box',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file-excel-box'
  };
  
  return iconMap[mimeType] || 'file';
};

export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const sanitizeFilename = (filename) => {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
};

export const calculateStorageUsage = (files) => {
  return files.reduce((total, file) => total + (file.size || 0), 0);
};

export const groupFilesByType = (files) => {
  return files.reduce((groups, file) => {
    const type = file.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(file);
    return groups;
  }, {});
};

export const sortFiles = (files, sortBy = 'created_at', order = 'desc') => {
  return [...files].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle date strings
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Handle string comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const filterFiles = (files, filters = {}) => {
  return files.filter(file => {
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!file.filename.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    
    // Filter by file type
    if (filters.type && file.type !== filters.type) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fileDate = new Date(file.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (fileDate < fromDate) {
        return false;
      }
    }
    
    if (filters.dateTo) {
      const fileDate = new Date(file.created_at);
      const toDate = new Date(filters.dateTo);
      if (fileDate > toDate) {
        return false;
      }
    }
    
    // Filter by size range
    if (filters.minSize && file.size < filters.minSize) {
      return false;
    }
    
    if (filters.maxSize && file.size > filters.maxSize) {
      return false;
    }
    
    return true;
  });
};