const OpenAI = require('openai');

/**
 * Direct AI Service - Send files directly to AI models without OCR
 * Supports vision models for images and documents
 */
class DirectAIService {
  constructor() {
    // Check if we should use OpenRouter for vision
    const useOpenRouter = process.env.USE_OPENROUTER_FOR_VISION === 'true' && 
                         process.env.OPENROUTER_API_KEY &&
                         process.env.OPENROUTER_API_KEY.startsWith('sk-or-');
    
    const useOpenAI = !useOpenRouter && 
                     process.env.OPENAI_API_KEY && 
                     process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                     process.env.OPENAI_API_KEY.startsWith('sk-');
    
    if (useOpenRouter) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'RobotPDF'
        }
      });
      this.visionModel = process.env.VISION_MODEL || 'openai/gpt-4o-mini';
      this.enabled = true;
      this.provider = 'OpenRouter';
    } else if (useOpenAI) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.visionModel = 'gpt-4o';
      this.enabled = true;
      this.provider = 'OpenAI';
    } else {
      this.openai = null;
      this.visionModel = null;
      this.enabled = false;
      this.provider = null;
    }
    
    console.log('Direct AI Service initialized:', {
      enabled: this.enabled,
      provider: this.provider,
      model: this.visionModel
    });
  }

  isEnabled() {
    return this.enabled && this.openai !== null;
  }

  /**
   * Analyze image/document directly with AI vision model
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - File MIME type
   * @param {string} prompt - Custom prompt or 'extract', 'summarize', 'chat'
   * @param {string} userMessage - Optional user message for chat
   */
  async analyzeWithVision(fileBuffer, mimeType, prompt = 'extract', userMessage = null) {
    if (!this.isEnabled()) {
      throw new Error('Direct AI service is not available');
    }

    try {
      // Convert buffer to base64
      const base64Image = fileBuffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      // Prepare system prompt based on action
      let systemPrompt = '';
      let userPrompt = userMessage || '';

      switch (prompt) {
        case 'extract':
          systemPrompt = 'You are an expert at extracting text from images and documents. Extract all visible text accurately, maintaining structure and formatting.';
          userPrompt = userPrompt || 'Extract all text from this image/document. Preserve formatting, structure, and layout as much as possible.';
          break;

        case 'summarize':
          systemPrompt = 'You are an expert at analyzing and summarizing documents. Provide clear, concise summaries.';
          userPrompt = userPrompt || 'Analyze this document and provide a comprehensive summary including key points, main topics, and important information.';
          break;

        case 'chat':
          systemPrompt = 'You are a helpful assistant that can analyze images and documents to answer questions accurately.';
          userPrompt = userMessage || 'What can you tell me about this document?';
          break;

        default:
          systemPrompt = 'You are a helpful AI assistant that can analyze images and documents.';
          userPrompt = prompt;
      }

      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high' // Use 'high' for detailed analysis
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      return {
        success: true,
        text: response.choices[0].message.content.trim(),
        model: this.visionModel,
        method: 'direct_vision'
      };

    } catch (error) {
      console.error('Direct AI vision analysis error:', error);
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Chat with document using vision model
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - File MIME type
   * @param {string} message - User message/question
   * @param {Array} conversationHistory - Previous messages
   */
  async chatWithDocument(fileBuffer, mimeType, message, conversationHistory = []) {
    if (!this.isEnabled()) {
      throw new Error('Direct AI service is not available');
    }

    try {
      const base64Image = fileBuffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      // Build messages array with history
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant that can analyze documents and images to answer questions. Provide accurate, detailed answers based on what you see in the document.'
        }
      ];

      // Add conversation history (limit to last 10 messages)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);

      // Add current message with image
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high'
            }
          }
        ]
      });

      const response = await this.openai.chat.completions.create({
        model: this.visionModel,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return {
        success: true,
        response: response.choices[0].message.content.trim(),
        model: this.visionModel
      };

    } catch (error) {
      console.error('Document chat error:', error);
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  /**
   * Generate smart summary using vision model
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - File MIME type
   * @param {Object} options - Summary options
   */
  async generateSmartSummary(fileBuffer, mimeType, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('Direct AI service is not available');
    }

    const {
      includeKeyPoints = true,
      includeSentiment = false,
      includeEntities = false
    } = options;

    try {
      const base64Image = fileBuffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      let prompt = 'Analyze this document and provide:\n';
      prompt += '1. A comprehensive summary of the content\n';
      
      if (includeKeyPoints) {
        prompt += '2. 5-7 key points or main takeaways\n';
      }
      
      if (includeSentiment) {
        prompt += '3. Overall sentiment analysis (positive, neutral, negative percentages)\n';
      }
      
      if (includeEntities) {
        prompt += '4. Important entities (names, organizations, locations, dates)\n';
      }

      prompt += '\nFormat your response as JSON with keys: summary, keyPoints, sentiment, entities';

      const response = await this.openai.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyzer. Provide comprehensive analysis in JSON format.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content.trim();
      
      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            summary: result.summary || content,
            keyPoints: result.keyPoints || [],
            sentiment: result.sentiment || null,
            entities: result.entities || [],
            model: this.visionModel,
            method: 'direct_vision'
          };
        }
      } catch (parseError) {
        console.warn('Could not parse JSON response, using text format');
      }

      // Fallback to text parsing
      return {
        success: true,
        summary: content,
        keyPoints: [],
        sentiment: null,
        entities: [],
        model: this.visionModel,
        method: 'direct_vision'
      };

    } catch (error) {
      console.error('Smart summary error:', error);
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }

  /**
   * Check if file type is supported for direct vision analysis
   * @param {string} mimeType - File MIME type
   */
  isSupportedFileType(mimeType) {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf' // Some vision models support PDF
    ];

    return supportedTypes.includes(mimeType);
  }
}

module.exports = new DirectAIService();
