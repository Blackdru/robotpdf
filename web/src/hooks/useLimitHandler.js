import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle plan limit errors
 * Provides consistent error handling and user feedback across the app
 */
export const useLimitHandler = () => {
  const { subscription } = useSubscription();
  const [limitModal, setLimitModal] = useState({
    isOpen: false,
    limitType: null,
    currentPlan: null,
    limit: null,
    current: null,
    remaining: null,
    message: null
  });

  /**
   * Parse error response and show appropriate UI
   */
  const handleLimitError = (error) => {
    // Check if it's a limit error
    if (!error || typeof error !== 'object') {
      toast.error('An error occurred. Please try again.');
      return false;
    }

    const errorMessage = error.message || error.error || '';
    const isLimitError = 
      errorMessage.includes('limit') || 
      errorMessage.includes('exceeded') ||
      errorMessage.includes('Limit') ||
      errorMessage.includes('Exceeded');

    if (!isLimitError) {
      // Not a limit error, show generic error
      toast.error(errorMessage || 'An error occurred. Please try again.');
      return false;
    }

    // Parse limit error details
    const limitType = detectLimitType(errorMessage, error);
    
    // Show limit modal
    setLimitModal({
      isOpen: true,
      limitType,
      currentPlan: error.plan || subscription?.plan || 'free',
      limit: error.limit,
      current: error.current,
      remaining: error.remaining,
      message: errorMessage
    });

    // Also show toast for quick feedback
    showLimitToast(limitType, error.plan || subscription?.plan);

    return true;
  };

  /**
   * Detect the type of limit from error message
   */
  const detectLimitType = (message, error) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('file limit') || lowerMessage.includes('files per month')) {
      return 'filesPerMonth';
    }
    if (lowerMessage.includes('storage')) {
      return 'storageLimit';
    }
    if (lowerMessage.includes('ai') || lowerMessage.includes('ocr') || lowerMessage.includes('chat')) {
      return 'aiOperations';
    }
    if (lowerMessage.includes('batch')) {
      return 'batchSize';
    }
    if (lowerMessage.includes('file size') || lowerMessage.includes('file too large')) {
      return 'fileSize';
    }
    if (lowerMessage.includes('api')) {
      return 'apiCalls';
    }
    
    return 'general';
  };

  /**
   * Show appropriate toast message
   */
  const showLimitToast = (limitType, plan) => {
    const messages = {
      filesPerMonth: `📁 Monthly file limit reached! Upgrade to Pro for unlimited files.`,
      storageLimit: `💾 Storage limit reached! Upgrade to Pro for unlimited storage.`,
      aiOperations: `🤖 AI operations limit reached! Upgrade to Pro for unlimited AI features.`,
      batchSize: `📦 Batch size limit exceeded! Upgrade to Pro for unlimited batch processing.`,
      fileSize: `📏 File too large for ${plan} plan! Upgrade to Pro for larger files.`,
      apiCalls: `🔌 API call limit reached! Upgrade to Pro for more API calls.`,
      general: `⚠️ Plan limit reached! Upgrade to Pro for unlimited access.`
    };

    toast.error(messages[limitType] || messages.general, {
      duration: 5000,
      icon: '⚠️'
    });
  };

  /**
   * Close the limit modal
   */
  const closeLimitModal = () => {
    setLimitModal({
      isOpen: false,
      limitType: null,
      currentPlan: null,
      limit: null,
      current: null,
      remaining: null,
      message: null
    });
  };

  /**
   * Check if user can perform an action before attempting it
   */
  const checkLimit = (limitType, increment = 1) => {
    if (!subscription) return true;

    const { usage, planLimits } = subscription;
    if (!usage || !planLimits) return true;

    const limit = planLimits[limitType];
    if (limit === -1) return true; // Unlimited

    let currentValue = 0;
    switch (limitType) {
      case 'filesPerMonth':
        currentValue = usage.files_processed || 0;
        break;
      case 'storageLimit':
        currentValue = usage.storage_used || 0;
        break;
      case 'aiOperations':
        currentValue = usage.ai_operations || 0;
        break;
      case 'apiCalls':
        currentValue = usage.api_calls || 0;
        break;
      default:
        return true;
    }

    const wouldExceed = (currentValue + increment) > limit;
    
    if (wouldExceed) {
      // Show limit modal preemptively
      setLimitModal({
        isOpen: true,
        limitType,
        currentPlan: subscription.plan,
        limit,
        current: currentValue,
        remaining: Math.max(0, limit - currentValue),
        message: `You have reached your ${limitType} limit.`
      });
      
      showLimitToast(limitType, subscription.plan);
      return false;
    }

    return true;
  };

  /**
   * Format error message for display
   */
  const formatErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return 'An error occurred. Please try again.';
  };

  /**
   * Handle API errors with proper user feedback
   */
  const handleApiError = async (error, customMessage = null) => {
    console.error('API Error:', error);

    // Try to parse error response
    let errorData = error;
    
    if (error.response) {
      try {
        errorData = await error.response.json();
      } catch (e) {
        errorData = { message: error.message || 'Network error' };
      }
    } else if (error instanceof Error) {
      errorData = { message: error.message };
    }

    // Check if it's a limit error
    const isLimitError = handleLimitError(errorData);
    
    // If not a limit error, show custom or generic message
    if (!isLimitError && customMessage) {
      toast.error(customMessage);
    }

    return errorData;
  };

  return {
    limitModal,
    closeLimitModal,
    handleLimitError,
    handleApiError,
    checkLimit,
    formatErrorMessage
  };
};

export default useLimitHandler;
