// Plan limits and feature configuration
const PLAN_LIMITS = {
  free: {
    name: 'Free',
    price: 0,
    priceYearly: 0,
    filesPerMonth: -1, // unlimited use of free tools
    maxFileSize: 10 * 1024 * 1024, // 10MB
    storageLimit: 0, // no storage
    aiOperations: 0, // No AI operations
    apiCalls: 0, // No API access
    batchOperations: 1, // Single file operations only
    features: [
      'basic_pdf_ops',
      'file_organization',
      'basic_compression'
    ],
    restrictions: {
      maxFilesPerBatch: 1,
      ocrPages: 0, // No OCR
      ocrFilesPerMonth: 0, // No OCR operations
      summaryLength: 'none', // No AI summaries
      chatMessages: 0, // No AI chat
      summaries: 0, // No AI summaries
      aiChatAccess: false, // No AI chat
      ocrAccess: false, // No OCR
      advancedTools: false // No advanced tools
    }
  },
  pro: {
    name: 'Pro',
    price: 169, // INR per month
    priceYearly: 1500, // INR per year
    filesPerMonth: -1, // unlimited files processing
    maxFileSize: 50 * 1024 * 1024, // 50MB monthly, 100MB yearly (handled in code)
    maxFileSizeYearly: 100 * 1024 * 1024, // 100MB for yearly plan
    storageLimit: 500 * 1024 * 1024, // 500MB monthly
    storageLimitYearly: 1024 * 1024 * 1024, // 1GB for yearly plan
    aiOperations: 150, // 50 OCR + 50 chat + 50 summaries monthly
    aiOperationsYearly: 1500, // 500 OCR + 500 chat + 500 summaries yearly
    apiCalls: 0,
    batchOperations: 10,
    features: [
      'basic_pdf_ops',
      'file_organization',
      'basic_compression',
      'advanced_compression',
      'ai_features',
      'batch_processing',
      'ocr_processing',
      'pdf_chat',
      'summaries',
      'search',
      'advanced_tools',
      'advanced_settings',
      'ad_free'
    ],
    restrictions: {
      maxFilesPerBatch: 10,
      ocrPages: 50, // 50 Advanced OCR pages per month
      ocrPagesYearly: 500, // 500 Advanced OCR pages per year
      ocrFilesPerMonth: -1, // unlimited
      summaryLength: 'detailed',
      chatMessages: 50, // 50 AI chat messages per month
      chatMessagesYearly: 500, // 500 AI chat messages per year
      summaries: 50, // 50 AI summaries per month
      summariesYearly: 500, // 500 AI summaries per year
      aiChatAccess: true,
      ocrAccess: true,
      advancedTools: true, // Access to all advanced tools
      encryptAccess: true,
      digitalSignatureAccess: true,
      advancedSettings: true,
      adFree: true // Ad-free experience
    }
  },
  devs: {
    name: 'Devs',
    price: 459, // INR per month
    priceYearly: 5000, // INR per year
    filesPerMonth: -1, // unlimited
    maxFileSize: 200 * 1024 * 1024, // 200MB
    storageLimit: -1, // unlimited
    aiOperations: -1, // unlimited for personal use
    apiCalls: 1500, // 1500 API requests per month
    apiCallsYearly: 20000, // 20000 API requests per year
    batchOperations: -1, // unlimited
    features: [
      'all_features',
      'api_access',
      'priority_support',
      'advanced_analytics',
      'custom_workflows',
      'white_label',
      'advanced_settings',
      'ad_free'
    ],
    restrictions: {
      maxFilesPerBatch: -1, // unlimited
      ocrPages: -1, // unlimited OCR pages
      ocrFilesPerMonth: -1, // unlimited
      summaryLength: 'comprehensive',
      chatMessages: -1, // unlimited AI chat
      summaries: -1, // unlimited AI summaries
      aiChatAccess: true,
      ocrAccess: true,
      advancedTools: true, // All advanced tools
      advancedSettings: true, // All advanced settings
      adFree: true // Ad-free experience
    }
  }
};

