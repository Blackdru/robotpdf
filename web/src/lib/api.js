const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiClient {
  constructor() {
    this.baseURL = API_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 60000, // 60 second default timeout
      ...options,
    }

    // Check if token needs refresh before making request
    await this.checkAndRefreshToken()

    // Add auth token if available
    const token = this.getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✓ Auth token added to request:', endpoint, '| Token:', token.substring(0, 20) + '...')
    } else {
      console.warn('⚠ No auth token found for request:', endpoint)
      console.log('LocalStorage auth_session:', localStorage.getItem('auth_session')?.substring(0, 50))
    }

    // Create AbortController for timeout with better error handling
    let controller = null
    let timeoutId = null
    
    try {
      // Only create controller if no signal is already provided
      if (!config.signal) {
        controller = new AbortController()
        config.signal = controller.signal
        
        timeoutId = setTimeout(() => {
          if (controller && !controller.signal.aborted) {
            controller.abort('Request timeout')
          }
        }, config.timeout)
      }
    } catch (controllerError) {
      
      // Continue without timeout control
    }

    try {

      const response = await fetch(url, config)
      
      // Clear timeout safely
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage
        }
        
        // Handle specific HTTP status codes
        // Only override error message if we don't have a specific one from the server
        if (response.status === 401) {
          // Try to refresh token once
          const refreshed = await this.tryRefreshToken()
          if (refreshed) {
            // Retry the request with new token
            return this.request(endpoint, options)
          }
          
          // Check if it's a "No token provided" error
          if (errorMessage.includes('No token provided') || errorMessage.includes('No authorization')) {
            // Check if we actually have a token stored
            const hasToken = !!this.getAuthToken()
            if (hasToken) {
              errorMessage = 'Session expired. Please sign in again.'
              this.clearAuthToken()
            } else {
              errorMessage = 'Please sign in to use this feature.'
            }
          } else if (!errorMessage || errorMessage.includes('HTTP 401')) {
            errorMessage = 'Authentication required. Please sign in again.'
            this.clearAuthToken()
          }
        } else if (response.status === 403) {
          if (!errorMessage || errorMessage.includes('HTTP 403')) {
            errorMessage = 'Access denied. Please check your permissions.'
          }
        } else if (response.status === 404) {
          if (!errorMessage || errorMessage.includes('HTTP 404')) {
            errorMessage = 'Resource not found. Please check the URL or try again.'
          }
        } else if (response.status === 429) {
          if (!errorMessage || errorMessage.includes('HTTP 429')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.'
          }
        } else if (response.status >= 500) {
          // For 500 errors, only use generic message if we don't have a specific error from server
          if (!errorMessage || errorMessage.includes('HTTP 500') || errorMessage === 'Internal Server Error') {
            errorMessage = 'Server error. Please try again later.'
          }
          // Otherwise keep the specific error message from the server (like "Incorrect password")
        }
        
        throw new Error(errorMessage)
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return response
      }
    } catch (error) {
      // Clear timeout safely
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      console.error('❌ API request failed:', error)
      console.error('Request URL:', url)
      console.error('Request headers:', config.headers)
      console.error('Has auth token:', !!config.headers.Authorization)
      
      // Safely get error message
      const errorMessage = error?.message || String(error) || 'Unknown error'
      
      // Handle different types of errors
      if (error.name === 'AbortError' || 
          errorMessage.includes('signal is aborted') || 
          errorMessage.includes('The operation was aborted') ||
          errorMessage.includes('aborted without reason') ||
          errorMessage.includes('Request timeout')) {
        throw new Error('Request timeout. Please check your connection and try again.')
      }
      
      if (error.name === 'TypeError' && (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch'))) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.')
      }
      
      if (errorMessage.includes('ERR_CONNECTION_REFUSED') || errorMessage.includes('ERR_FAILED')) {
        throw new Error('Server unavailable: The service is currently down. Please try again later.')
      }
      
      if (errorMessage.includes('ERR_NETWORK')) {
        throw new Error('Network error: Please check your internet connection and try again.')
      }
      
      if (errorMessage.includes('ERR_INTERNET_DISCONNECTED')) {
        throw new Error('No internet connection: Please check your network settings.')
      }
      
      // Re-throw the error if it's already a formatted error message
      throw error
    }
  }

  // Helper method to get auth token
  getAuthToken() {
    // First, try to get JWT token from new auth system
    const authSession = localStorage.getItem('auth_session')
    console.log('🔍 Checking auth_session:', authSession ? 'Found' : 'Not found')
    
    if (authSession) {
      try {
        const sessionData = JSON.parse(authSession)
        console.log('📦 Session data structure:', Object.keys(sessionData))
        
        // Direct access_token property
        if (sessionData.access_token) {
          console.log('✓ Found access_token directly')
          return sessionData.access_token
        }
        // Also check for nested session property
        if (sessionData.session?.access_token) {
          console.log('✓ Found access_token in nested session')
          return sessionData.session.access_token
        }
        console.warn('⚠ No access_token found in session data')
      } catch (e) {
        console.error('❌ Error parsing auth_session:', e)
        // Clear corrupted session
        localStorage.removeItem('auth_session')
      }
    }

    // Fallback to Supabase token (for Google OAuth backward compatibility)
    let token = localStorage.getItem('supabase.auth.token')
    
    if (!token) {
      // Try to get token from Supabase session - search for project-specific key
      // Supabase stores session with key format: sb-{project-ref}-auth-token
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const supabaseSession = localStorage.getItem(key)
          if (supabaseSession) {
            try {
              const sessionData = JSON.parse(supabaseSession)
              if (sessionData.access_token) {
                token = sessionData.access_token
                break
              }
            } catch (e) {
              
            }
          }
        }
      }
    }

    if (!token) {
      // Try alternative storage keys
      const altKeys = [
        'sb-localhost-auth-token',
        'sb-auth-token',
        'supabase-auth-token',
        'auth-token'
      ]
      
      for (const key of altKeys) {
        const altToken = localStorage.getItem(key)
        if (altToken) {
          try {
            const parsed = JSON.parse(altToken)
            if (parsed.access_token) {
              token = parsed.access_token
              break
            }
          } catch (e) {
            // If it's not JSON, use as-is
            token = altToken
            break
          }
        }
      }
    }

    return token
  }

  // Helper method to clear auth token
  clearAuthToken() {
    const keys = [
      'auth_session',
      'supabase.auth.token',
      'sb-localhost-auth-token',
      'sb-auth-token',
      'supabase-auth-token',
      'auth-token'
    ]
    
    keys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Also clear any Supabase project-specific auth tokens
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key)
      }
    }
  }

  // Check if token is expired and refresh if needed
  async checkAndRefreshToken() {
    const authSession = localStorage.getItem('auth_session')
    if (!authSession) return

    try {
      const sessionData = JSON.parse(authSession)
      const token = sessionData.access_token
      
      if (!token) return

      // Decode JWT to check expiration (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      
      // Refresh if token expires in less than 5 minutes
      if (expiresAt - now < 5 * 60 * 1000) {
        console.log('Token expiring soon, refreshing...')
        await this.tryRefreshToken()
      }
    } catch (error) {
      console.error('Error checking token expiration:', error)
    }
  }

  // Try to refresh the token
  async tryRefreshToken() {
    const authSession = localStorage.getItem('auth_session')
    if (!authSession) return false

    try {
      const sessionData = JSON.parse(authSession)
      const refreshToken = sessionData.refresh_token
      
      if (!refreshToken) return false

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (response.ok) {
        const data = await response.json()
        const newSession = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in
        }
        localStorage.setItem('auth_session', JSON.stringify(newSession))
        console.log('✓ Token refreshed successfully')
        return true
      } else {
        console.error('Token refresh failed')
        this.clearAuthToken()
        return false
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      this.clearAuthToken()
      return false
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const healthUrl = `${this.baseURL.replace('/api', '')}/health`
      const response = await fetch(healthUrl, { timeout: 5000 })
      if (response.ok) {
        const data = await response.json()
        return data.status === 'OK'
      }
      return false
    } catch (error) {
      
      return false
    }
  }

  // Retry mechanism for failed requests
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create a completely fresh options object for each attempt
        const attemptOptions = {
          ...options,
          signal: undefined, // Clear any existing signal
          timeout: options.timeout || 30000 // Ensure timeout is set
        }
        
        return await this.request(endpoint, attemptOptions)
      } catch (error) {
        lastError = error
        
        // Don't retry on authentication errors or client errors
        if (error.message.includes('Authentication') || 
            error.message.includes('Access denied') ||
            error.message.includes('404') ||
            error.message.includes('File not found')) {
          throw error
        }
        
        // Don't retry timeout errors on the last attempt
        if (attempt === maxRetries || error.message.includes('timeout')) {
          throw error
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email, password, name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile')
  }

  async updateProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getUserStats() {
    return this.request('/users/stats')
  }

  async getUserHistory(page = 1, limit = 20) {
    return this.request(`/users/history?page=${page}&limit=${limit}`)
  }

  // File endpoints
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      return await this.request('/files/upload', {
        method: 'POST',
        headers: {}, // Remove Content-Type to let browser set it for FormData
        body: formData,
        timeout: 600000, // 10 minutes for large file uploads
      })
    } catch (error) {
      // Enhanced error handling for file uploads
      const errorMsg = error?.message || String(error)
      
      if (errorMsg.includes('File size exceeds')) {
        // Extract size limit and upgrade info from error
        const match = errorMsg.match(/(\d+)MB/)
        const limit = match ? match[1] : '10'
        throw new Error(`File too large. Maximum size: ${limit}MB. ${errorMsg.includes('Upgrade') ? 'Upgrade to Premium for larger files.' : ''}`)
      }
      
      if (errorMsg.includes('Invalid file type')) {
        throw new Error('Invalid file type. Please upload a supported file format (PDF, images, Word, Excel).')
      }
      
      if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        throw new Error('Upload timeout. The file may be too large or your connection is slow. Please try again.')
      }
      
      if (errorMsg.includes('Network error') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Network error during upload. Please check your connection and try again.')
      }
      
      throw error
    }
  }

  async uploadMultipleFiles(files) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    try {
      return await this.request('/files/upload-multiple', {
        method: 'POST',
        headers: {}, // Remove Content-Type to let browser set it for FormData
        body: formData,
        timeout: 600000, // 10 minutes for large file uploads
      })
    } catch (error) {
      // Enhanced error handling for file uploads
      const errorMsg = error?.message || String(error)
      
      if (errorMsg.includes('File size exceeds') || errorMsg.includes('exceed')) {
        const match = errorMsg.match(/(\d+)MB/)
        const limit = match ? match[1] : '10'
        throw new Error(`One or more files too large. Maximum size: ${limit}MB per file. ${errorMsg.includes('Upgrade') ? 'Upgrade to Premium for larger files.' : ''}`)
      }
      
      if (errorMsg.includes('Invalid file type')) {
        throw new Error('Invalid file type detected. Please upload only supported file formats.')
      }
      
      if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        throw new Error('Upload timeout. Files may be too large or connection is slow. Try uploading fewer files.')
      }
      
      throw error
    }
  }

  async getFiles(page = 1, limit = 20, options = {}) {
    const { search, type, sortBy, sortOrder } = options
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(type && { type }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    })
    
    return this.request(`/files?${params}`)
  }

  async getFile(fileId) {
    return this.request(`/files/${fileId}`)
  }

  async downloadFile(fileId) {
    let token = this.getAuthToken()
    
    const url = `${this.baseURL}/files/${fileId}/download?t=${Date.now()}`
    
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error('Download failed')
    }

    return response.blob()
  }

  async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    })
  }

  // PDF operations
  async mergePDFs(fileIds, outputName = 'merged.pdf') {
    return this.request('/pdf/merge', {
      method: 'POST',
      body: JSON.stringify({ fileIds, outputName }),
    })
  }

  async splitPDF(fileId, pages = null, outputName = 'split.pdf') {
    return this.request('/pdf/split', {
      method: 'POST',
      body: JSON.stringify({ fileId, pages, outputName }),
    })
  }

  async compressPDF(fileId, quality = 0.7, outputName = 'compressed.pdf') {
    return this.request('/pdf/compress', {
      method: 'POST',
      body: JSON.stringify({ fileId, quality, outputName }),
    })
  }

  async convertImagesToPDF(fileIds, outputName = 'converted.pdf') {
    return this.request('/pdf/convert/images-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ fileIds, outputName }),
    })
  }

  async getPDFInfo(fileId) {
    return this.request(`/pdf/info/${fileId}`)
  }

  // Simple conversion endpoints
  async convertPDFToWord(fileId, outputName = 'converted.docx') {
    return this.request('/pdf/simple-convert', {
      method: 'POST',
      body: JSON.stringify({ 
        fileId, 
        outputFormat: 'docx',
        outputName 
      }),
    })
  }

  async convertWordToPDF(fileId, outputName = 'converted.pdf') {
    return this.request('/pdf/simple-convert', {
      method: 'POST',
      body: JSON.stringify({ 
        fileId, 
        outputFormat: 'pdf',
        sourceFormat: 'word',
        outputName 
      }),
    })
  }

  async convertPDFToExcel(fileId, outputName = 'converted.xlsx') {
    return this.request('/pdf/simple-convert', {
      method: 'POST',
      body: JSON.stringify({ 
        fileId, 
        outputFormat: 'xlsx',
        outputName 
      }),
    })
  }

  async convertExcelToPDF(fileId, outputName = 'converted.pdf') {
    return this.request('/pdf/simple-convert', {
      method: 'POST',
      body: JSON.stringify({ 
        fileId, 
        outputFormat: 'pdf',
        sourceFormat: 'excel',
        outputName 
      }),
    })
  }

  async convertHTMLToPDF(url, outputName = 'webpage.pdf') {
    return this.request('/pdf/html-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ url, outputName }),
      timeout: 60000, // 1 minute for webpage conversion
    })
  }

  async convertHTMLFileToPDF(fileId, outputName = 'webpage.pdf') {
    return this.request('/pdf/html-file-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ fileId, outputName }),
      timeout: 60000, // 1 minute for HTML file conversion
    })
  }

  async advancedHTMLToPDF(url, outputName = 'webpage.pdf', options = {}) {
    return this.request('/pdf/advanced/advanced-html-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ url, outputName, options }),
      timeout: 120000, // 2 minutes for advanced webpage conversion
    })
  }

  async advancedHTMLFileToPDF(fileId, outputName = 'webpage.pdf', options = {}) {
    return this.request('/pdf/advanced/advanced-html-file-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ fileId, outputName, options }),
      timeout: 120000, // 2 minutes for advanced HTML file conversion
    })
  }

  // Advanced PDF operations
  async advancedMergePDFs(fileIds, outputName, options = {}) {
    return this.request('/pdf/advanced/advanced-merge', {
      method: 'POST',
      body: JSON.stringify({ fileIds, outputName, options }),
    })
  }

  async advancedSplitPDF(fileId, options = {}) {
    return this.request('/pdf/advanced/advanced-split', {
      method: 'POST',
      body: JSON.stringify({ fileId, options }),
    })
  }

  async advancedCompressPDF(fileId, outputName, options = {}) {
    return this.request('/pdf/advanced/advanced-compress', {
      method: 'POST',
      body: JSON.stringify({ fileId, outputName, options }),
    })
  }

  async advancedImagesToPDF(fileIds, outputName, options = {}) {
    return this.request('/pdf/advanced/advanced-images-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ fileIds, outputName, options }),
    })
  }

  async passwordProtectPDF(fileId, password, permissions = {}, outputName = 'protected.pdf') {
    return this.request('/pdf/advanced/password-protect', {
      method: 'POST',
      body: JSON.stringify({ fileId, password, permissions, outputName }),
    })
  }

  async createPDFForm(formFields, pageSize = 'A4', outputName = 'form.pdf', options = {}) {
    return this.request('/pdf/advanced/create-form', {
      method: 'POST',
      body: JSON.stringify({ formFields, pageSize, outputName, options }),
    })
  }

  async digitalSignPDF(fileId, signatureData, position = { x: 100, y: 100 }, outputName = 'signed.pdf') {
    return this.request('/pdf/advanced/digital-sign', {
      method: 'POST',
      body: JSON.stringify({ fileId, signatureData, position, outputName }),
    })
  }

  async annotatePDF(fileId, annotations = [], outputName = 'annotated.pdf') {
    return this.request('/pdf/advanced/annotate', {
      method: 'POST',
      body: JSON.stringify({ fileId, annotations, outputName }),
    })
  }

  async analyzePDF(fileId) {
    return this.request(`/pdf/advanced/analyze/${fileId}`)
  }

  // Admin endpoints
  async getUsers(page = 1, limit = 20, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    })
    
    return this.request(`/admin/users?${params}`)
  }

  async getUserDetails(userId) {
    return this.request(`/admin/users/${userId}`)
  }

  async updateUserRole(userId, role) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async getAdminStats() {
    return this.request('/admin/stats')
  }

  async getAdminActivity(page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    return this.request(`/admin/activity?${params}`)
  }

  async getStorageUsage() {
    return this.request('/admin/storage')
  }

  // AI endpoints
  async performOCR(fileId, options = {}) {
    return this.request('/ai/ocr', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
      timeout: 120000, // 2 minutes for OCR
    })
  }

  async summarizeFile(fileId, summaryType = 'auto') {
    return this.request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ fileId, summaryType }),
    })
  }

  async smartSummary(fileId, options = {}) {
    return this.request('/ai/smart-summary', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
      timeout: 120000, // 2 minutes for AI operations
    })
  }

  async createEmbeddings(fileId, options = {}) {
    return this.request('/ai/create-embeddings', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
      timeout: 90000, // 90 seconds for embeddings
    })
  }

  async chatWithPDF(fileId, message, sessionId = null) {
    return this.request('/ai/chat-pdf', {
      method: 'POST',
      body: JSON.stringify({ fileId, message, sessionId }),
    })
  }

  async getChatSessions(fileId) {
    return this.request(`/ai/chat-sessions/${fileId}`)
  }

  async getChatMessages(sessionId) {
    return this.request(`/ai/chat-messages/${sessionId}`)
  }

  async getRecommendations(fileId) {
    return this.request(`/ai/recommendations/${fileId}`)
  }

  async getOCRResults(fileId) {
    return this.request(`/ai/ocr/${fileId}`)
  }

  async getSummaries(fileId) {
    return this.request(`/ai/summaries/${fileId}`)
  }

  // Translation endpoint
  async translateText(text, targetLanguage = 'en') {
    return this.request('/ai/translate-text', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage }),
      timeout: 60000, // 1 minute for translation
    })
  }

  // Batch processing endpoints
  async createBatchOperation(name, operations) {
    return this.request('/batch', {
      method: 'POST',
      body: JSON.stringify({ name, operations }),
    })
  }

  async getBatchOperation(batchId) {
    return this.request(`/batch/${batchId}`)
  }

  async getBatchOperations(page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    return this.request(`/batch?${params}`)
  }

  async cancelBatchOperation(batchId) {
    return this.request(`/batch/${batchId}`, {
      method: 'DELETE',
    })
  }

  async getBatchTemplates() {
    return this.request('/batch/templates/common')
  }

  async createBatchFromTemplate(templateId, name, fileIds, customOptions = {}) {
    return this.request('/batch/from-template', {
      method: 'POST',
      body: JSON.stringify({ templateId, name, fileIds, customOptions }),
    })
  }

  async getBatchProgress(batchId) {
    return this.request(`/batch/${batchId}/progress`)
  }

  // Folder endpoints
  async createFolder(name, parentId = null, color = '#3B82F6') {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId, color }),
    })
  }

  async getFolders(parentId = null, flat = false) {
    const params = new URLSearchParams()
    if (parentId) params.append('parent_id', parentId)
    if (flat) params.append('flat', 'true')
    
    return this.request(`/folders?${params}`)
  }

  async getFolder(folderId) {
    return this.request(`/folders/${folderId}`)
  }

  async updateFolder(folderId, updates) {
    return this.request(`/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteFolder(folderId, force = false) {
    const params = force ? '?force=true' : ''
    return this.request(`/folders/${folderId}${params}`, {
      method: 'DELETE',
    })
  }

  async moveFiles(fileIds, folderId = null) {
    return this.request('/folders/move-files', {
      method: 'POST',
      body: JSON.stringify({ fileIds, folder_id: folderId }),
    })
  }

  async getFolderStats(folderId) {
    return this.request(`/folders/${folderId}/stats`)
  }

  // Resume generation endpoints
  async generateResume(userData, options = {}) {
    return this.request('/v1/resumes/generate', {
      method: 'POST',
      body: JSON.stringify({ userData, options }),
      timeout: 120000, // 2 minutes for AI generation
    })
  }

  async enhanceResumeSection(resumeId, sectionType, content, context = {}) {
    return this.request(`/v1/resumes/${resumeId}/enhance-section`, {
      method: 'POST',
      body: JSON.stringify({ sectionType, content, context }),
    })
  }

  async generateMultipleResumes(userData, targetRoles) {
    return this.request('/v1/resumes/generate-multiple', {
      method: 'POST',
      body: JSON.stringify({ userData, targetRoles }),
      timeout: 120000, // 2 minutes for multiple resumes
    })
  }

  async getResumeSuggestions(resumeId) {
    return this.request(`/v1/resumes/${resumeId}/suggestions`, {
      method: 'POST',
    })
  }

  async getResumeTemplates() {
    return this.request('/v1/resumes/templates')
  }

  async getResumeIndustries() {
    return this.request('/v1/resumes/industries')
  }

  async getResumeExperienceLevels() {
    return this.request('/v1/resumes/experience-levels')
  }

  async downloadResume(resumeId, format = 'pdf', version = 'optimized') {
    const token = this.getAuthToken()
    const url = `${this.baseURL}/v1/resumes/${resumeId}/download?format=${format}&version=${version}`
    
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error('Download failed')
    }

    return response.blob()
  }

  async getResumeHistory() {
    return this.request('/v1/resumes/history')
  }

  async optimizeResume(resumeId, jobDescription, tone = 'professional') {
    return this.request(`/v1/resumes/${resumeId}/optimize`, {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription, tone }),
      timeout: 60000,
    })
  }

  async calculateATSScore(resumeId, jobDescription) {
    return this.request(`/v1/resumes/${resumeId}/score`, {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription }),
    })
  }

  async generateCoverLetter(resumeId, jobDescription, companyName, tone = 'professional') {
    return this.request(`/v1/resumes/${resumeId}/cover-letter`, {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription, company_name: companyName, tone }),
    })
  }

  // Generic GET/POST methods for flexibility
  async get(endpoint) {
    return this.request(endpoint)
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient()