const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { 
  requireProPlan, 
  requireFeature,
  enforceAILimit, 
  trackUsage 
} = require('../middleware/subscriptionMiddleware');
const aiService = require('../services/aiService');
const ocrService = require('../services/ocrService');
const directAIService = require('../services/directAIService');
const { planLimits } = require('../../../shared/planLimits');

const router = express.Router();

// OCR - Extract text from PDF/Image
router.post('/ocr', 
  authenticateUser, 
  requireFeature('ocr_processing'),
  enforceAILimit,
  trackUsage('ai_operation', 1, (req, data) => ({ 
    action: 'ocr', 
    file_id: req.body.fileId 
  })),
  async (req, res) => {
  try {
    console.log('=== OCR ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);
    
    const { 
      fileId, 
      language = 'auto', 
      enhanceImage = true, 
      aiEnhanced = true, // DEFAULT TO TRUE for 99% accuracy
      extractOriginal = false,
      confidenceThreshold = 0.6 
    } = req.body;
    
    console.log('OCR Settings:', { language, enhanceImage, aiEnhanced, extractOriginal });

    if (!fileId) {
      console.log('ERROR: No fileId provided');
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    console.log('Step 1: Processing OCR for fileId:', fileId);

    // Check user's plan and OCR limits
    try {
      console.log('Step 2: Checking user plan and limits...');
      const { PLAN_LIMITS } = require('../../../shared/planLimits');
      
      // Get user's subscription info from subscriptions table
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('plan')
        .eq('user_id', req.user.id)
        .eq('status', 'active')
        .single();
      
      const userPlan = subscription?.plan || 'free';
      console.log('User plan:', userPlan);
      
      const planLimits = PLAN_LIMITS[userPlan];
      console.log('Plan limits:', planLimits);
      
    } catch (planError) {
      console.error('Error checking plan limits:', planError);
      // Continue with free plan as default
    }

    // Get file metadata from Supabase
    try {
      console.log('Step 3: Getting file metadata from Supabase...');
      console.log('Looking for file ID:', fileId);
      console.log('For user ID:', req.user.id);
      
      // First, let's check if the file exists at all (without user filter)
      const { data: allFiles, error: allFilesError } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId);
      
      console.log('Files with this ID (any user):', allFiles);
      console.log('All files error:', allFilesError);
      
      // Now check with user filter
      const { data: file, error: fileError } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', req.user.id)
        .single();

      console.log('File with user filter:', file);
      console.log('File error with user filter:', fileError);

      if (fileError || !file) {
        console.log('File not found error:', fileError);
        
        // Let's also check what files this user has
        const { data: userFiles } = await supabaseAdmin
          .from('files')
          .select('id, filename, user_id, created_at')
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log('Recent files for this user:', userFiles);
        
        return res.status(404).json({ error: 'File not found' });
      }
      
      console.log('File found:', file.filename, 'Type:', file.type);

      // For OCR endpoint: ALWAYS use OCR with AI enhancement for text extraction
      // Direct AI Vision is only used in chat endpoint, not for OCR
      console.log('Step 4: Using OCR with AI enhancement for text extraction...');

      // Fallback to traditional OCR
      console.log('Step 4: Checking OCR service availability...');
      if (!ocrService.isEnabled()) {
        console.log('OCR service is disabled');
        return res.status(503).json({ 
          error: 'OCR service is currently unavailable. Please try again later.',
          serviceUnavailable: true
        });
      }
      
      console.log('OCR service is enabled');

      // Download file from Supabase storage
      console.log('Step 5: Downloading file from storage...');
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        return res.status(500).json({ error: 'Failed to download file for OCR processing' });
      }

      // Convert file buffer for OCR processing
      const buffer = Buffer.from(await fileBuffer.arrayBuffer());

      // Process with Enhanced AI OCR
      console.log('Step 6: Processing file with Enhanced AI OCR...');
      console.log('File type:', file.type);
      console.log('AI Enhanced:', aiEnhanced);
      console.log('Extract Original:', extractOriginal);
      
      // Determine if this is a PDF or image file
      const isPDF = file.type === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
      const isImageFile = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.filename);
      
      console.log('File type detection:', { isPDF, isImage: isImageFile, mimeType: file.type, filename: file.filename });
      
      // Use the new AI-enhanced OCR method
      const ocrResult = await ocrService.extractTextWithAI(buffer, {
        enhanceWithAI: aiEnhanced,
        extractOriginal: extractOriginal,
        language: language,
        fileType: isPDF ? 'pdf' : (isImageFile ? 'image' : 'unknown'),
        confidenceThreshold: confidenceThreshold
      });
      
      console.log(`Final OCR result: language=${ocrResult.detectedLanguage}, confidence=${ocrResult.confidence}, textLength=${ocrResult.text.length}`);
      console.log('AI Enhanced:', ocrResult.aiEnhanced);
      console.log('OCR text preview:', ocrResult.text.substring(0, 200));
      
      if (ocrResult.enhancedText && ocrResult.enhancedText !== ocrResult.originalText) {
        console.log('Enhanced text preview:', ocrResult.enhancedText.substring(0, 200));
      }

      // Update file record with OCR results
      console.log('Step 7: Updating file record with OCR results...');
      const { error: updateError } = await supabaseAdmin
        .from('files')
        .update({
          extracted_text: ocrResult.text,
          has_ocr: true,
          metadata: {
            ...file.metadata,
            ocr: {
              language: ocrResult.detectedLanguage || language,
              confidence: ocrResult.confidence,
              processedAt: new Date().toISOString(),
              enhanceImage: enhanceImage
            }
          }
        })
        .eq('id', fileId);

      if (updateError) {
        console.error('Error updating file with OCR results:', updateError);
        // Don't fail the request, just log the error
      }

      // Return OCR results
      res.json({
        message: 'OCR processing completed successfully',
        result: ocrResult,
        fileInfo: {
          filename: file.filename,
          type: file.type,
          size: file.size
        }
      });

    } catch (fileError) {
      console.error('Error getting file:', fileError);
      return res.status(500).json({ error: 'Failed to retrieve file: ' + fileError.message });
    }

  } catch (error) {
    console.error('OCR endpoint error:', error);
    res.status(500).json({ error: error.message || 'OCR processing failed' });
  }
});

