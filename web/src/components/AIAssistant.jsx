import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { aiChatService } from '../lib/aiChatService'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import toast from 'react-hot-toast'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  FileText,
  Brain,
  Zap,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'

const AIAssistant = ({ fileId, fileName, onClose, isMinimized, onToggleMinimize }) => {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [aiAvailable, setAiAvailable] = useState(true)
  const messagesEndRef = useRef(null)

  // Check if user has access to AI features
  const hasAIAccess = subscription?.plan !== 'free' && subscription?.plan !== null

  useEffect(() => {
    if (fileId && hasAIAccess) {
      // Clear previous messages when fileId changes
      setMessages([])
      setSessionId(null)
      setIsInitialized(false)
      
      // Don't auto-initialize, wait for explicit initialization
      // This prevents race conditions with the main component
      const fileType = fileName.toLowerCase().match(/\.(pdf|jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/)?.[1] || 'document';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'].includes(fileType);
      const documentType = isImage ? 'image' : fileType === 'pdf' ? 'PDF document' : 'document';
      
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm ready to help you with your ${documentType} "${fileName}". I can extract text from ${isImage ? 'images' : 'PDFs'} and answer questions about the content. What would you like to know?`,
        timestamp: new Date().toISOString()
      }])
      setIsInitialized(true)
    }
  }, [fileId, hasAIAccess, fileName])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeChat = async () => {
    try {
      setIsLoading(true)
      
      // Check AI availability first
      const availability = await aiChatService.checkAIAvailability()
      setAiAvailable(availability.available)
      
      if (!availability.available) {
        setMessages([{
          role: 'assistant',
          content: 'AI features are currently unavailable, but I can still help you with basic questions about your document.',
          timestamp: new Date().toISOString(),
          fallback: true
        }])
        setIsInitialized(true)
        return
      }

      // Initialize AI chat
      const result = await aiChatService.initializeChat(fileId)
      
      if (result.success) {
        setIsInitialized(true)
        const fileType = fileName.toLowerCase().match(/\.(pdf|jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/)?.[1] || 'document';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'].includes(fileType);
        const documentType = isImage ? 'image' : fileType === 'pdf' ? 'PDF document' : 'document';
        
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm ready to help you with your ${documentType} "${fileName}". I've processed ${result.chunks || 0} text chunks from your ${isImage ? 'image' : 'document'}. What would you like to know?`,
          timestamp: new Date().toISOString()
        }])
        toast.success('AI chat initialized successfully!')
      }
    } catch (error) {
      console.error('Failed to initialize AI chat:', error)
      setAiAvailable(false)
      const fileType = fileName.toLowerCase().match(/\.(pdf|jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/)?.[1] || 'document';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'].includes(fileType);
      const documentType = isImage ? 'image' : fileType === 'pdf' ? 'PDF document' : 'document';
      
      setMessages([{
        role: 'assistant',
        content: `I encountered an issue initializing AI chat, but I can still help you with basic questions about your ${documentType}.`,
        timestamp: new Date().toISOString(),
        fallback: true
      }])
      setIsInitialized(true)
      toast.error('AI chat initialization failed, using fallback mode')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const result = await aiChatService.sendMessage(fileId, userMessage.content, sessionId)
      
      if (result.sessionId && !sessionId) {
        setSessionId(result.sessionId)
      }

      const assistantMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        fallback: result.fallback || false
      }

      setMessages(prev => [...prev, assistantMessage])

      if (result.fallback) {
        toast.error('AI response failed, using fallback')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again or contact support if the issue persists.',
        timestamp: new Date().toISOString(),
        error: true
      }

      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!hasAIAccess) {
    return (
      <Card className="bg-surface border-border p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            AI Chat - Premium Feature
          </h3>
          <p className="text-muted-foreground mb-4">
            Upgrade to Pro or Premium to chat with your documents and images using AI.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </Card>
    )
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-4 right-3 sm:right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg"
        >
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="bg-card border-border flex flex-col h-[75vh] w-full sm:h-[75vh] sm:max-w-2xl lg:max-w-4xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 pr-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-card-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {aiAvailable ? (
            <Badge variant="outline" className="border-green-600 text-green-400 text-xs hidden sm:flex">
              <Zap className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="border-yellow-600 text-yellow-400 text-xs hidden sm:flex">
              <AlertCircle className="h-3 w-3 mr-1" />
              Fallback
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMinimize}
            className="text-muted-foreground hover:text-card-foreground h-9 w-9 hidden sm:flex"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground hover:bg-destructive/10 h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 max-h-full">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground">Initializing AI chat...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.error
                      ? 'bg-red-900 text-red-200 border border-red-800'
                      : message.fallback
                      ? 'bg-yellow-900 text-yellow-200 border border-yellow-800'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mt-1">
                        {message.error ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : message.fallback ? (
                          <Brain className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1.5">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-card-foreground px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-card shrink-0">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your document..."
            disabled={isLoading || !isInitialized}
            className="flex-1 bg-gray-700 border-border text-card-foreground placeholder-gray-400 text-sm h-11 sm:h-11"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim() || !isInitialized}
            className="bg-blue-600 hover:bg-blue-700 text-white h-11 w-11 sm:h-11 sm:w-11 p-0 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-secondary">
          <span className="hidden sm:inline">Press Enter to send</span>
          <span className="sm:hidden">Tap to send</span>
          {sessionId && (
            <span className="flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Session active</span>
              <span className="sm:hidden">Active</span>
            </span>
          )}
        </div>
      </div>
      </Card>
    </div>
  )
}

export default AIAssistant