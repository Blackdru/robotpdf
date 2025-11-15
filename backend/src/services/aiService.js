const OpenAI = require('openai');
const { encoding_for_model } = require('tiktoken');

class AIService {
  constructor() {
    // Determine which API to use
    const useOpenRouter = process.env.OPENROUTER_API_KEY && 
                         process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here' &&
                         process.env.OPENROUTER_API_KEY !== 'sk-test-key-for-development' &&
                         (process.env.OPENROUTER_API_KEY.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-'));
    const useOpenAI = process.env.OPENAI_API_KEY && 
                     process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                     process.env.OPENAI_API_KEY !== 'sk-test-key-for-development' &&
                     process.env.OPENAI_API_KEY.startsWith('sk-');
    
    console.log('AI Service initialization:');
    console.log('- OpenRouter key available:', !!process.env.OPENROUTER_API_KEY);
    console.log('- OpenAI key available:', !!process.env.OPENAI_API_KEY);
    console.log('- Using OpenRouter:', useOpenRouter);
    console.log('- Using OpenAI:', useOpenAI);
    
    if (useOpenRouter) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'RobotPDF'
        }
      });
      // Use free models through OpenRouter - mistral-nemo is best for document processing
      this.model = process.env.AI_MODEL || 'mistralai/mistral-nemo:free';
      // Fallback models if primary fails
      this.fallbackModels = [
        'mistralai/mistral-nemo:free',
        'meta-llama/llama-4-maverick:free',
        'nousresearch/deephermes-3-llama-3-8b-preview:free',
        'google/gemma-3-4b-it:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'deepseek/deepseek-chat-v3.1:free'
      ];
      this.embeddingModel = 'text-embedding-3-small'; // OpenRouter doesn't support embeddings, we'll use a fallback
      this.isUsingOpenRouter = true;
      this.isUsingOpenAI = false;
      this.maxTokens = 8000; // Most free models support up to 8K tokens
      console.log('- Configured with OpenRouter model:', this.model);
    } else if (useOpenAI) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
      this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
      this.isUsingOpenRouter = false;
      this.isUsingOpenAI = true;
      this.maxTokens = 4000;
      console.log('- Configured with OpenAI model:', this.model);
    } else {
      console.log('- No valid AI service configured, using fallback mode');
      this.openai = null;
      this.model = null;
      this.embeddingModel = null;
      this.isUsingOpenRouter = false;
      this.isUsingOpenAI = false;
      this.maxTokens = 4000;
    }
  }

  // Check if AI features are enabled
  isEnabled() {
    return process.env.ENABLE_AI_FEATURES === 'true' && 
           this.openai !== null && 
           this.model !== null;
  }

  // Test the AI connection
  async testConnection() {
    if (!this.isEnabled()) {
      return { success: false, error: 'AI features are not enabled' };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with "AI connection successful" to test the connection.'
          }
        ],
        max_tokens: 50,
        temperature: 0.1,
      });

      return {
        success: true,
        model: this.model,
        provider: this.isUsingOpenRouter ? 'OpenRouter' : 'OpenAI',
        response: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('AI connection test failed:', error);
      return {
        success: false,
        error: error.message,
        model: this.model,
        provider: this.isUsingOpenRouter ? 'OpenRouter' : 'OpenAI'
      };
    }
  }

  // Get available free models for OpenRouter
  getAvailableFreeModels() {
    return [
      'mistralai/mistral-nemo:free',
      'meta-llama/llama-4-maverick:free',
      'nousresearch/deephermes-3-llama-3-8b-preview:free',
      'google/gemma-3-4b-it:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'deepseek/deepseek-chat-v3.1:free'
    ];
  }

  // Count tokens in text
  countTokens(text) {
    try {
      const encoding = encoding_for_model(this.model);
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch (error) {
      // Fallback: rough estimation
      return Math.ceil(text.length / 4);
    }
  }

  // Split text into chunks that fit within token limits
  chunkText(text, maxTokens = 1000, overlap = 100) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.countTokens(sentence);
      
      if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Add overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-overlap).join(' ');
        currentChunk = overlapWords + ' ' + sentence;
        currentTokens = this.countTokens(currentChunk);
      } else {
        currentChunk += ' ' + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Generate embeddings for text
  async generateEmbeddings(text) {
    if (!this.isEnabled()) {
      throw new Error('AI features are not enabled');
    }

    // If using OpenRouter, create simple hash-based embeddings as fallback
    if (this.isUsingOpenRouter) {
      console.log('Using fallback embeddings for OpenRouter');
      return this.generateFallbackEmbeddings(text);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      // Fallback to simple embeddings
      console.log('Falling back to simple embeddings due to error');
      return this.generateFallbackEmbeddings(text);
    }
  }

  // Generate simple fallback embeddings based on text features
  generateFallbackEmbeddings(text) {
    // Create a simple 384-dimensional embedding based on text features
    const embedding = new Array(384).fill(0);
    
    // Use text characteristics to create pseudo-embeddings
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase().split('');
    
    // Word-based features
    for (let i = 0; i < words.length && i < 100; i++) {
      const word = words[i];
      const hash = this.simpleHash(word) % 384;
      embedding[hash] += 1 / Math.sqrt(words.length);
    }
    
    // Character-based features
    for (let i = 0; i < chars.length && i < 200; i++) {
      const char = chars[i];
      const hash = (char.charCodeAt(0) * 7 + i * 3) % 384;
      embedding[hash] += 0.1 / Math.sqrt(chars.length);
    }
    
    // Text length features
    embedding[0] = Math.log(text.length + 1) / 10;
    embedding[1] = words.length / 1000;
    embedding[2] = (text.match(/[.!?]/g) || []).length / 100;
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  // Simple hash function for consistent pseudo-embeddings
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Summarize text
  async summarizeText(text, summaryType = 'auto') {
    if (!this.isEnabled() || process.env.ENABLE_SUMMARIZATION !== 'true') {
      throw new Error('Summarization is not enabled');
    }

    const tokenCount = this.countTokens(text);
    
    // If text is too long, chunk it and summarize each chunk
    if (tokenCount > this.maxTokens) {
      const chunks = this.chunkText(text, this.maxTokens - 500); // Leave room for prompt
      const chunkSummaries = [];

      for (const chunk of chunks) {
        const summary = await this.summarizeChunk(chunk, summaryType);
        chunkSummaries.push(summary);
      }

      // Combine chunk summaries into final summary
      const combinedSummary = chunkSummaries.join('\n\n');
      return this.summarizeChunk(combinedSummary, summaryType);
    }

    return this.summarizeChunk(text, summaryType);
  }

  // Summarize a single chunk of text
  async summarizeChunk(text, summaryType = 'auto') {
    const prompts = {
      brief: 'Provide a brief 2-3 sentence summary of the following text:',
      detailed: 'Provide a detailed summary with key points and important details from the following text:',
      auto: 'Provide a concise but comprehensive summary of the following text, highlighting the main points and key information:'
    };

    const prompt = prompts[summaryType] || prompts.auto;

    try {
      // ALWAYS use FREE model for summaries to save costs
      let summaryModel;
      
      if (this.isUsingOpenRouter) {
        // Use FREE Llama 3.3 70B model from OpenRouter (no cost)
        summaryModel = 'meta-llama/llama-3.3-70b-instruct:free';
        console.log('AI Summary: Using FREE Llama 3.3 70B via OpenRouter');
      } else if (this.isUsingOpenAI) {
        // Fallback to OpenAI only if OpenRouter is not configured
        summaryModel = this.model;
        console.log('AI Summary: OpenRouter not available, falling back to OpenAI model:', summaryModel);
      } else {
        throw new Error('No AI service available for summarization');
      }
      
      const response = await this.openai.chat.completions.create({
        model: summaryModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates clear, accurate summaries of documents. Focus on the most important information and maintain the original context. Write in plain text without markdown formatting.'
          },
          {
            role: 'user',
            content: `${prompt}\n\n${text}`
          }
        ],
        max_tokens: summaryType === 'brief' ? 150 : summaryType === 'detailed' ? 500 : 300,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw new Error('Failed to generate summary');
    }
  }

  // Chat with PDF content using RAG
  async chatWithPDF(query, relevantChunks, conversationHistory = []) {
    if (!this.isEnabled() || process.env.ENABLE_CHAT_PDF !== 'true') {
      throw new Error('PDF chat is not enabled');
    }

    const context = relevantChunks.map(chunk => chunk.chunk_text).join('\n\n');
    
    const systemPrompt = `You are a helpful AI assistant that answers questions about PDF documents. 
Use the provided context from the PDF to answer questions accurately. 
If the answer is not in the context, say so clearly.
Be concise but thorough in your responses.
IMPORTANT: Format your response in plain text without using markdown syntax like ** or ##. Write naturally without any formatting markers.

Context from PDF:
${context}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: query }
    ];

    try {
      // Use GPT-4o-mini via OpenRouter for high-quality chat responses
      let chatModel;
      if (this.isUsingOpenRouter) {
        // Use GPT-4o-mini through OpenRouter
        chatModel = 'openai/gpt-4o-mini';
        console.log('AI Chat: Using GPT-4o-mini via OpenRouter');
      } else if (this.isUsingOpenAI) {
        chatModel = 'gpt-4o-mini';
        console.log('AI Chat: Using GPT-4o-mini via OpenAI');
      } else {
        chatModel = this.model;
        console.log('AI Chat: Using default model:', chatModel);
      }
      
      const response = await this.openai.chat.completions.create({
        model: chatModel,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      let responseText = response.choices[0].message.content.trim();
      
      // Clean up any markdown formatting that might appear
      responseText = responseText
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold** markers
        .replace(/__(.*?)__/g, '$1')      // Remove __bold__ markers
        .replace(/\*(.*?)\*/g, '$1')      // Remove *italic* markers
        .replace(/_(.*?)_/g, '$1')        // Remove _italic_ markers
        .replace(/#{1,6}\s+/g, '')        // Remove # heading markers
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1'); // Remove code markers
      
      return responseText;
    } catch (error) {
      console.error('Error in PDF chat:', error);
      throw new Error('Failed to generate response');
    }
  }

  // Generate smart recommendations
  async generateRecommendations(fileInfo, userHistory = []) {
    if (!this.isEnabled()) {
      return [];
    }

    const { filename, type, size, hasOcr, hasSummary, hasEmbeddings } = fileInfo;
    const recommendations = [];

    try {
      // Rule-based recommendations
      if (type === 'application/pdf' && !hasOcr) {
        recommendations.push({
          action: 'ocr',
          title: 'Extract Text',
          description: 'Make your PDF searchable by extracting text with OCR',
          priority: 'medium'
        });
      }

      if (hasOcr && !hasSummary) {
        recommendations.push({
          action: 'summarize',
          title: 'Generate Summary',
          description: 'Get a quick overview of your document with AI summarization',
          priority: 'high'
        });
      }

      if (hasOcr && !hasEmbeddings) {
        recommendations.push({
          action: 'enable_chat',
          title: 'Enable PDF Chat',
          description: 'Chat with your PDF and ask questions about its content',
          priority: 'high'
        });
      }

      if (size > 10 * 1024 * 1024) { // > 10MB
        recommendations.push({
          action: 'compress',
          title: 'Compress PDF',
          description: 'Reduce file size to save storage space',
          priority: 'medium'
        });
      }

      // AI-powered recommendations based on filename and user history
      if (this.isEnabled() && userHistory.length > 0) {
        const aiRecommendations = await this.generateAIRecommendations(fileInfo, userHistory);
        recommendations.push(...aiRecommendations);
      }

      return recommendations.slice(0, 5); // Limit to top 5 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return recommendations; // Return rule-based recommendations even if AI fails
    }
  }

  // Generate AI-powered recommendations
  async generateAIRecommendations(fileInfo, userHistory) {
    const prompt = `Based on the file information and user history, suggest 1-2 relevant actions:
    
    File: ${fileInfo.filename}
    Type: ${fileInfo.type}
    Size: ${Math.round(fileInfo.size / 1024 / 1024)}MB
    
    Recent user actions: ${userHistory.slice(-5).map(h => h.action).join(', ')}
    
    Suggest actions from: merge, split, compress, convert, ocr, summarize, organize
    
    Respond with JSON array: [{"action": "action_name", "title": "Title", "description": "Description", "priority": "high|medium|low"}]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.5,
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return [];
    }
  }

  // Similarity search in embeddings
  async findSimilarContent(queryEmbedding, userEmbeddings, threshold = 0.7) {
    const similarities = userEmbeddings.map(embedding => {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding.vector);
      return { ...embedding, similarity };
    });

    return similarities
      .filter(item => item.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Enhance extracted text using AI - works for all document types
  async enhanceTextWithAI(rawText) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not available');
    }

    try {
      console.log('Enhancing text with AI, original length:', rawText.length);
      
      // Detect document type for better enhancement
      const documentType = this.detectDocumentType(rawText);
      console.log('Detected document type:', documentType);
      
      // Create a comprehensive prompt for all document types
      const prompt = `You are an expert at cleaning up OCR-extracted text from various types of documents including government documents, business documents, academic papers, invoices, contracts, and general text documents.

Please clean and enhance the following OCR-extracted text by:
1. Fixing obvious OCR errors and misread characters (like "rn" → "m", "cl" → "d", "0" → "O")
2. Correcting spacing and formatting issues
3. Removing unwanted symbols, artifacts, and garbled text
4. Standardizing common document terms and formatting
5. Preserving all original information, numbers, dates, and names exactly
6. Maintaining proper document structure and formatting
7. Converting garbled or corrupted text to readable format
8. Fixing common OCR mistakes in names, addresses, and technical terms
9. Preserving line breaks and paragraph structure where appropriate
10. Removing duplicate characters or words that are OCR artifacts

Document type detected: ${documentType}

${this.getDocumentSpecificInstructions(documentType)}

Original OCR text:
${rawText}

Please provide only the cleaned and enhanced text without any explanations or comments:`;

      // ALWAYS use FREE model for OCR enhancement to save costs
      const freeModel = this.isUsingOpenRouter 
        ? 'meta-llama/llama-3.3-70b-instruct:free' // FREE 70B model
        : this.model;
      
      console.log(`Using FREE AI model for OCR enhancement: ${freeModel}`);
      
      try {
        const response = await this.openai.chat.completions.create({
          model: freeModel,
            messages: [
              {
                role: 'system',
                content: 'You are a professional OCR text enhancement expert. Clean up OCR-extracted text while preserving all original information exactly. Focus on fixing OCR errors, improving readability, and maintaining document structure. Return only the enhanced text without any explanations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: Math.min(2000, Math.ceil(rawText.length * 1.5)),
            temperature: 0.1, // Very low temperature for consistent corrections
          });

          const enhancedText = response.choices[0].message.content.trim();
          console.log('AI enhancement completed with model:', model, 'new length:', enhancedText.length);
          
          // Validate that the enhanced text is reasonable
          if (enhancedText.length > rawText.length * 3) {
            console.warn('AI enhancement produced text that is too long, using original');
            return rawText;
          }

          if (enhancedText.length < rawText.length * 0.3) {
            console.warn('AI enhancement produced text that is too short, using original');
            return rawText;
          }

          // Additional validation for important document information
          if (this.containsImportantDocumentInfo(rawText) && !this.containsImportantDocumentInfo(enhancedText)) {
            console.warn('AI enhancement removed important document information, using original');
            return rawText;
          }

          return enhancedText;
      } catch (error) {
        console.error('AI enhancement failed:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error enhancing text with AI:', error);
      throw error;
    }
  }

  // Detect document type for better enhancement
  detectDocumentType(text) {
    const textLower = text.toLowerCase();
    
    // Government/ID documents
    if (/pan|aadhaar|passport|license|certificate|govt|government|income tax|birth certificate|marriage certificate/i.test(text)) {
      return 'government_id';
    }
    
    // Business documents
    if (/invoice|receipt|bill|purchase|order|quotation|estimate|contract|agreement/i.test(text)) {
      return 'business';
    }
    
    // Academic documents
    if (/university|college|degree|transcript|certificate|academic|student|course|grade|gpa/i.test(text)) {
      return 'academic';
    }
    
    // Medical documents
    if (/patient|doctor|medical|hospital|prescription|diagnosis|treatment|health|clinic/i.test(text)) {
      return 'medical';
    }
    
    // Legal documents
    if (/court|legal|law|attorney|lawyer|case|judgment|petition|affidavit|notary/i.test(text)) {
      return 'legal';
    }
    
    // Financial documents
    if (/bank|account|statement|balance|transaction|credit|debit|loan|mortgage|insurance/i.test(text)) {
      return 'financial';
    }
    
    return 'general';
  }

  // Get document-specific enhancement instructions
  getDocumentSpecificInstructions(documentType) {
    const instructions = {
      government_id: `
Special focus for government/ID documents:
- Fix common ID document terms (e.g., "Date of Birth", "Father's Name", "Address")
- Preserve ID numbers, dates, and official codes exactly
- Clean up government agency names and official terminology
- Fix address formatting and postal codes`,
      
      business: `
Special focus for business documents:
- Fix company names, addresses, and contact information
- Preserve monetary amounts, invoice numbers, and dates exactly
- Clean up product descriptions and quantities
- Fix tax information and business terms`,
      
      academic: `
Special focus for academic documents:
- Fix institution names and academic terminology
- Preserve grades, GPAs, and course codes exactly
- Clean up degree titles and academic credentials
- Fix dates and academic year information`,
      
      medical: `
Special focus for medical documents:
- Fix medical terminology and drug names
- Preserve patient information and medical codes exactly
- Clean up doctor names and medical facility information
- Fix dosage information and medical instructions`,
      
      legal: `
Special focus for legal documents:
- Fix legal terminology and case references
- Preserve court names, case numbers, and legal codes exactly
- Clean up party names and legal addresses
- Fix dates and legal document formatting`,
      
      financial: `
Special focus for financial documents:
- Fix bank names and financial terminology
- Preserve account numbers, amounts, and transaction details exactly
- Clean up financial institution information
- Fix dates and financial codes`,
      
      general: `
Special focus for general documents:
- Fix common words and phrases
- Preserve names, dates, and numbers exactly
- Clean up formatting and structure
- Fix punctuation and spacing issues`
    };
    
    return instructions[documentType] || instructions.general;
  }

  // Helper method to check if text contains important document information
  containsImportantDocumentInfo(text) {
    const importantPatterns = [
      // ID patterns
      /[A-Z]{5}[0-9]{4}[A-Z]/,  // PAN number pattern
      /\d{4}\s?\d{4}\s?\d{4}/,   // Aadhaar/SSN number pattern
      
      // Date patterns
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,  // Various date formats
      
      // Common document terms
      /name|address|date|number|amount|total|signature|phone|email/i,
      
      // Numbers and codes
      /\b\d{3,}\b/,  // Any number with 3+ digits
      
      // Currency
      /[\$€£¥₹]\s?\d+|\d+\s?[\$€£¥₹]/,  // Currency amounts
    ];

    return importantPatterns.some(pattern => pattern.test(text));
  }

  // Translate extracted text
  async translateText(text, targetLanguage) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not available for translation');
    }

    try {
      console.log('Translating text to:', targetLanguage, 'Length:', text.length);
      
      const prompt = `Translate the following text to ${targetLanguage}. Please:

1. Translate accurately while preserving the document structure
2. Keep all numbers, dates, and official codes exactly as they are
3. Translate only the descriptive text and labels
4. Maintain proper formatting and line breaks
5. Preserve any official terminology appropriately

Text to translate:
${text}

Provide only the translation without any explanations:`;

      // Try with primary model first, then fallback models
      const modelsToTry = this.isUsingOpenRouter && this.fallbackModels 
        ? [this.model, ...this.fallbackModels] 
        : [this.model];
      
      let lastError;
      for (const model of modelsToTry) {
        try {
          console.log(`Attempting translation with model: ${model}`);
          
          const response = await this.openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'system',
                content: `You are a professional translator. Translate text accurately to ${targetLanguage} while preserving all numbers, codes, and official formatting. Provide only the translation without explanations.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: Math.min(2000, Math.ceil(text.length * 2)),
            temperature: 0.2,
          });

          const translatedText = response.choices[0].message.content.trim();
          console.log('Translation completed with model:', model, 'new length:', translatedText.length);
          
          return translatedText;
        } catch (modelError) {
          console.error(`Translation failed with model ${model}:`, modelError.message);
          lastError = modelError;
          continue;
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('Error translating text:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }
}

module.exports = new AIService();