// Create embeddings for AI chat
router.post('/create-embeddings', 
  authenticateUser, 
  requireFeature('ai_features'),
  async (req, res) => {
  try {
    console.log('=== CREATE EMBEDDINGS ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);
    
    const { fileId } = req.body;

    if (!fileId) {
      console.log('ERROR: No fileId provided');
      return res.status(400).json({ error: 'File ID is required' });
    }

    console.log('Step 1: Getting file metadata for fileId:', fileId);

    // Get file metadata
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      console.log('File not found error:', fileError);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('File found:', file.filename, 'Has OCR:', file.has_ocr);

    // For images with direct AI, skip embeddings - they don't need it
    const isImage = file.type.startsWith('image/');
    const useDirectAI = process.env.USE_DIRECT_AI_FOR_IMAGES === 'true';
    
    if (isImage && useDirectAI && directAIService.isEnabled()) {
      console.log('Image uses direct AI - skipping embeddings');
      return res.json({
        message: 'Image ready for direct AI chat (no embeddings needed)',
        fileId: fileId,
        status: 'ready',
        method: 'direct_vision'
      });
    }

    if (!aiService.isEnabled()) {
      console.log('AI service is not enabled');
      return res.status(503).json({ error: 'AI features are not enabled' });
    }

    console.log('Step 2: Checking extracted text availability');

    // Use extracted text if available
    let text = file.extracted_text;
    if (!text || text.trim().length === 0) {
      console.log('No extracted text found, text length:', text ? text.length : 0);
      return res.status(400).json({ 
        error: 'No text content found. Please run OCR on this file first to extract text.',
        needsOCR: true
      });
    }

    console.log('Step 3: Text found, length:', text.length, 'characters');
    console.log('Text preview:', text.substring(0, 200) + '...');

    // Generate embeddings for the text
    console.log('Step 4: Chunking text for embeddings');
    const chunks = aiService.chunkText(text, 1000, 100);
    console.log('Created', chunks.length, 'chunks');
    
    const embeddings = [];

    console.log('Step 5: Generating embeddings for each chunk');
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      try {
        const embedding = await aiService.generateEmbeddings(chunks[i]);
        embeddings.push({
          chunk_index: i,
          chunk_text: chunks[i],
          embedding: embedding
        });
        console.log(`Chunk ${i + 1} processed successfully, embedding length:`, embedding.length);
      } catch (embeddingError) {
        console.error(`Error generating embedding for chunk ${i}:`, embeddingError);
        // Continue with other chunks
      }
    }

    console.log('Step 6: Generated embeddings for', embeddings.length, 'chunks');

    // Store embeddings in database
    console.log('Step 7: Updating file record with embeddings metadata');
    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({
        has_embeddings: true,
        metadata: {
          ...file.metadata,
          embeddings: {
            chunks: embeddings.length,
            createdAt: new Date().toISOString(),
            provider: aiService.isUsingOpenRouter ? 'OpenRouter' : 'OpenAI',
            model: aiService.model
          }
        }
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('Error updating file with embeddings:', updateError);
    } else {
      console.log('File updated successfully with embeddings metadata');
    }

    // Store embeddings in a separate table for better performance (optional)
    try {
      console.log('Step 8: Storing embeddings in database');
      const embeddingRecords = embeddings.map(emb => ({
        file_id: fileId,
        user_id: req.user.id,
        chunk_index: emb.chunk_index,
        chunk_text: emb.chunk_text,
        embedding: emb.embedding,
        created_at: new Date().toISOString()
      }));

      // Try to insert into embeddings table if it exists
      const { error: embeddingInsertError } = await supabaseAdmin
        .from('embeddings')
        .upsert(embeddingRecords, { 
          onConflict: 'file_id,chunk_index',
          ignoreDuplicates: false 
        });

      if (embeddingInsertError) {
        console.log('Embeddings table not available or error inserting:', embeddingInsertError.message);
        // This is not critical, embeddings metadata is stored in files table
      } else {
        console.log('Embeddings stored in dedicated table successfully');
      }
    } catch (embeddingTableError) {
      console.log('Embeddings table operation failed:', embeddingTableError.message);
      // Not critical, continue
    }

    console.log('Step 9: Embeddings creation completed successfully');

    res.json({
      message: 'Embeddings created successfully',
      fileId: fileId,
      status: 'ready',
      chunks: embeddings.length,
      provider: aiService.isUsingOpenRouter ? 'OpenRouter (Fallback)' : 'OpenAI',
      model: aiService.model
    });

  } catch (error) {
    console.error('Create embeddings error:', error);
    res.status(500).json({ error: error.message || 'Failed to create embeddings' });
  }
});

// AI Chat endpoint
router.post('/chat', 
  authenticateUser, 
  requireFeature('pdf_chat'),
  async (req, res) => {
  try {
    const { fileId, message, conversationHistory = [] } = req.body;

    if (!fileId || !message) {
      return res.status(400).json({ error: 'File ID and message are required' });
    }

    // Get file metadata
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!aiService.isEnabled()) {
      return res.status(503).json({ error: 'AI features are not enabled' });
    }

    if (!file.extracted_text) {
      return res.status(400).json({ error: 'Please run OCR on this file first to extract text' });
    }

    // For simplicity, use the full text as context (in production, you'd use embeddings for better retrieval)
    const relevantChunks = [{ chunk_text: file.extracted_text }];
    
    const response = await aiService.chatWithPDF(message, relevantChunks, conversationHistory);

    res.json({
      response: response,
      confidence: 0.85,
      fileId: fileId
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'AI chat failed' });
  }
});