// Feature definitions
const FEATURES = {
  basic_pdf_ops: {
    name: 'Basic PDF Operations',
    description: 'Merge, split, rotate, and basic editing'
  },
  file_organization: {
    name: 'File Organization',
    description: 'Folders, tags, and file management'
  },
  basic_compression: {
    name: 'Basic Compression',
    description: 'Standard PDF compression'
  },
  advanced_compression: {
    name: 'Advanced Compression',
    description: 'High-quality compression with optimization'
  },
  ai_features: {
    name: 'AI Features',
    description: 'AI-powered document analysis'
  },
  batch_processing: {
    name: 'Batch Processing',
    description: 'Process multiple files simultaneously'
  },
  ocr_processing: {
    name: 'OCR Processing',
    description: 'Extract text from scanned documents'
  },
  pdf_chat: {
    name: 'PDF Chat',
    description: 'Chat with your PDF documents'
  },
  summaries: {
    name: 'Document Summaries',
    description: 'AI-generated document summaries'
  },
  search: {
    name: 'Advanced Search',
    description: 'Search within document content'
  },
  api_access: {
    name: 'API Access',
    description: 'Programmatic access to all features'
  },
  priority_support: {
    name: 'Priority Support',
    description: '24/7 priority customer support'
  },
  advanced_analytics: {
    name: 'Advanced Analytics',
    description: 'Detailed usage analytics and insights'
  },
  custom_workflows: {
    name: 'Custom Workflows',
    description: 'Create custom automation workflows'
  },
  white_label: {
    name: 'White Label',
    description: 'Remove branding and customize interface'
  },
  all_features: {
    name: 'All Features',
    description: 'Access to all current and future features'
  }
};

// Helper functions
const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

const hasFeature = (plan, feature) => {
  const planLimits = getPlanLimits(plan);
  return planLimits.features.includes(feature) || planLimits.features.includes('all_features');
};

const isWithinLimit = (plan, limitType, currentValue) => {
  const planLimits = getPlanLimits(plan);
  const limit = planLimits[limitType];
  
  // -1 means unlimited
  if (limit === -1) return true;
  
  return currentValue < limit;
};

const getRemainingLimit = (plan, limitType, currentValue) => {
  const planLimits = getPlanLimits(plan);
  const limit = planLimits[limitType];
  
  // -1 means unlimited
  if (limit === -1) return -1;
  
  return Math.max(0, limit - currentValue);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === -1) return 'Unlimited';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num) => {
  if (num === -1) return 'Unlimited';
  return num.toLocaleString();
};

// Stripe price IDs (to be set in environment variables)
const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || 'price_pro_yearly',
  devs: process.env.STRIPE_PRICE_ID_DEVS || 'price_devs_monthly',
  devs_yearly: process.env.STRIPE_PRICE_ID_DEVS_YEARLY || 'price_devs_yearly'
};

// Plan comparison data for frontend
const PLAN_COMPARISON = [
  {
    feature: 'Advertisements',
    free: 'Supported by ads',
    pro: '✨ Ad-Free',
    devs: '✨ Ad-Free'
  },
  {
    feature: 'Free Tools Usage',
    free: 'Unlimited',
    pro: 'Unlimited',
    devs: 'Unlimited'
  },
  {
    feature: 'Files per month',
    free: 'Unlimited (Free Tools)',
    pro: 'Unlimited',
    devs: 'Unlimited'
  },
  {
    feature: 'Max file size',
    free: '10 MB',
    pro: '50 MB / 100 MB (yearly)',
    devs: '200 MB'
  },
  {
    feature: 'Storage',
    free: 'No Storage',
    pro: '500 MB / 1 GB (yearly)',
    devs: 'Unlimited'
  },
  {
    feature: 'Advanced OCR Pages',
    free: 'None',
    pro: '50/month or 500/year',
    devs: 'Unlimited'
  },
  {
    feature: 'AI Chat Messages',
    free: 'None',
    pro: '50/month or 500/year',
    devs: 'Unlimited'
  },
  {
    feature: 'AI Summaries',
    free: 'None',
    pro: '50/month or 500/year',
    devs: 'Unlimited'
  },
  {
    feature: 'Advanced Tools Access',
    free: false,
    pro: true,
    devs: true
  },
  {
    feature: 'Advanced Settings',
    free: false,
    pro: true,
    devs: true
  },
  {
    feature: 'Priority Support',
    free: false,
    pro: false,
    devs: true
  },
  {
    feature: 'API Access',
    free: false,
    pro: false,
    devs: '1500/month or 20000/year'
  }
];

// CommonJS exports for backend
module.exports = {
  PLAN_LIMITS,
  FEATURES,
  getPlanLimits,
  hasFeature,
  isWithinLimit,
  getRemainingLimit,
  formatFileSize,
  formatNumber,
  STRIPE_PRICE_IDS,
  PLAN_COMPARISON
};

// ES6 exports for frontend (if needed)
if (typeof window !== 'undefined') {
  window.PLAN_LIMITS = PLAN_LIMITS;
  window.FEATURES = FEATURES;
}