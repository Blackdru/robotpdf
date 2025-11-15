import { api } from './api'

class AIChatService {
  constructor() {
    this.sessions = new Map()
    this.isInitialized = false
  }

  // Initialize AI chat for a file
  async initializeChat(fileId) {
    try {

      // Check if already initializing to prevent race conditions
      if (this.initializingFiles && this.initializingFiles.has(fileId)) {
        
        return {
          success: false,
          message: 'Chat initialization already in progress',
          fileId: fileId
        }
      }
      
      // Mark as initializing
      if (!this.initializingFiles) {
        this.initializingFiles = new Set()
      }
      this.initializingFiles.add(fileId)
      
      try {
        // Clear any existing sessions for this file to start fresh
        this.clearSessionsForFile(fileId)
        
        // First, create embeddings for the file
        const embeddingResponse = await api.createEmbeddings(fileId)

        this.isInitialized = true
        return {
          success: true,
          message: 'AI chat initialized successfully',
          fileId: fileId,
          chunks: embeddingResponse.chunks || 0
        }
      } finally {
        // Remove from initializing set
        this.initializingFiles.delete(fileId)
      }
    } catch (error) {
      console.error('Failed to initialize AI chat:', error)
      // Make sure to remove from initializing set on error
      if (this.initializingFiles) {
        this.initializingFiles.delete(fileId)
      }
      throw new Error(`Failed to initialize AI chat: ${error.message}`)
    }
  }

  // Send a message to AI chat
  async sendMessage(fileId, message, sessionId = null) {
    try {

      // Get conversation history if we have a session
      let conversationHistory = []
      if (sessionId && this.sessions.has(sessionId)) {
        conversationHistory = this.sessions.get(sessionId).messages || []
      }

      // Send message to backend
      const response = await api.post('/ai/chat-pdf', {
        fileId,
        message,
        sessionId,
        conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
      })

      // Update local session if we have one
      if (response.sessionId) {
        if (!this.sessions.has(response.sessionId)) {
          this.sessions.set(response.sessionId, {
            fileId,
            messages: [],
            createdAt: new Date().toISOString()
          })
        }

        const session = this.sessions.get(response.sessionId)
        session.messages.push(
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: response.response, timestamp: new Date().toISOString() }
        )
      }

      return {
        success: true,
        sessionId: response.sessionId,
        response: response.response,
        message: response.message
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Provide fallback response
      const fallbackResponse = this.generateFallbackResponse(message, fileId)
      return {
        success: false,
        response: fallbackResponse,
        error: error.message,
        fallback: true
      }
    }
  }

  // Generate a fallback response when AI is not available
  generateFallbackResponse(message, fileId) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to help you with your document. While AI features are currently unavailable, I can still assist you with basic questions about your file."
    } else if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return "I'd be happy to help summarize your document. However, AI summarization is currently unavailable. You can try using the OCR feature first to extract text, then manually review the content."
    } else if (lowerMessage.includes('what') || lowerMessage.includes('tell me')) {
      return "I understand you're asking about your document. While I can't analyze the content right now due to AI services being unavailable, you can use the OCR tool to extract text and review it manually."
    } else {
      return "I'm here to help with your document, but AI chat features are currently unavailable. Please try using the OCR tool to extract text from your document, or contact support if you need assistance."
    }
  }

  // Get chat sessions for a file
  async getChatSessions(fileId) {
    try {
      const response = await api.get(`/ai/chat-sessions/${fileId}`)
      return response.sessions || []
    } catch (error) {
      console.error('Failed to get chat sessions:', error)
      return []
    }
  }

  // Get messages for a session
  async getChatMessages(sessionId) {
    try {
      const response = await api.get(`/ai/chat-messages/${sessionId}`)
      return response.messages || []
    } catch (error) {
      console.error('Failed to get chat messages:', error)
      return []
    }
  }

  // Generate summary for a file
  async generateSummary(fileId, summaryType = 'auto') {
    try {

      const response = await api.post('/ai/summarize', {
        fileId,
        summaryType
      })

      return {
        success: true,
        summary: response.summary,
        cached: response.cached || false
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
      throw new Error(`Failed to generate summary: ${error.message}`)
    }
  }

  // Get AI recommendations for a file
  async getRecommendations(fileId) {
    try {
      const response = await api.get(`/ai/recommendations/${fileId}`)
      return response.recommendations || []
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      return []
    }
  }

  // Check if AI features are available
  async checkAIAvailability() {
    try {
      const response = await api.get('/ai/ping')
      return {
        available: true,
        message: response.message,
        timestamp: response.timestamp
      }
    } catch (error) {
      console.error('AI features not available:', error)
      return {
        available: false,
        error: error.message
      }
    }
  }

  // Clear session data
  clearSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId)
    }
  }

  // Clear all sessions
  clearAllSessions() {
    this.sessions.clear()
  }

  // Clear sessions for a specific file
  clearSessionsForFile(fileId) {
    const sessionsToDelete = []
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.fileId === fileId) {
        sessionsToDelete.push(sessionId)
      }
    }
    sessionsToDelete.forEach(sessionId => this.sessions.delete(sessionId))
  }

  // Get session info
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null
  }

  // Get all sessions
  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      ...session
    }))
  }
}

// Create and export a singleton instance
export const aiChatService = new AIChatService()
export default aiChatService