// Smart summary endpoint
router.post('/smart-summary', 
  authenticateUser, 
  requireFeature('summaries'),
  async (req, res) => {
  try {
    console.log('=== SMART SUMMARY ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);
    
    const { fileId, includeKeyPoints = true, includeSentiment = true, includeEntities = true } = req.body;

    if (!fileId) {
      console.log('ERROR: No fileId provided');
      return res.status(400).json({ error: 'File ID is required' });
    }

    console.log('Step 1: Getting file metadata for fileId:', fileId);

    // Get file metadata
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      console.log('File not found error:', fileError);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('File found:', file.filename, 'Has OCR:', file.has_ocr);

    if (!aiService.isEnabled()) {
      console.log('AI service is not enabled');
      return res.status(503).json({ error: 'AI features are not enabled' });
    }

    console.log('Step 2: Checking extracted text availability');

    // Check if we have extracted text, if not run OCR automatically
    let text = file.extracted_text;
    if (!text || text.trim().length === 0) {
      console.log('No extracted text found, running OCR automatically...');
      
      try {
        // Download file from storage for OCR
        console.log('Step 3: Downloading file for OCR processing...');
        const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
          .from('files')
          .download(file.path);

        if (downloadError) {
          console.error('Error downloading file:', downloadError);
          return res.status(500).json({ error: 'Failed to download file for processing' });
        }

        const buffer = Buffer.from(await fileBuffer.arrayBuffer());
        
        // Determine file type for OCR processing
        const isPDF = file.type === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.filename);
        
        console.log('Step 4: Running OCR on', isPDF ? 'PDF' : 'image', 'file...');
        
        // Run OCR with multiple language attempts
        const languagesToTry = ['eng+tel', 'eng', 'tel'];
        let ocrResult = null;
        
        console.log('Processing file type:', { isPDF, isImage, mimeType: file.type });
        
        for (const language of languagesToTry) {
          try {
            console.log(`Trying OCR with language: ${language}`);
            
            if (isPDF) {
              ocrResult = await ocrService.extractTextFromPDF(buffer, {
                language: language,
                enhanceImage: true,
                maxPages: 10
              });
            } else if (isImage) {
              ocrResult = await ocrService.extractTextFromImage(buffer, {
                language: language,
                enhanceImage: true
              });
            } else {
              // For other file types, try image OCR as fallback
              console.log('Unknown file type, attempting image OCR...');
              ocrResult = await ocrService.extractTextFromImage(buffer, {
                language: language,
                enhanceImage: true
              });
            }
            
            if (ocrResult && ocrResult.text && ocrResult.text.length > 10) {
              console.log(`OCR successful with ${language}, text length:`, ocrResult.text.length);
              break;
            }
          } catch (langError) {
            console.warn(`OCR failed for language ${language}:`, langError.message);
            continue;
          }
        }
        
        if (!ocrResult || !ocrResult.text) {
          return res.status(400).json({ 
            error: 'Failed to extract text from document. The file may not contain readable text.',
            ocrFailed: true
          });
        }
        
        text = ocrResult.text;
        
        // Update file with OCR results
        console.log('Step 5: Updating file with OCR results...');
        await supabaseAdmin
          .from('files')
          .update({
            extracted_text: text,
            has_ocr: true,
            metadata: {
              ...file.metadata,
              ocr: {
                language: ocrResult.detectedLanguage || 'eng+tel',
                confidence: ocrResult.confidence,
                processedAt: new Date().toISOString(),
                enhanceImage: true
              }
            }
          })
          .eq('id', fileId);
          
        console.log('OCR completed and file updated');
        
      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
        return res.status(500).json({ 
          error: 'Failed to extract text from document: ' + ocrError.message,
          ocrFailed: true
        });
      }
    }

    console.log('Step 6: Text available, length:', text.length, 'characters');
    console.log('Text preview:', text.substring(0, 200) + '...');

    // Generate AI summary
    console.log('Step 7: Generating AI summary...');
    let summary = '';
    let keyPoints = [];
    let sentiment = null;
    let entities = [];

    try {
      if (aiService.isEnabled()) {
        console.log('AI service is enabled, generating comprehensive summary...');
        
        // Generate main summary
        summary = await aiService.summarizeText(text, 'detailed');
        console.log('Summary generated, length:', summary.length);
        
        // Generate key points if requested
        if (includeKeyPoints) {
          console.log('Step 8: Generating key points...');
          try {
            const keyPointsPrompt = `Extract 5-7 key points from the following text. Format as a numbered list:

${text.substring(0, 3000)}`;
            
            const keyPointsResponse = await aiService.openai.chat.completions.create({
              model: aiService.model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful assistant that extracts key points from documents. Return only the key points as a numbered list, one point per line.'
                },
                {
                  role: 'user',
                  content: keyPointsPrompt
                }
              ],
              max_tokens: 300,
              temperature: 0.3,
            });
            
            const keyPointsText = keyPointsResponse.choices[0].message.content.trim();
            keyPoints = keyPointsText.split('\n')
              .filter(line => line.trim().length > 0)
              .map(point => point.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim())
              .filter(point => point.length > 10)
              .slice(0, 7);
              
            console.log('Key points generated:', keyPoints.length);
          } catch (error) {
            console.error('Error generating key points:', error);
            keyPoints = ['Unable to extract key points from this document'];
          }
        }

        // Generate sentiment analysis if requested
        if (includeSentiment) {
          console.log('Step 9: Analyzing sentiment...');
          try {
            const sentimentPrompt = `Analyze the sentiment of the following text and provide percentages for positive, neutral, and negative sentiment. Respond with only a JSON object in this format: {"positive": 0.0, "neutral": 0.0, "negative": 0.0}

${text.substring(0, 2000)}`;
            
            const sentimentResponse = await aiService.openai.chat.completions.create({
              model: aiService.model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a sentiment analysis expert. Analyze text and return sentiment percentages as JSON. The three values should add up to 1.0.'
                },
                {
                  role: 'user',
                  content: sentimentPrompt
                }
              ],
              max_tokens: 100,
              temperature: 0.1,
            });
            
            try {
              const sentimentText = sentimentResponse.choices[0].message.content.trim();
              const sentimentMatch = sentimentText.match(/\{[^}]+\}/);
              if (sentimentMatch) {
                sentiment = JSON.parse(sentimentMatch[0]);
                console.log('Sentiment analysis completed:', sentiment);
              } else {
                throw new Error('Invalid sentiment response format');
              }
            } catch (parseError) {
              console.error('Error parsing sentiment response:', parseError);
              sentiment = { positive: 0.4, neutral: 0.5, negative: 0.1 };
            }
          } catch (error) {
            console.error('Error analyzing sentiment:', error);
            sentiment = { positive: 0.4, neutral: 0.5, negative: 0.1 };
          }
        }

        // Generate entity extraction if requested
        if (includeEntities) {
          console.log('Step 10: Extracting entities...');
          try {
            const entityPrompt = `Extract important entities (names, organizations, locations, dates, etc.) from the following text. Return only the entities as a simple list, one per line:

${text.substring(0, 2000)}`;
            
            const entityResponse = await aiService.openai.chat.completions.create({
              model: aiService.model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an entity extraction expert. Extract important named entities from text and return them as a simple list.'
                },
                {
                  role: 'user',
                  content: entityPrompt
                }
              ],
              max_tokens: 200,
              temperature: 0.2,
            });
            
            const entityText = entityResponse.choices[0].message.content.trim();
            entities = entityText.split('\n')
              .filter(line => line.trim().length > 0)
              .map(entity => entity.replace(/^[-•*]\s*/, '').trim())
              .filter(entity => entity.length > 1 && entity.length < 50)
              .slice(0, 10);
              
            console.log('Entities extracted:', entities.length);
          } catch (error) {
            console.error('Error extracting entities:', error);
            entities = [file.filename, 'Document Analysis'];
          }
        }
        
      } else {
        console.log('AI service not enabled, using fallback summary...');
        // Fallback summary when AI is not available
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        summary = sentences.slice(0, 3).join('. ') + '.';
        
        if (includeKeyPoints) {
          keyPoints = [
            'Document contains ' + text.split(' ').length + ' words',
            'Text extracted from ' + file.filename,
            'Processing completed successfully'
          ];
        }
        
        if (includeSentiment) {
          sentiment = { positive: 0.4, neutral: 0.5, negative: 0.1 };
        }
        
        if (includeEntities) {
          entities = [file.filename, 'PDF Document'];
        }
      }
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      // Fallback to basic summary
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      summary = sentences.slice(0, 3).join('. ') + '.';
      
      if (includeKeyPoints) {
        keyPoints = [
          'Document analysis completed',
          'Text successfully extracted',
          'Contains ' + Math.round(text.length / 1000) + 'K characters'
        ];
      }
      
      if (includeSentiment) {
        sentiment = { positive: 0.4, neutral: 0.5, negative: 0.1 };
      }
      
      if (includeEntities) {
        entities = [file.filename];
      }
    }

    const smartSummary = {
      summary: summary || 'Unable to generate summary for this document.',
      keyPoints: keyPoints,
      sentiment: sentiment,
      entities: entities
    };

    console.log('Step 11: Smart summary completed');
    console.log('- Summary length:', summary.length);
    console.log('- Key points:', keyPoints.length);
    console.log('- Sentiment:', sentiment ? 'included' : 'not included');
    console.log('- Entities:', entities.length);

    res.json({
      message: 'Smart summary generated successfully',
      result: smartSummary,
      fileId: fileId,
      ocrPerformed: !file.extracted_text // Indicate if OCR was performed
    });

  } catch (error) {
    console.error('Smart summary error:', error);
    res.status(500).json({ error: error.message || 'Smart summary failed' });
  }
});

