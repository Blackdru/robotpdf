import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication headers
 */
async function getAuthHeaders() {
  // Try custom auth session first (JWT from backend)
  const authSession = localStorage.getItem('auth_session');
  
  if (authSession) {
    try {
      const session = JSON.parse(authSession);
      if (session.access_token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        };
      }
    } catch (error) {
      console.error('Error parsing auth session:', error);
    }
  }
  
  // Fallback to Supabase session (for Google OAuth)
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    throw new Error('Authentication error: ' + error.message);
  }
  
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }
  
  throw new Error('Please log in to access the developer portal');
}

/**
 * Handle API response
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  return response.json();
}

/**
 * Developer Portal API Service
 */
export const developerApi = {
  /**
   * Get dashboard statistics
   */
  async getPortalStats() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dev/portal/stats`, {
      headers
    });
    return handleResponse(response);
  },

  /**
   * List all API keys
   */
  async listKeys() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dev/keys`, {
      headers
    });
    return handleResponse(response);
  },

  /**
   * Create new API key
   * @param {Object} data - Key data
   * @param {string} data.name - Key name
   * @param {number} data.monthly_limit - Monthly request limit
   */
  async createKey(data) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dev/keys`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  /**
   * Delete API key
   * @param {string} keyId - Key ID to delete
   */
  async deleteKey(keyId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dev/keys/${keyId}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse(response);
  },

  /**
   * Regenerate API secret
   * @param {string} keyId - Key ID to regenerate
   */
  async regenerateKey(keyId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dev/keys/${keyId}/regenerate`, {
      method: 'POST',
      headers
    });
    return handleResponse(response);
  },

  /**
   * Get usage statistics
   * @param {string} timeRange - Time range (24h, 7d, 30d, 90d)
   */
  async getUsage(timeRange = '30d') {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dev/usage?timeRange=${timeRange}`, {
      headers
    });
    return handleResponse(response);
  },

  /**
   * Get API call logs
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of logs to fetch
   * @param {number} options.offset - Offset for pagination
   */
  async getLogs(options = {}) {
    const headers = await getAuthHeaders();
    const { limit = 50, offset = 0 } = options;
    const response = await fetch(`${API_BASE_URL}/dev/logs?limit=${limit}&offset=${offset}`, {
      headers
    });
    return handleResponse(response);
  },

  /**
   * Test API endpoint with given credentials
   * @param {Object} config - Test configuration
   * @param {string} config.apiKey - API key
   * @param {string} config.apiSecret - API secret
   * @param {string} config.endpoint - Endpoint to test
   * @param {string} config.method - HTTP method
   * @param {Object} config.body - Request body
   */
  async testEndpoint(config) {
    const { apiKey, apiSecret, endpoint, method = 'GET', body = null } = config;

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret
    };

    const options = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    const result = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: null
    };

    try {
      result.body = await response.json();
    } catch {
      result.body = await response.text();
    }

    return result;
  }
};

/**
 * Public API endpoints (with API key auth)
 */
export const publicApi = {
  /**
   * Make a request to the public API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @param {string} apiKey - API key
   * @param {string} apiSecret - API secret
   */
  async request(endpoint, options = {}, apiKey, apiSecret) {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
      ...options,
      headers
    });

    return handleResponse(response);
  },

  /**
   * Check API health
   */
  async health(apiKey, apiSecret) {
    return this.request('/health', {}, apiKey, apiSecret);
  },

  /**
   * Get usage statistics
   */
  async getUsage(apiKey, apiSecret) {
    return this.request('/usage', {}, apiKey, apiSecret);
  },

  /**
   * OCR Pro
   */
  async ocr(file, apiKey, apiSecret) {
    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = {
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret
    };

    const response = await fetch(`${API_BASE_URL}/v1/ocr`, {
      method: 'POST',
      headers,
      body: formData
    });

    return handleResponse(response);
  }
};

export default developerApi;
