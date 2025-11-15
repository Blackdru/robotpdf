import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for Direct AI Vision Analysis
 * Send files directly to AI without OCR preprocessing
 */
export const useDirectAI = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  /**
   * Analyze file directly with AI vision model
   * @param {string} fileId - File ID
   * @param {string} action - 'extract', 'summarize', or 'chat'
   * @param {string} message - Optional custom message
   */
  const analyzeWithVision = async (fileId, action = 'extract', message = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/ai/direct-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          fileId,
          action,
          message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if we should fallback to OCR
        if (data.fallbackToOCR) {
          console.log('Direct AI not available, falling back to OCR');
          throw new Error('FALLBACK_TO_OCR');
        }
        throw new Error(data.error || 'Analysis failed');
      }

      setLoading(false);
      return data.result;

    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Chat with document using vision model
   * @param {string} fileId - File ID
   * @param {string} message - User message/question
   * @param {Array} conversationHistory - Previous messages
   */
  const chatWithDocument = async (fileId, message, conversationHistory = []) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/ai/direct-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          fileId,
          message,
          conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fallbackToOCR) {
          throw new Error('FALLBACK_TO_OCR');
        }
        throw new Error(data.error || 'Chat failed');
      }

      setLoading(false);
      return data.response;

    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Generate smart summary using vision model
   * @param {string} fileId - File ID
   * @param {Object} options - Summary options
   */
  const generateSmartSummary = async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    const {
      includeKeyPoints = true,
      includeSentiment = false,
      includeEntities = false
    } = options;

    try {
      const response = await fetch(`${API_BASE}/api/ai/direct-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          fileId,
          includeKeyPoints,
          includeSentiment,
          includeEntities
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fallbackToOCR) {
          throw new Error('FALLBACK_TO_OCR');
        }
        throw new Error(data.error || 'Summary generation failed');
      }

      setLoading(false);
      return data.result;

    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Check if direct AI is available
   */
  const checkAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/ping`);
      const data = await response.json();
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    analyzeWithVision,
    chatWithDocument,
    generateSmartSummary,
    checkAvailability,
    loading,
    error
  };
};

export default useDirectAI;