// Summarize PDF content
router.post('/summarize', authenticateUser, async (req, res) => {
  try {
    const { fileId, summaryType = 'auto' } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get file with extracted text
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.extracted_text) {
      return res.status(400).json({ 
        error: 'File has no extracted text. Please run OCR first.',
        needsOCR: true
      });
    }

    // Check if summary already exists
    const { data: existingSummary } = await supabase
      .from('summaries')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', req.user.id)
      .eq('summary_type', summaryType)
      .single();

    if (existingSummary && !req.body.forceRegenerate) {
      return res.json({
        message: 'Summary already exists for this file',
        summary: existingSummary,
        cached: true
      });
    }

    // Generate summary
    const summaryText = await aiService.summarizeText(file.extracted_text, summaryType);

    // Save summary
    const { data: summaryRecord, error: summaryError } = await supabase
      .from('summaries')
      .upsert([
        {
          user_id: req.user.id,
          file_id: fileId,
          summary_text: summaryText,
          summary_type: summaryType,
          word_count: summaryText.split(' ').length
        }
      ])
      .select()
      .single();

    if (summaryError) {
      console.error('Error saving summary:', summaryError);
    }

    // Update file record
    await supabase
      .from('files')
      .update({ has_summary: true })
      .eq('id', fileId);

    // Log operation
    await supabase
      .from('history')
      .insert([
        {
          user_id: req.user.id,
          file_id: fileId,
          action: 'summarize'
        }
      ]);

    res.json({
      message: 'Summary generated successfully',
      summary: summaryRecord
    });

  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: error.message || 'Summarization failed' });
  }
});


