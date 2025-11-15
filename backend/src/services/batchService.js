const Queue = require('bull');
const { supabaseAdmin } = require('../config/supabase');
const pdfService = require('./pdfService');
const ocrService = require('./ocrService');
const aiService = require('./aiService');

class BatchService {
  constructor() {
    // Initialize Redis queue for batch processing
    this.batchQueue = new Queue('batch processing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
    
    // Process jobs
    this.batchQueue.process('batch-operation', this.processBatchOperation.bind(this));
    
    // Handle job events
    this.setupJobEventHandlers();
  }

  // Setup event handlers for job lifecycle
  setupJobEventHandlers() {
    this.batchQueue.on('completed', async (job, result) => {
      console.log(`Batch job ${job.id} completed`);
      await this.updateBatchStatus(job.data.batchId, 'completed', 100, result);
    });

    this.batchQueue.on('failed', async (job, err) => {
      console.error(`Batch job ${job.id} failed:`, err);
      await this.updateBatchStatus(job.data.batchId, 'failed', 0, null, err.message);
    });

    this.batchQueue.on('progress', async (job, progress) => {
      await this.updateBatchStatus(job.data.batchId, 'processing', progress);
    });
  }

  // Create a new batch operation
  async createBatchOperation(userId, name, operations) {
    try {
      // Validate operations
      this.validateOperations(operations);

      // Create batch record in database
      const { data: batch, error } = await supabaseAdmin
        .from('batch_operations')
        .insert([
          {
            user_id: userId,
            name: name,
            operations: operations,
            status: 'pending',
            progress: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add job to queue
      const job = await this.batchQueue.add('batch-operation', {
        batchId: batch.id,
        userId: userId,
        operations: operations
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      return {
        batchId: batch.id,
        jobId: job.id,
        status: 'pending'
      };

    } catch (error) {
      console.error('Error creating batch operation:', error);
      throw new Error('Failed to create batch operation');
    }
  }

  // Validate batch operations
  validateOperations(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('Operations must be a non-empty array');
    }

    const validOperations = ['merge', 'split', 'compress', 'convert', 'ocr', 'summarize'];
    
    for (const operation of operations) {
      if (!operation.type || !validOperations.includes(operation.type)) {
        throw new Error(`Invalid operation type: ${operation.type}`);
      }

      if (!operation.fileIds || !Array.isArray(operation.fileIds) || operation.fileIds.length === 0) {
        throw new Error('Each operation must have fileIds array');
      }
    }
  }

  // Process a batch operation
  async processBatchOperation(job) {
    const { batchId, userId, operations } = job.data;
    const results = [];
    let completedOperations = 0;

    try {
      await this.updateBatchStatus(batchId, 'processing', 0);

      for (const operation of operations) {
        const operationResult = await this.processOperation(userId, operation, job);
        results.push(operationResult);
        
        completedOperations++;
        const progress = Math.round((completedOperations / operations.length) * 100);
        job.progress(progress);
      }

      return {
        success: true,
        results: results,
        resultFiles: results.flatMap(r => r.files || [])
      };

    } catch (error) {
      console.error('Error processing batch operation:', error);
      throw error;
    }
  }

  // Process a single operation within a batch
  async processOperation(userId, operation, job) {
    const { type, fileIds, options = {} } = operation;

    try {
      switch (type) {
        case 'merge':
          return await this.processMergeOperation(userId, fileIds, options);
        
        case 'split':
          return await this.processSplitOperation(userId, fileIds, options);
        
        case 'compress':
          return await this.processCompressOperation(userId, fileIds, options);
        
        case 'convert':
          return await this.processConvertOperation(userId, fileIds, options);
        
        case 'ocr':
          return await this.processOCROperation(userId, fileIds, options);
        
        case 'summarize':
          return await this.processSummarizeOperation(userId, fileIds, options);
        
        default:
          throw new Error(`Unsupported operation type: ${type}`);
      }
    } catch (error) {
      console.error(`Error processing ${type} operation:`, error);
      return {
        type: type,
        success: false,
        error: error.message,
        files: []
      };
    }
  }

  // Process merge operation
  async processMergeOperation(userId, fileIds, options) {
    // Get file data
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .in('id', fileIds)
      .eq('user_id', userId);

    if (error || !files || files.length < 2) {
      throw new Error('Need at least 2 files to merge');
    }

    // Use existing PDF service logic
    const result = await pdfService.mergePDFs(files, options.outputName || 'batch-merged.pdf');
    
    return {
      type: 'merge',
      success: true,
      files: [result]
    };
  }

  // Process split operation
  async processSplitOperation(userId, fileIds, options) {
    const results = [];

    for (const fileId of fileIds) {
      const { data: file, error } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (error || !file) continue;

      const result = await pdfService.splitPDF(file, options.pages, options.outputName);
      results.push(...(Array.isArray(result) ? result : [result]));
    }

    return {
      type: 'split',
      success: true,
      files: results
    };
  }

  // Process compress operation
  async processCompressOperation(userId, fileIds, options) {
    const results = [];

    for (const fileId of fileIds) {
      const { data: file, error } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (error || !file) continue;

      const result = await pdfService.compressPDF(file, options.quality || 0.7, options.outputName);
      results.push(result);
    }

    return {
      type: 'compress',
      success: true,
      files: results
    };
  }

  // Process convert operation
  async processConvertOperation(userId, fileIds, options) {
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .in('id', fileIds)
      .eq('user_id', userId);

    if (error || !files) {
      throw new Error('Failed to get files for conversion');
    }

    const result = await pdfService.convertImagesToPDF(files, options.outputName || 'batch-converted.pdf');
    
    return {
      type: 'convert',
      success: true,
      files: [result]
    };
  }

  // Process OCR operation
  async processOCROperation(userId, fileIds, options) {
    const results = [];

    for (const fileId of fileIds) {
      try {
        const { data: file, error } = await supabaseAdmin
          .from('files')
          .select('*')
          .eq('id', fileId)
          .eq('user_id', userId)
          .single();

        if (error || !file) continue;

        // Get file buffer from storage
        const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
          .from('files')
          .download(file.path);

        if (downloadError) continue;

        const buffer = Buffer.from(await fileBuffer.arrayBuffer());
        
        // Perform OCR
        const ocrResult = await ocrService.extractTextFromPDF(buffer, {
          language: options.language || 'eng',
          enhanceImage: options.enhanceImage !== false
        });

        // Save OCR results
        await supabaseAdmin
          .from('ocr_results')
          .insert([
            {
              user_id: userId,
              file_id: fileId,
              extracted_text: ocrResult.text,
              confidence_score: ocrResult.confidence,
              language: ocrResult.language,
              page_count: ocrResult.pageCount
            }
          ]);

        // Update file record
        await supabaseAdmin
          .from('files')
          .update({
            extracted_text: ocrResult.text,
            has_ocr: true
          })
          .eq('id', fileId);

        results.push({
          fileId: fileId,
          text: ocrResult.text,
          confidence: ocrResult.confidence
        });

      } catch (error) {
        console.error(`Error processing OCR for file ${fileId}:`, error);
      }
    }

    return {
      type: 'ocr',
      success: true,
      files: results
    };
  }

  // Process summarize operation
  async processSummarizeOperation(userId, fileIds, options) {
    const results = [];

    for (const fileId of fileIds) {
      try {
        const { data: file, error } = await supabaseAdmin
          .from('files')
          .select('*')
          .eq('id', fileId)
          .eq('user_id', userId)
          .single();

        if (error || !file || !file.extracted_text) continue;

        // Generate summary
        const summary = await aiService.summarizeText(
          file.extracted_text,
          options.summaryType || 'auto'
        );

        // Save summary
        const { data: summaryRecord, error: summaryError } = await supabaseAdmin
          .from('summaries')
          .insert([
            {
              user_id: userId,
              file_id: fileId,
              summary_text: summary,
              summary_type: options.summaryType || 'auto',
              word_count: summary.split(' ').length
            }
          ])
          .select()
          .single();

        if (!summaryError) {
          // Update file record
          await supabaseAdmin
            .from('files')
            .update({ has_summary: true })
            .eq('id', fileId);

          results.push({
            fileId: fileId,
            summary: summary,
            summaryId: summaryRecord.id
          });
        }

      } catch (error) {
        console.error(`Error processing summary for file ${fileId}:`, error);
      }
    }

    return {
      type: 'summarize',
      success: true,
      files: results
    };
  }

  // Update batch operation status
  async updateBatchStatus(batchId, status, progress, result = null, errorMessage = null) {
    try {
      const updateData = {
        status: status,
        progress: progress,
        updated_at: new Date().toISOString()
      };

      if (result) {
        updateData.result_files = result.resultFiles || [];
      }

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      await supabaseAdmin
        .from('batch_operations')
        .update(updateData)
        .eq('id', batchId);

    } catch (error) {
      console.error('Error updating batch status:', error);
    }
  }

  // Get batch operation status
  async getBatchStatus(userId, batchId) {
    try {
      const { data: batch, error } = await supabaseAdmin
        .from('batch_operations')
        .select('*')
        .eq('id', batchId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Get job status from queue
      const job = await this.batchQueue.getJob(batch.id);
      const jobStatus = job ? await job.getState() : 'unknown';

      return {
        ...batch,
        jobStatus: jobStatus
      };

    } catch (error) {
      console.error('Error getting batch status:', error);
      throw new Error('Failed to get batch status');
    }
  }

  // Get user's batch operations
  async getUserBatchOperations(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('batch_operations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        operations: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      console.error('Error getting user batch operations:', error);
      throw new Error('Failed to get batch operations');
    }
  }

  // Cancel batch operation
  async cancelBatchOperation(userId, batchId) {
    try {
      // Get batch operation
      const { data: batch, error } = await supabaseAdmin
        .from('batch_operations')
        .select('*')
        .eq('id', batchId)
        .eq('user_id', userId)
        .single();

      if (error || !batch) {
        throw new Error('Batch operation not found');
      }

      if (batch.status === 'completed') {
        throw new Error('Cannot cancel completed operation');
      }

      // Cancel job in queue
      const jobs = await this.batchQueue.getJobs(['waiting', 'active']);
      const job = jobs.find(j => j.data.batchId === batchId);
      
      if (job) {
        await job.remove();
      }

      // Update status in database
      await supabaseAdmin
        .from('batch_operations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      return { success: true };

    } catch (error) {
      console.error('Error cancelling batch operation:', error);
      throw new Error('Failed to cancel batch operation');
    }
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const waiting = await this.batchQueue.getWaiting();
      const active = await this.batchQueue.getActive();
      const completed = await this.batchQueue.getCompleted();
      const failed = await this.batchQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
      };
    }
  }
}

module.exports = new BatchService();