const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const batchService = require('../services/batchService');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const batchOperationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  operations: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('merge', 'split', 'compress', 'convert', 'ocr', 'summarize').required(),
      fileIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
      options: Joi.object().optional()
    })
  ).min(1).required()
});

// Create batch operation
router.post('/', authenticateUser, validateRequest(batchOperationSchema), async (req, res) => {
  try {
    const { name, operations } = req.body;

    const result = await batchService.createBatchOperation(req.user.id, name, operations);

    res.status(201).json({
      message: 'Batch operation created successfully',
      batch: result
    });

  } catch (error) {
    console.error('Error creating batch operation:', error);
    res.status(500).json({ error: error.message || 'Failed to create batch operation' });
  }
});

// Get batch operation status
router.get('/:batchId', authenticateUser, async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await batchService.getBatchStatus(req.user.id, batchId);

    res.json({ batch });

  } catch (error) {
    console.error('Error getting batch status:', error);
    res.status(500).json({ error: error.message || 'Failed to get batch status' });
  }
});

// Get user's batch operations
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await batchService.getUserBatchOperations(req.user.id, page, limit);

    res.json(result);

  } catch (error) {
    console.error('Error getting batch operations:', error);
    res.status(500).json({ error: error.message || 'Failed to get batch operations' });
  }
});

// Cancel batch operation
router.delete('/:batchId', authenticateUser, async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await batchService.cancelBatchOperation(req.user.id, batchId);

    res.json({
      message: 'Batch operation cancelled successfully',
      result
    });

  } catch (error) {
    console.error('Error cancelling batch operation:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel batch operation' });
  }
});

// Get queue statistics (for monitoring)
router.get('/admin/queue-stats', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin middleware)
    const stats = await batchService.getQueueStats();

    res.json({ stats });

  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Batch operation templates for common workflows
router.get('/templates/common', authenticateUser, async (req, res) => {
  try {
    const templates = [
      {
        id: 'merge-compress',
        name: 'Merge & Compress',
        description: 'Merge multiple PDFs and compress the result',
        operations: [
          {
            type: 'merge',
            fileIds: [], // Will be filled by user
            options: { outputName: 'merged-document.pdf' }
          },
          {
            type: 'compress',
            fileIds: [], // Will reference the merged file
            options: { quality: 0.7, outputName: 'compressed-merged.pdf' }
          }
        ]
      },
      {
        id: 'ocr-summarize',
        name: 'OCR & Summarize',
        description: 'Extract text from PDFs and generate summaries',
        operations: [
          {
            type: 'ocr',
            fileIds: [], // Will be filled by user
            options: { language: 'eng', enhanceImage: true }
          },
          {
            type: 'summarize',
            fileIds: [], // Same files as OCR
            options: { summaryType: 'auto' }
          }
        ]
      },
      {
        id: 'convert-merge-compress',
        name: 'Convert, Merge & Compress',
        description: 'Convert images to PDF, merge with other PDFs, and compress',
        operations: [
          {
            type: 'convert',
            fileIds: [], // Image files
            options: { outputName: 'converted-images.pdf' }
          },
          {
            type: 'merge',
            fileIds: [], // Converted PDF + other PDFs
            options: { outputName: 'final-merged.pdf' }
          },
          {
            type: 'compress',
            fileIds: [], // Final merged PDF
            options: { quality: 0.8, outputName: 'final-compressed.pdf' }
          }
        ]
      },
      {
        id: 'full-ai-processing',
        name: 'Complete AI Processing',
        description: 'OCR, summarize, and enable chat for PDFs',
        operations: [
          {
            type: 'ocr',
            fileIds: [], // Will be filled by user
            options: { language: 'eng', enhanceImage: true }
          },
          {
            type: 'summarize',
            fileIds: [], // Same files as OCR
            options: { summaryType: 'detailed' }
          }
        ]
      }
    ];

    res.json({ templates });

  } catch (error) {
    console.error('Error getting batch templates:', error);
    res.status(500).json({ error: 'Failed to get batch templates' });
  }
});

// Create batch operation from template
router.post('/from-template', authenticateUser, async (req, res) => {
  try {
    const { templateId, name, fileIds, customOptions = {} } = req.body;

    if (!templateId || !name || !fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({ error: 'Template ID, name, and file IDs are required' });
    }

    // Get template
    const templates = {
      'merge-compress': [
        {
          type: 'merge',
          fileIds: fileIds,
          options: { outputName: customOptions.mergedName || 'merged-document.pdf' }
        },
        {
          type: 'compress',
          fileIds: ['$RESULT_0'], // Reference to first operation result
          options: { 
            quality: customOptions.quality || 0.7, 
            outputName: customOptions.compressedName || 'compressed-merged.pdf' 
          }
        }
      ],
      'ocr-summarize': [
        {
          type: 'ocr',
          fileIds: fileIds,
          options: { 
            language: customOptions.language || 'eng', 
            enhanceImage: customOptions.enhanceImage !== false 
          }
        },
        {
          type: 'summarize',
          fileIds: fileIds,
          options: { summaryType: customOptions.summaryType || 'auto' }
        }
      ],
      'full-ai-processing': [
        {
          type: 'ocr',
          fileIds: fileIds,
          options: { 
            language: customOptions.language || 'eng', 
            enhanceImage: customOptions.enhanceImage !== false 
          }
        },
        {
          type: 'summarize',
          fileIds: fileIds,
          options: { summaryType: customOptions.summaryType || 'detailed' }
        }
      ]
    };

    const operations = templates[templateId];
    if (!operations) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const result = await batchService.createBatchOperation(req.user.id, name, operations);

    res.status(201).json({
      message: 'Batch operation created from template successfully',
      batch: result
    });

  } catch (error) {
    console.error('Error creating batch from template:', error);
    res.status(500).json({ error: error.message || 'Failed to create batch from template' });
  }
});

// Get batch operation progress with detailed status
router.get('/:batchId/progress', authenticateUser, async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await batchService.getBatchStatus(req.user.id, batchId);

    // Calculate detailed progress
    const progress = {
      overall: batch.progress,
      status: batch.status,
      operations: batch.operations.map((op, index) => ({
        type: op.type,
        status: batch.progress === 100 ? 'completed' : 
                batch.progress > (index / batch.operations.length) * 100 ? 'completed' :
                batch.progress >= (index / batch.operations.length) * 100 ? 'processing' : 'pending',
        fileCount: op.fileIds.length
      })),
      estimatedTimeRemaining: batch.status === 'processing' ? 
        Math.max(0, Math.round((100 - batch.progress) * 2)) : 0, // Rough estimate in seconds
      startedAt: batch.created_at,
      updatedAt: batch.updated_at
    };

    res.json({ progress });

  } catch (error) {
    console.error('Error getting batch progress:', error);
    res.status(500).json({ error: error.message || 'Failed to get batch progress' });
  }
});

module.exports = router;