// Chat with PDF
router.post('/chat-pdf', authenticateUser, async (req, res) => {
  try {
    const { fileId, message, sessionId } = req.body;

    if (!fileId || !message) {
      return res.status(400).json({ error: 'File ID and message are required' });
    }

    // Check user's plan and AI chat access
    const { PLAN_LIMITS } = require('../../../shared/planLimits');
    const { supabaseAdmin } = require('../config/supabase');
    
    // Get user's subscription info from subscriptions table
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();
    
    const userPlan = subscription?.plan || 'free';
    const planLimits = PLAN_LIMITS[userPlan];
    
    if (!planLimits.restrictions.aiChatAccess) {
      return res.status(403).json({ 
        error: 'AI Chat is available in Pro and Premium plans only. Please upgrade to access this feature.',
        needsUpgrade: true
      });
    }

    // Get file
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Try direct AI vision first for images (ONLY for chat, not OCR)
    const isImage = file.type.startsWith('image/');
    const useDirectAI = process.env.USE_DIRECT_AI_FOR_IMAGES === 'true';
    
    if (isImage && useDirectAI && directAIService.isEnabled()) {
      try {
        console.log('Using direct AI vision for chat with image');
        const { data: fileBuffer } = await supabaseAdmin.storage
          .from('files')
          .download(file.path);
        
        const buffer = Buffer.from(await fileBuffer.arrayBuffer());
        
        // Get conversation history
        const { data: conversationHistory } = await supabaseAdmin
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(10);
        
        const result = await directAIService.chatWithDocument(
          buffer,
          file.type,
          message,
          conversationHistory || []
        );
        
        // Create session if needed
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const { data: newSession } = await supabaseAdmin
            .from('chat_sessions')
            .insert([{ user_id: req.user.id, file_id: fileId, title: `Chat with ${file.filename}` }])
            .select()
            .single();
          currentSessionId = newSession.id;
        }
        
        // Save messages
        await supabaseAdmin.from('chat_messages').insert([
          { session_id: currentSessionId, role: 'user', content: message },
          { session_id: currentSessionId, role: 'assistant', content: result.response }
        ]);
        
        return res.json({
          sessionId: currentSessionId,
          response: result.response,
          method: 'direct_vision'
        });
      } catch (visionError) {
        console.log('Direct vision failed, falling back to OCR-based chat:', visionError.message);
      }
    }

    // For images using direct AI, no extracted text needed
    const usesDirectAIMethod = file.metadata?.ai_method === 'direct_vision';
    if (!usesDirectAIMethod && !file.extracted_text && !file.has_ocr) {
      return res.status(400).json({ 
        error: 'File has no extracted text. Please run OCR first.',
        needsOCR: true
      });
    }

    let currentSessionId = sessionId;

    // Create or get chat session
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('chat_sessions')
        .insert([
          {
            user_id: req.user.id,
            file_id: fileId,
            title: `Chat with ${file.filename}`,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (sessionError) {
        return res.status(400).json({ error: 'Failed to create chat session' });
      }

      currentSessionId = newSession.id;
    }

    // Get conversation history
    const { data: conversationHistory } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Save user message
    await supabaseAdmin
      .from('chat_messages')
      .insert([
        {
          session_id: currentSessionId,
          role: 'user',
          content: message,
          created_at: new Date().toISOString()
        }
      ]);

    let aiResponse;

    // Generate AI response using the document content
    if (aiService && aiService.isEnabled && aiService.isEnabled()) {
      try {
        // Use the full document text as context for now
        // In a production system, you'd use embeddings and vector search
        const documentText = file.extracted_text || 'No text content available';
        const relevantChunks = [{
          chunk_text: documentText.substring(0, 4000) // Increased context size for better responses
        }];

        aiResponse = await aiService.chatWithPDF(
          message,
          relevantChunks,
          conversationHistory || []
        );
      } catch (aiError) {
        console.error('AI service error:', aiError);
        // Fallback to enhanced rule-based response
        aiResponse = generateEnhancedFallbackResponse(message, file.filename, file.extracted_text);
      }
    } else {
      // Enhanced fallback response when AI is not available
      aiResponse = generateEnhancedFallbackResponse(message, file.filename, file.extracted_text);
    }

    // Save AI response
    await supabaseAdmin
      .from('chat_messages')
      .insert([
        {
          session_id: currentSessionId,
          role: 'assistant',
          content: aiResponse,
          created_at: new Date().toISOString()
        }
      ]);

    // Update session timestamp
    await supabaseAdmin
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);

    res.json({
      sessionId: currentSessionId,
      response: aiResponse,
      method: 'ocr_based'
    });

  } catch (error) {
    console.error('PDF chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});

// Enhanced helper function for fallback responses
function generateEnhancedFallbackResponse(message, filename, documentText = '') {
  const lowerMessage = message.toLowerCase();
  const hasContent = documentText && documentText.length > 50;
  
  // Extract some keywords from document if available
  let contextHint = '';
  if (hasContent) {
    const words = documentText.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
    const meaningfulWords = words.filter(word => word.length > 3 && !commonWords.includes(word)).slice(0, 5);
    if (meaningfulWords.length > 0) {
      contextHint = ` The document appears to discuss topics related to: ${meaningfulWords.join(', ')}.`;
    }
  }
  
  if (lowerMessage.includes('what') || lowerMessage.includes('tell me')) {
    return `I can help you understand the content of "${filename}".${contextHint} Based on the document, I can provide information about the topics discussed. What specific aspect would you like to know more about?`;
  } else if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
    if (hasContent) {
      const preview = documentText.substring(0, 200).trim() + (documentText.length > 200 ? '...' : '');
      return `Here's a brief overview of "${filename}":\n\n${preview}\n\nWould you like me to focus on a particular section or provide more details about specific topics?`;
    }
    return `I can provide a summary of "${filename}". The document contains various sections with important information.${contextHint} Would you like me to focus on a particular section?`;
  } else if (lowerMessage.includes('how') || lowerMessage.includes('why')) {
    return `That's an interesting question about "${filename}".${contextHint} Based on the document content, I can help explain the concepts and processes mentioned. Could you be more specific about what you'd like to understand?`;
  } else if (lowerMessage.includes('find') || lowerMessage.includes('search')) {
    return `I can help you search through "${filename}" for specific information.${contextHint} What particular topic or keyword are you looking for?`;
  } else {
    return `I understand you're asking about "${filename}".${contextHint} I can help you find information within this document. What specific information are you looking for?`;
  }
}

// Get chat sessions for a file
router.get('/chat-sessions/:fileId', authenticateUser, async (req, res) => {
  try {
    const { fileId } = req.params;

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ sessions });

  } catch (error) {
    console.error('Error getting chat sessions:', error);
    res.status(500).json({ error: 'Failed to get chat sessions' });
  }
});

// Get chat messages for a session
router.get('/chat-messages/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ messages });

  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Failed to get chat messages' });
  }
});

// Get AI recommendations
router.get('/recommendations/:fileId', authenticateUser, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get user history
    const { data: userHistory } = await supabase
      .from('history')
      .select('action, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Generate recommendations
    const recommendations = await aiService.generateRecommendations(
      {
        filename: file.filename,
        type: file.type,
        size: file.size,
        hasOcr: file.has_ocr,
        hasSummary: file.has_summary,
        hasEmbeddings: file.has_embeddings
      },
      userHistory || []
    );

    res.json({ recommendations });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get OCR results for a file
router.get('/ocr/:fileId', authenticateUser, async (req, res) => {
  try {
    const { fileId } = req.params;

    const { data: ocrResult, error } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !ocrResult) {
      return res.status(404).json({ error: 'OCR results not found' });
    }

    res.json({ result: ocrResult });

  } catch (error) {
    console.error('Error getting OCR results:', error);
    res.status(500).json({ error: 'Failed to get OCR results' });
  }
});

// Get summaries for a file
router.get('/summaries/:fileId', authenticateUser, async (req, res) => {
  try {
    const { fileId } = req.params;

    const { data: summaries, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ summaries });

  } catch (error) {
    console.error('Error getting summaries:', error);
    res.status(500).json({ error: 'Failed to get summaries' });
  }
});

// Test endpoint
router.get('/test', authenticateUser, (req, res) => {
  res.json({ message: 'AI routes working', user: req.user.id });
});

// Simple test endpoint without authentication
router.get('/ping', (req, res) => {
  res.json({ message: 'AI routes are accessible', timestamp: new Date().toISOString() });
});

// Enhanced text with AI endpoint
router.post('/enhance-text', 
  authenticateUser, 
  requireFeature('ai_features'),
  async (req, res) => {
  try {
    console.log('=== ENHANCE TEXT ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);
    
    const { fileId, text, enhanceWithAI = true, extractOriginal = false } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for enhancement' });
    }

    if (!aiService.isEnabled()) {
      return res.status(503).json({ error: 'AI features are not enabled' });
    }

    console.log('Step 1: Enhancing text with AI...');
    console.log('Text length:', text.length);
    console.log('Extract original:', extractOriginal);

    let enhancedText = text;
    
    if (enhanceWithAI && !extractOriginal) {
      try {
        enhancedText = await aiService.enhanceTextWithAI(text);
        console.log('Text enhanced successfully, new length:', enhancedText.length);
      } catch (enhanceError) {
        console.error('AI enhancement failed:', enhanceError);
        // Fall back to original text
        enhancedText = text;
      }
    }

    // Update file record if fileId provided
    if (fileId) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('files')
          .update({
            metadata: {
              ai_enhanced: enhanceWithAI && !extractOriginal,
              enhanced_at: new Date().toISOString()
            }
          })
          .eq('id', fileId)
          .eq('user_id', req.user.id);

        if (updateError) {
          console.warn('Could not update file metadata:', updateError);
        }
      } catch (updateError) {
        console.warn('Error updating file metadata:', updateError);
      }
    }

    res.json({
      message: 'Text enhancement completed',
      originalText: text,
      enhancedText: enhancedText,
      aiEnhanced: enhanceWithAI && !extractOriginal,
      extractOriginal: extractOriginal
    });

  } catch (error) {
    console.error('Text enhancement error:', error);
    res.status(500).json({ error: error.message || 'Text enhancement failed' });
  }
});

// Translate text endpoint
router.post('/translate-text', 
  authenticateUser, 
  requireFeature('ai_features'),
  async (req, res) => {
  try {
    console.log('=== TRANSLATE TEXT ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);
    
    const { fileId, text, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }

    if (!aiService.isEnabled()) {
      return res.status(503).json({ error: 'AI features are not enabled' });
    }

    console.log('Step 1: Translating text...');
    console.log('Text length:', text.length);
    console.log('Target language:', targetLanguage);

    const translatedText = await aiService.translateText(text, targetLanguage);
    console.log('Translation completed, new length:', translatedText.length);

    // Update file record if fileId provided
    if (fileId) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('files')
          .update({
            metadata: {
              translated: true,
              target_language: targetLanguage,
              translated_at: new Date().toISOString()
            }
          })
          .eq('id', fileId)
          .eq('user_id', req.user.id);

        if (updateError) {
          console.warn('Could not update file metadata:', updateError);
        }
      } catch (updateError) {
        console.warn('Error updating file metadata:', updateError);
      }
    }

    res.json({
      message: 'Text translation completed',
      originalText: text,
      translatedText: translatedText,
      targetLanguage: targetLanguage
    });

  } catch (error) {
    console.error('Text translation error:', error);
    res.status(500).json({ error: error.message || 'Text translation failed' });
  }
});

// Auto-detect language endpoint
router.post('/detect-language', 
  authenticateUser, 
  requireFeature('ai_features'),
  async (req, res) => {
  try {
    console.log('=== DETECT LANGUAGE ENDPOINT CALLED ===');
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for language detection' });
    }

    console.log('Detecting language for text length:', text.length);

    const detectedLanguage = await ocrService.detectLanguage(text);
    console.log('Detected language:', detectedLanguage);

    res.json({
      message: 'Language detection completed',
      detectedLanguage: detectedLanguage,
      confidence: 0.85 // Placeholder confidence
    });

  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ error: error.message || 'Language detection failed' });
  }
});

// Simple OCR test endpoint
router.post('/ocr-test', authenticateUser, async (req, res) => {
  try {
    console.log('OCR test endpoint called');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);
    
    res.json({ 
      message: 'OCR test endpoint working',
      body: req.body,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OCR test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct AI Vision Analysis - Send file directly to AI without OCR
router.post('/direct-analyze',
  authenticateUser,
  requireFeature('ai_features'),
  async (req, res) => {
  try {
    console.log('=== DIRECT AI ANALYZE ENDPOINT CALLED ===');
    const { fileId, action = 'extract', message } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!directAIService.isEnabled()) {
      return res.status(503).json({ 
        error: 'Direct AI vision service is not available. Please configure OpenAI API key.',
        fallbackToOCR: true
      });
    }

    // Get file from database
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file type is supported
    if (!directAIService.isSupportedFileType(file.type)) {
      return res.status(400).json({ 
        error: 'File type not supported for direct AI analysis',
        supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fallbackToOCR: true
      });
    }

    // Download file from storage
    const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
      .from('files')
      .download(file.path);

    if (downloadError) {
      return res.status(500).json({ error: 'Failed to download file' });
    }

    const buffer = Buffer.from(await fileBuffer.arrayBuffer());

    // Analyze with vision model
    const result = await directAIService.analyzeWithVision(
      buffer,
      file.type,
      action,
      message
    );

    // Update file record
    await supabaseAdmin
      .from('files')
      .update({
        extracted_text: result.text,
        has_ocr: true,
        metadata: {
          ...file.metadata,
          ai_method: 'direct_vision',
          model: result.model,
          processedAt: new Date().toISOString()
        }
      })
      .eq('id', fileId);

    res.json({
      message: 'Direct AI analysis completed',
      result: result,
      fileInfo: {
        filename: file.filename,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Direct AI analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct AI Chat - Chat with document using vision model
router.post('/direct-chat',
  authenticateUser,
  requireFeature('pdf_chat'),
  async (req, res) => {
  try {
    console.log('=== DIRECT AI CHAT ENDPOINT CALLED ===');
    const { fileId, message, conversationHistory = [] } = req.body;

    if (!fileId || !message) {
      return res.status(400).json({ error: 'File ID and message are required' });
    }

    if (!directAIService.isEnabled()) {
      return res.status(503).json({ 
        error: 'Direct AI vision service is not available',
        fallbackToOCR: true
      });
    }

    // Get file from database
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file type is supported
    if (!directAIService.isSupportedFileType(file.type)) {
      return res.status(400).json({ 
        error: 'File type not supported for direct AI chat',
        fallbackToOCR: true
      });
    }

    // Download file from storage
    const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
      .from('files')
      .download(file.path);

    if (downloadError) {
      return res.status(500).json({ error: 'Failed to download file' });
    }

    const buffer = Buffer.from(await fileBuffer.arrayBuffer());

    // Chat with document using vision model
    const result = await directAIService.chatWithDocument(
      buffer,
      file.type,
      message,
      conversationHistory
    );

    res.json({
      message: 'Chat response generated',
      response: result.response,
      model: result.model,
      method: 'direct_vision'
    });

  } catch (error) {
    console.error('Direct AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct AI Summary - Generate summary using vision model
router.post('/direct-summary',
  authenticateUser,
  requireFeature('summaries'),
  async (req, res) => {
  try {
    console.log('=== DIRECT AI SUMMARY ENDPOINT CALLED ===');
    const { 
      fileId, 
      includeKeyPoints = true, 
      includeSentiment = false, 
      includeEntities = false 
    } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!directAIService.isEnabled()) {
      return res.status(503).json({ 
        error: 'Direct AI vision service is not available',
        fallbackToOCR: true
      });
    }

    // Get file from database
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file type is supported
    if (!directAIService.isSupportedFileType(file.type)) {
      return res.status(400).json({ 
        error: 'File type not supported for direct AI summary',
        fallbackToOCR: true
      });
    }

    // Download file from storage
    const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
      .from('files')
      .download(file.path);

    if (downloadError) {
      return res.status(500).json({ error: 'Failed to download file' });
    }

    const buffer = Buffer.from(await fileBuffer.arrayBuffer());

    // Generate summary using vision model
    const result = await directAIService.generateSmartSummary(
      buffer,
      file.type,
      { includeKeyPoints, includeSentiment, includeEntities }
    );

    res.json({
      message: 'Summary generated successfully',
      result: result,
      fileId: fileId,
      method: 'direct_vision'
    });

  } catch (error) {
    console.error('Direct AI summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;