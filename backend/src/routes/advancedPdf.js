const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser, optionalAuth } = require('../middleware/auth');
const { requireProPlan, requireBasicPlan, trackUsage } = require('../middleware/subscriptionMiddleware');
const advancedPdfService = require('../services/advancedPdfService');
const ocrService = require('../services/ocrService');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Advanced merge with bookmarks and professional options
router.post('/advanced-merge', 
  authenticateUser, 
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileIds: Joi.array().items(Joi.string().uuid()).min(2).required(),
      outputName: Joi.string().required(),
      options: Joi.object({
        addBookmarks: Joi.boolean().default(true),
        addPageNumbers: Joi.boolean().default(false),
        addTitlePage: Joi.boolean().default(false),
        titlePageContent: Joi.string().when('addTitlePage', { is: true, then: Joi.required() }),
        pageNumberPosition: Joi.string().valid('top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right').default('bottom-center'),
        bookmarkStyle: Joi.string().valid('filename', 'custom').default('filename')
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { fileIds, outputName, options } = req.body;

      // Get file metadata
      const { data: files, error: filesError } = await supabaseAdmin
        .from('files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', req.user.id);

      if (filesError || !files || files.length !== fileIds.length) {
        return res.status(404).json({ error: 'One or more files not found' });
      }

      // Validate all files are PDFs
      const nonPdfFiles = files.filter(file => file.type !== 'application/pdf');
      if (nonPdfFiles.length > 0) {
        return res.status(400).json({ 
          error: 'All files must be PDFs for advanced merge',
          invalidFiles: nonPdfFiles.map(f => f.filename)
        });
      }

      // Perform advanced merge
      const result = await advancedPdfService.advancedMerge(files, outputName, options);

      // Save merged file
      const { data: mergedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'advanced-merge',
            source_files: files.map(f => ({ id: f.id, filename: f.filename })),
            options: options,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save merged file: ' + saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: mergedFile.id,
          action: 'advanced_merge',
          metadata: { source_files: fileIds, options }
        }]);

      res.json({
        message: 'Advanced merge completed successfully',
        file: mergedFile
      });

    } catch (error) {
      console.error('Advanced merge error:', error);
      res.status(500).json({ error: error.message || 'Advanced merge failed' });
    }
  }
);

// Advanced split with custom ranges and batch processing
router.post('/advanced-split',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      options: Joi.object({
        splitType: Joi.string().valid('pages', 'ranges', 'bookmarks', 'size').default('pages'),
        pageRanges: Joi.array().items(Joi.string()).when('splitType', { is: 'ranges', then: Joi.required() }),
        pagesPerFile: Joi.number().integer().min(1).when('splitType', { is: 'pages', then: Joi.required() }),
        maxFileSize: Joi.number().when('splitType', { is: 'size', then: Joi.required() }),
        customNaming: Joi.boolean().default(true),
        namingPattern: Joi.string().default('{filename}_part_{index}'),
        preserveBookmarks: Joi.boolean().default(true),
        preserveMetadata: Joi.boolean().default(true)
      }).required()
    })
  }),
  async (req, res) => {
    try {
      const { fileId, options } = req.body;

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

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Perform advanced split
      const result = await advancedPdfService.advancedSplit(file, options);

      // Save split files
      const splitFiles = [];
      for (const splitFile of result.files) {
        const { data: savedFile, error: saveError } = await supabaseAdmin
          .from('files')
          .insert([{
            user_id: req.user.id,
            filename: splitFile.filename,
            original_name: splitFile.filename,
            type: 'application/pdf',
            size: splitFile.size,
            path: splitFile.path,
            metadata: {
              operation: 'advanced-split',
              source_file: { id: file.id, filename: file.filename },
              split_info: splitFile.info,
              options: options,
              created_at: new Date().toISOString()
            }
          }])
          .select()
          .single();

        if (!saveError) {
          splitFiles.push(savedFile);
        }
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: fileId,
          action: 'advanced_split',
          metadata: { 
            options,
            result_files: splitFiles.length,
            split_type: options.splitType
          }
        }]);

      // Return as ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}_split.zip"`);
      
      const zipStream = await advancedPdfService.createZipFromFiles(result.files);
      zipStream.pipe(res);

    } catch (error) {
      console.error('Advanced split error:', error);
      res.status(500).json({ error: error.message || 'Advanced split failed' });
    }
  }
);

// Smart compression with quality control
router.post('/advanced-compress',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      outputName: Joi.string().required(),
      options: Joi.object({
        compressionLevel: Joi.string().valid('low', 'medium', 'high', 'maximum').default('medium'),
        imageQuality: Joi.number().min(0.1).max(1.0).default(0.7),
        optimizeImages: Joi.boolean().default(true),
        removeMetadata: Joi.boolean().default(false),
        linearize: Joi.boolean().default(true),
        targetSize: Joi.number().optional(),
        preserveBookmarks: Joi.boolean().default(true),
        preserveForms: Joi.boolean().default(true)
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { fileId, outputName, options } = req.body;

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

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Perform smart compression
      const result = await advancedPdfService.smartCompress(file, outputName, options);

      // Save compressed file
      const { data: compressedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'smart-compress',
            source_file: { id: file.id, filename: file.filename },
            compression_ratio: result.compressionRatio,
            original_size: file.size,
            options: options,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save compressed file: ' + saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: compressedFile.id,
          action: 'smart_compress',
          metadata: { 
            source_file: fileId,
            compression_ratio: result.compressionRatio,
            options
          }
        }]);

      res.json({
        message: 'Smart compression completed successfully',
        file: compressedFile,
        compressionRatio: result.compressionRatio,
        sizeSaved: file.size - result.size
      });

    } catch (error) {
      console.error('Smart compression error:', error);
      res.status(500).json({ error: error.message || 'Smart compression failed' });
    }
  }
);

// Password protection with advanced security
router.post('/password-protect',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      password: Joi.string().min(6).required(),
      permissions: Joi.object({
        printing: Joi.boolean().default(true),
        copying: Joi.boolean().default(true),
        editing: Joi.boolean().default(false),
        annotating: Joi.boolean().default(false),
        fillingForms: Joi.boolean().default(true),
        extracting: Joi.boolean().default(false),
        assembling: Joi.boolean().default(false),
        printingHighRes: Joi.boolean().default(false)
      }).default({}),
      outputName: Joi.string().required(),
      encryptionLevel: Joi.string().valid('128-bit', '256-bit').default('256-bit')
    })
  }),
  async (req, res) => {
    try {
      const { fileId, password, permissions, outputName, encryptionLevel } = req.body;

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

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Perform password protection
      const result = await advancedPdfService.passwordProtect(file, password, permissions, outputName, encryptionLevel);

      // Save protected file
      const { data: protectedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'password-protect',
            source_file: { id: file.id, filename: file.filename },
            encryption_level: encryptionLevel,
            permissions: permissions,
            protected: true,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save protected file: ' + saveError.message);
      }

      // Log operation (don't log the password)
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: protectedFile.id,
          action: 'password_protect',
          metadata: { 
            source_file: fileId,
            encryption_level: encryptionLevel,
            permissions
          }
        }]);

      res.json({
        message: 'Password protection applied successfully',
        file: protectedFile,
        encryptionLevel,
        permissions
      });

    } catch (error) {
      console.error('Password protection error:', error);
      res.status(500).json({ error: error.message || 'Password protection failed' });
    }
  }
);

// Password removal - Remove password protection from PDFs
router.post('/password-remove',
  optionalAuth,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      password: Joi.string().required(),
      outputName: Joi.string().required()
    })
  }),
  async (req, res) => {
    try {
      const { fileId, password, outputName } = req.body;
      const userId = req.user?.id || null;

      // Get file metadata
      const query = supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId);
      
      if (userId) {
        query.eq('user_id', userId);
      }
      
      const { data: file, error: fileError } = await query.single();

      if (fileError || !file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Perform password removal
      const result = await advancedPdfService.passwordRemove(file, password, outputName);

      // Save unlocked file
      const { data: unlockedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: userId,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'password-remove',
            source_file: { id: file.id, filename: file.filename },
            unlocked: true,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save unlocked file: ' + saveError.message);
      }

      // Log operation (don't log the password) - only if authenticated
      if (userId) {
        await supabaseAdmin
          .from('history')
          .insert([{
            user_id: userId,
            file_id: unlockedFile.id,
            action: 'password_remove',
            metadata: { 
              source_file: fileId
            }
          }]);
      }

      res.json({
        message: 'Password removed successfully',
        file: unlockedFile
      });

    } catch (error) {
      console.error('Password removal error:', error);
      res.status(500).json({ error: error.message || 'Password removal failed' });
    }
  }
);

// Digital signature with certificate management
router.post('/digital-sign',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      signatureData: Joi.object({
        name: Joi.string().required(),
        reason: Joi.string().required(),
        location: Joi.string().required(),
        contactInfo: Joi.string().email().required(),
        signatureImage: Joi.string().optional(), // Base64 encoded image
        certificateId: Joi.string().optional()
      }).required(),
      position: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required(),
        width: Joi.number().default(200),
        height: Joi.number().default(100),
        page: Joi.number().integer().min(1).default(1)
      }).default({ x: 100, y: 100 }),
      outputName: Joi.string().required(),
      signatureType: Joi.string().valid('simple', 'advanced', 'qualified').default('advanced'),
      timestampAuthority: Joi.boolean().default(true)
    })
  }),
  async (req, res) => {
    try {
      const { fileId, signatureData, position, outputName, signatureType, timestampAuthority } = req.body;

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

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Perform digital signing
      const result = await advancedPdfService.digitalSign(
        file, 
        signatureData, 
        position, 
        outputName, 
        signatureType,
        timestampAuthority
      );

      // Save signed file
      const { data: signedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'digital-sign',
            source_file: { id: file.id, filename: file.filename },
            signature_info: {
              signer: signatureData.name,
              reason: signatureData.reason,
              location: signatureData.location,
              signature_type: signatureType,
              timestamp_authority: timestampAuthority,
              signed_at: new Date().toISOString()
            },
            digitally_signed: true,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save signed file: ' + saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: signedFile.id,
          action: 'digital_sign',
          metadata: { 
            source_file: fileId,
            signer: signatureData.name,
            signature_type: signatureType,
            timestamp_authority: timestampAuthority
          }
        }]);

      res.json({
        message: 'Digital signature applied successfully',
        file: signedFile,
        signatureInfo: {
          signer: signatureData.name,
          signedAt: new Date().toISOString(),
          signatureType,
          timestampAuthority
        }
      });

    } catch (error) {
      console.error('Digital signing error:', error);
      res.status(500).json({ error: error.message || 'Digital signing failed' });
    }
  }
);

// Advanced images to PDF with professional options
router.post('/advanced-images-to-pdf',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
      outputName: Joi.string().required(),
      options: Joi.object({
        pageSize: Joi.string().valid('A4', 'A3', 'A5', 'Letter', 'Legal', 'Custom').default('A4'),
        customSize: Joi.object({
          width: Joi.number().when('pageSize', { is: 'Custom', then: Joi.required() }),
          height: Joi.number().when('pageSize', { is: 'Custom', then: Joi.required() })
        }).optional(),
        orientation: Joi.string().valid('portrait', 'landscape', 'auto').default('auto'),
        margin: Joi.number().min(0).max(100).default(20),
        imageQuality: Joi.number().min(0.1).max(1.0).default(0.9),
        fitToPage: Joi.boolean().default(true),
        centerImages: Joi.boolean().default(true),
        addPageNumbers: Joi.boolean().default(false),
        addTimestamp: Joi.boolean().default(false),
        backgroundColor: Joi.string().default('#FFFFFF'),
        compression: Joi.string().valid('none', 'jpeg', 'flate').default('jpeg')
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { fileIds, outputName, options } = req.body;

      // Get file metadata
      const { data: files, error: filesError } = await supabaseAdmin
        .from('files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', req.user.id);

      if (filesError || !files || files.length !== fileIds.length) {
        return res.status(404).json({ error: 'One or more files not found' });
      }

      // Validate all files are images
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      const nonImageFiles = files.filter(file => !imageTypes.includes(file.type));
      if (nonImageFiles.length > 0) {
        return res.status(400).json({ 
          error: 'All files must be images',
          invalidFiles: nonImageFiles.map(f => f.filename)
        });
      }

      // Perform advanced conversion
      const result = await advancedPdfService.advancedImagesToPDF(files, outputName, options);

      // Save converted file
      const { data: convertedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'advanced-images-to-pdf',
            source_files: files.map(f => ({ id: f.id, filename: f.filename })),
            options: options,
            page_count: result.pageCount,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save converted file: ' + saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: convertedFile.id,
          action: 'advanced_images_to_pdf',
          metadata: { 
            source_files: fileIds,
            page_count: result.pageCount,
            options
          }
        }]);

      res.json({
        message: 'Advanced image to PDF conversion completed successfully',
        file: convertedFile,
        pageCount: result.pageCount
      });

    } catch (error) {
      console.error('Advanced images to PDF error:', error);
      res.status(500).json({ error: error.message || 'Advanced conversion failed' });
    }
  }
);

// PDF analysis and insights
router.get('/analyze/:fileId',
  authenticateUser,
  requireProPlan,
  async (req, res) => {
    try {
      const { fileId } = req.params;

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

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Perform PDF analysis
      const analysis = await advancedPdfService.analyzePDF(file);

      res.json({
        message: 'PDF analysis completed successfully',
        analysis: analysis,
        fileInfo: {
          filename: file.filename,
          size: file.size,
          uploadedAt: file.created_at
        }
      });

    } catch (error) {
      console.error('PDF analysis error:', error);
      res.status(500).json({ error: error.message || 'PDF analysis failed' });
    }
  }
);

// Create PDF forms
router.post('/create-form',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      formFields: Joi.array().items(Joi.object({
        type: Joi.string().valid('text', 'textarea', 'checkbox', 'radio', 'dropdown', 'signature').required(),
        name: Joi.string().required(),
        label: Joi.string().required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
        width: Joi.number().default(200),
        height: Joi.number().default(30),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()).when('type', { is: Joi.valid('radio', 'dropdown'), then: Joi.required() }),
        defaultValue: Joi.string().optional(),
        validation: Joi.object({
          pattern: Joi.string().optional(),
          minLength: Joi.number().optional(),
          maxLength: Joi.number().optional()
        }).optional()
      })).min(1).required(),
      pageSize: Joi.string().valid('A4', 'A3', 'A5', 'Letter', 'Legal').default('A4'),
      outputName: Joi.string().required(),
      options: Joi.object({
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        backgroundColor: Joi.string().default('#FFFFFF'),
        fontFamily: Joi.string().default('Helvetica'),
        fontSize: Joi.number().default(12),
        addSubmitButton: Joi.boolean().default(true),
        submitButtonText: Joi.string().default('Submit'),
        addResetButton: Joi.boolean().default(false),
        resetButtonText: Joi.string().default('Reset')
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { formFields, pageSize, outputName, options } = req.body;

      // Create PDF form
      const result = await advancedPdfService.createPDFForm(formFields, pageSize, outputName, options);

      // Save form file
      const { data: formFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'create-form',
            form_fields: formFields.length,
            page_size: pageSize,
            options: options,
            is_form: true,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save form file: ' + saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: formFile.id,
          action: 'create_form',
          metadata: { 
            form_fields: formFields.length,
            page_size: pageSize
          }
        }]);

      res.json({
        message: 'PDF form created successfully',
        file: formFile,
        fieldCount: formFields.length
      });

    } catch (error) {
      console.error('PDF form creation error:', error);
      res.status(500).json({ error: error.message || 'PDF form creation failed' });
    }
  }
);

// Add annotations to PDF
router.post('/annotate',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      annotations: Joi.array().items(Joi.object({
        type: Joi.string().valid('text', 'highlight', 'underline', 'strikeout', 'note', 'stamp').required(),
        page: Joi.number().integer().min(1).required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
        width: Joi.number().default(100),
        height: Joi.number().default(20),
        content: Joi.string().required(),
        color: Joi.string().default('#FFFF00'),
        author: Joi.string().default('User'),
        opacity: Joi.number().min(0).max(1).default(0.7)
      })).min(1).required(),
      outputName: Joi.string().required()
    })
  }),
  async (req, res) => {
    try {
      const { fileId, annotations, outputName } = req.body;

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

      if (file.type !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      // Add annotations
      const result = await advancedPdfService.annotatePDF(file, annotations, outputName);

      // Save annotated file
      const { data: annotatedFile, error: saveError } = await supabaseAdmin
        .from('files')
        .insert([{
          user_id: req.user.id,
          filename: result.filename,
          original_name: result.filename,
          type: 'application/pdf',
          size: result.size,
          path: result.path,
          metadata: {
            operation: 'annotate',
            source_file: { id: file.id, filename: file.filename },
            annotations_count: annotations.length,
            annotation_types: [...new Set(annotations.map(a => a.type))],
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error('Failed to save annotated file: ' + saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: annotatedFile.id,
          action: 'annotate',
          metadata: { 
            source_file: fileId,
            annotations_count: annotations.length
          }
        }]);

      res.json({
        message: 'PDF annotations added successfully',
        file: annotatedFile,
        annotationsCount: annotations.length
      });

    } catch (error) {
      console.error('PDF annotation error:', error);
      res.status(500).json({ error: error.message || 'PDF annotation failed' });
    }
  }
);

// Enhanced OCR with AI processing
router.post('/enhanced-ocr',
  authenticateUser,
  requireBasicPlan,
  trackUsage('ocr_operation', 1),
  validateRequest({
    body: Joi.object({
      fileId: Joi.string().uuid().required(),
      options: Joi.object({
        enhanceWithAI: Joi.boolean().default(false),
        extractOriginal: Joi.boolean().default(false),
        language: Joi.string().default('auto'),
        translateTo: Joi.string().optional()
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { fileId, options } = req.body;

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

      // Validate file type
      const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!supportedTypes.includes(file.type)) {
        return res.status(400).json({ 
          error: 'Unsupported file type. Please upload a PDF or image file.',
          supportedTypes
        });
      }

      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';

      // Perform enhanced OCR with AI
      const ocrResult = await ocrService.extractTextWithAI(buffer, {
        ...options,
        fileType
      });

      // Translate if requested
      let translatedText = null;
      if (options.translateTo && ocrResult.text) {
        try {
          translatedText = await ocrService.translateText(ocrResult.text, options.translateTo);
        } catch (translateError) {
          console.warn('Translation failed:', translateError.message);
        }
      }

      // Save OCR results to database
      const { data: ocrRecord, error: saveError } = await supabaseAdmin
        .from('ocr_results')
        .insert([{
          user_id: req.user.id,
          file_id: fileId,
          extracted_text: ocrResult.text,
          original_text: ocrResult.originalText,
          enhanced_text: ocrResult.enhancedText,
          translated_text: translatedText,
          detected_language: ocrResult.detectedLanguage,
          confidence: ocrResult.confidence,
          page_count: ocrResult.pageCount,
          ai_enhanced: ocrResult.aiEnhanced,
          processing_options: ocrResult.processingOptions,
          metadata: {
            method: ocrResult.method || 'enhanced',
            image_version: ocrResult.imageVersion,
            translate_to: options.translateTo,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (saveError) {
        console.warn('Failed to save OCR results:', saveError.message);
      }

      // Log operation
      await supabaseAdmin
        .from('history')
        .insert([{
          user_id: req.user.id,
          file_id: fileId,
          action: 'enhanced_ocr',
          metadata: { 
            options,
            detected_language: ocrResult.detectedLanguage,
            confidence: ocrResult.confidence,
            ai_enhanced: ocrResult.aiEnhanced,
            translated: !!translatedText
          }
        }]);

      res.json({
        message: 'Enhanced OCR completed successfully',
        result: {
          text: ocrResult.text,
          originalText: ocrResult.originalText,
          enhancedText: ocrResult.enhancedText,
          translatedText: translatedText,
          detectedLanguage: ocrResult.detectedLanguage,
          confidence: ocrResult.confidence,
          pageCount: ocrResult.pageCount,
          pages: ocrResult.pages,
          aiEnhanced: ocrResult.aiEnhanced,
          processingOptions: ocrResult.processingOptions,
          ocrId: ocrRecord?.id
        }
      });

    } catch (error) {
      console.error('Enhanced OCR error:', error);
      res.status(500).json({ error: error.message || 'Enhanced OCR failed' });
    }
  }
);

// Get OCR results
router.get('/ocr-results/:fileId',
  authenticateUser,
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get OCR results
      const { data: ocrResults, error: ocrError } = await supabaseAdmin
        .from('ocr_results')
        .select('*')
        .eq('file_id', fileId)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (ocrError) {
        throw new Error('Failed to fetch OCR results: ' + ocrError.message);
      }

      res.json({
        message: 'OCR results retrieved successfully',
        results: ocrResults
      });

    } catch (error) {
      console.error('Get OCR results error:', error);
      res.status(500).json({ error: error.message || 'Failed to get OCR results' });
    }
  }
);

// Get supported OCR languages
router.get('/ocr-languages',
  authenticateUser,
  async (req, res) => {
    try {
      const languages = ocrService.getSupportedLanguages();
      
      res.json({
        message: 'Supported OCR languages retrieved successfully',
        languages
      });

    } catch (error) {
      console.error('Get OCR languages error:', error);
      res.status(500).json({ error: error.message || 'Failed to get OCR languages' });
    }
  }
);

// PDF to Office Converter - Convert PDF to DOC, DOCX, Excel, PowerPoint, etc.
router.post('/pdf-to-office',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
      outputFormat: Joi.string().valid('docx', 'doc', 'xlsx', 'xls', 'pptx', 'rtf', 'odt', 'txt').required(),
      options: Joi.object({
        conversionQuality: Joi.string().valid('maximum', 'high', 'balanced', 'fast').default('high'),
        ocrLanguage: Joi.string().default('auto'),
        pageRange: Joi.string().allow('').default(''),
        preserveFormatting: Joi.boolean().default(true),
        preserveImages: Joi.boolean().default(true),
        preserveTables: Joi.boolean().default(true),
        preserveHyperlinks: Joi.boolean().default(true),
        preserveHeaders: Joi.boolean().default(true),
        preserveBookmarks: Joi.boolean().default(false),
        detectTables: Joi.boolean().default(true),
        oneSheetPerPage: Joi.boolean().default(false),
        preserveFormulas: Joi.boolean().default(false),
        detectColumns: Joi.boolean().default(true),
        preserveFonts: Joi.boolean().default(true),
        preserveColors: Joi.boolean().default(true),
        createTOC: Joi.boolean().default(false),
        imageQuality: Joi.number().min(50).max(100).default(90)
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { fileIds, outputFormat, options } = req.body;

      // Get file metadata
      const { data: files, error: filesError } = await supabaseAdmin
        .from('files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', req.user.id);

      if (filesError || !files || files.length !== fileIds.length) {
        return res.status(404).json({ error: 'One or more files not found' });
      }

      // Validate all files are PDFs
      const nonPdfFiles = files.filter(file => file.type !== 'application/pdf');
      if (nonPdfFiles.length > 0) {
        return res.status(400).json({ 
          error: 'All files must be PDFs for conversion',
          invalidFiles: nonPdfFiles.map(f => f.filename)
        });
      }

      const convertedFiles = [];

      // Convert each file
      for (const file of files) {
        try {
          console.log(`Converting ${file.filename} to ${outputFormat}`);
          
          // Perform conversion
          const result = await advancedPdfService.convertPdfToOffice(file, outputFormat, options);

          // Save converted file to database
          const { data: convertedFile, error: saveError } = await supabaseAdmin
            .from('files')
            .insert([{
              user_id: req.user.id,
              filename: result.filename,
              original_name: result.filename,
              type: result.mimeType,
              size: result.size,
              path: result.path,
              metadata: {
                operation: 'pdf-to-office',
                source_file: { id: file.id, filename: file.filename },
                output_format: outputFormat,
                page_count: result.pageCount,
                options: options,
                created_at: new Date().toISOString()
              }
            }])
            .select()
            .single();

          if (saveError) {
            console.error(`Failed to save converted file ${result.filename}:`, saveError.message);
            continue;
          }

          convertedFiles.push(convertedFile);

          // Log operation
          await supabaseAdmin
            .from('history')
            .insert([{
              user_id: req.user.id,
              file_id: convertedFile.id,
              action: 'pdf_to_office',
              metadata: { 
                source_file: file.id,
                output_format: outputFormat,
                page_count: result.pageCount,
                options
              }
            }]);

        } catch (conversionError) {
          console.error(`Error converting ${file.filename}:`, conversionError.message);
          // Continue with other files
        }
      }

      if (convertedFiles.length === 0) {
        return res.status(500).json({ error: 'Failed to convert any files' });
      }

      res.json({
        message: `Successfully converted ${convertedFiles.length} file(s) to ${outputFormat.toUpperCase()}`,
        files: convertedFiles,
        outputFormat: outputFormat,
        totalConverted: convertedFiles.length,
        totalRequested: files.length
      });

    } catch (error) {
      console.error('PDF to Office conversion error:', error);
      res.status(500).json({ error: error.message || 'PDF to Office conversion failed' });
    }
  }
);

// Advanced HTML to PDF - Convert webpage URL to PDF with advanced settings
router.post('/advanced-html-to-pdf',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  async (req, res) => {
    try {
      const { url, outputName = 'webpage.pdf', options = {} } = req.body;

      console.log('=== ADVANCED HTML TO PDF REQUEST ===');
      console.log('User:', req.user.id);
      console.log('URL:', url);
      console.log('Viewport Mode:', options.viewportMode || 'desktop');

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Use puppeteer to convert HTML to PDF with advanced options
      const puppeteer = require('puppeteer');
      
      let browser;
      try {
        // Launch browser
        browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        });

        const page = await browser.newPage();
        
        // Set viewport based on mode
        const viewportMode = options.viewportMode || 'desktop';
        const viewportConfig = viewportMode === 'mobile' 
          ? { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true }
          : { width: 1920, height: 1080, deviceScaleFactor: 1 };
        
        await page.setViewport(viewportConfig);

        // Navigate to URL with timeout and better error handling
        console.log(`Navigating to URL: ${url}`);
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });

        // Prepare PDF options
        const pdfOptions = {
          format: options.pageSize || 'A4',
          landscape: options.orientation === 'landscape',
          printBackground: options.printBackground !== false,
          margin: options.margin || {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          },
          displayHeaderFooter: options.displayHeaderFooter || false,
          headerTemplate: options.headerTemplate || '',
          footerTemplate: options.footerTemplate || '',
          scale: options.scale || 1,
          preferCSSPageSize: options.preferCSSPageSize || false
        };

        // Generate PDF
        const pdfBuffer = await page.pdf(pdfOptions);

        await browser.close();

        // Save PDF file
        const userFolder = req.user.id;
        const filePath = `${userFolder}/processed/${Date.now()}-${outputName}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('files')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to save processed file: ${uploadError.message}`);
        }

        // Save metadata to database
        const { data: fileData, error: dbError } = await supabaseAdmin
          .from('files')
          .insert([
            {
              user_id: req.user.id,
              filename: outputName,
              path: uploadData.path,
              type: 'application/pdf',
              size: pdfBuffer.length
            }
          ])
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabaseAdmin.storage.from('files').remove([uploadData.path]);
          throw new Error(`Database error: ${dbError.message}`);
        }

        // Log operation
        await supabaseAdmin
          .from('history')
          .insert([
            {
              user_id: req.user.id,
              file_id: fileData.id,
              action: 'advanced-html-to-pdf'
            }
          ]);

        console.log('Advanced HTML to PDF completed successfully:', fileData.id);

        res.json({
          message: 'Webpage converted to PDF successfully',
          file: fileData
        });

      } catch (error) {
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error('Error closing browser:', closeError);
          }
        }
        throw error;
      }

    } catch (error) {
      console.error('Advanced HTML to PDF error:', error);
      
      // Provide specific error messages
      if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        return res.status(408).json({ error: 'Request timeout. The webpage took too long to load. Try a simpler page or check your internet connection.' });
      }
      
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        return res.status(400).json({ error: 'Cannot resolve domain name. Please check the URL is correct.' });
      }
      
      if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        return res.status(400).json({ error: 'Connection refused. The website may be down or blocking our server.' });
      }
      
      if (error.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
        return res.status(408).json({ error: 'Connection timed out. The website is not responding.' });
      }
      
      if (error.message.includes('net::ERR')) {
        return res.status(400).json({ error: `Failed to load webpage: ${error.message}. Please verify the URL is accessible.` });
      }
      
      if (error.message.includes('Invalid URL')) {
        return res.status(400).json({ error: 'Invalid URL format. Please enter a valid URL starting with http:// or https://' });
      }
      
      res.status(500).json({ error: error.message || 'HTML to PDF conversion failed' });
    }
  }
);

// Advanced HTML File to PDF - Convert uploaded HTML file to PDF with advanced settings
router.post('/advanced-html-file-to-pdf',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  async (req, res) => {
    try {
      const { fileId, outputName = 'webpage.pdf', options = {} } = req.body;

      console.log('=== ADVANCED HTML FILE TO PDF REQUEST ===');
      console.log('User:', req.user.id);
      console.log('File ID:', fileId);
      console.log('Options:', options);

      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      // Get file metadata
      const { data: file, error: fileError } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', req.user.id)
        .single();

      if (fileError || !file) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      // Validate file type
      if (!file.type.includes('html') && !file.filename.match(/\.(html|htm)$/i)) {
        return res.status(400).json({ error: 'File must be an HTML file (.html or .htm)' });
      }

      // Get file buffer
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const htmlContent = Buffer.from(await fileBuffer.arrayBuffer()).toString('utf-8');

      // Use puppeteer to convert HTML to PDF
      const puppeteer = require('puppeteer');
      
      let browser;
      try {
        // Launch browser
        browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        });

        const page = await browser.newPage();
        
        // Set viewport based on mode
        const viewportMode = options.viewportMode || 'desktop';
        const viewportConfig = viewportMode === 'mobile' 
          ? { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true }
          : { width: 1920, height: 1080, deviceScaleFactor: 1 };
        
        await page.setViewport(viewportConfig);

        // Set HTML content
        await page.setContent(htmlContent, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });

        // Prepare PDF options
        const pdfOptions = {
          format: options.pageSize || 'A4',
          landscape: options.orientation === 'landscape',
          printBackground: options.printBackground !== false,
          margin: options.margin || {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          },
          displayHeaderFooter: options.displayHeaderFooter || false,
          headerTemplate: options.headerTemplate || '',
          footerTemplate: options.footerTemplate || '',
          scale: options.scale || 1,
          preferCSSPageSize: options.preferCSSPageSize || false
        };

        // Generate PDF
        const pdfBuffer = await page.pdf(pdfOptions);

        await browser.close();

        // Save PDF file
        const userFolder = req.user.id;
        const filePath = `${userFolder}/processed/${Date.now()}-${outputName}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('files')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to save processed file: ${uploadError.message}`);
        }

        // Save metadata to database
        const { data: fileData, error: dbError } = await supabaseAdmin
          .from('files')
          .insert([
            {
              user_id: req.user.id,
              filename: outputName,
              path: uploadData.path,
              type: 'application/pdf',
              size: pdfBuffer.length
            }
          ])
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabaseAdmin.storage.from('files').remove([uploadData.path]);
          throw new Error(`Database error: ${dbError.message}`);
        }

        // Log operation
        await supabaseAdmin
          .from('history')
          .insert([
            {
              user_id: req.user.id,
              file_id: fileData.id,
              action: 'advanced-html-file-to-pdf'
            }
          ]);

        console.log('Advanced HTML file to PDF completed successfully:', fileData.id);

        res.json({
          message: 'HTML file converted to PDF successfully',
          file: fileData
        });

      } catch (error) {
        if (browser) {
          await browser.close();
        }
        throw error;
      }

    } catch (error) {
      console.error('Advanced HTML file to PDF error:', error);
      
      if (error.message.includes('timeout')) {
        return res.status(408).json({ error: 'Request timeout. The HTML file took too long to process.' });
      }
      
      res.status(500).json({ error: error.message || 'HTML file to PDF conversion failed' });
    }
  }
);

// Office to PDF Converter - Convert Word, Excel, PowerPoint to PDF
router.post('/office-to-pdf',
  authenticateUser,
  requireProPlan,
  trackUsage('pdf_operation', 1),
  validateRequest({
    body: Joi.object({
      fileIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
      options: Joi.object({
        conversionQuality: Joi.string().valid('maximum', 'high', 'balanced', 'fast').default('high'),
        pdfVersion: Joi.string().valid('1.4', '1.5', '1.6', '1.7', '2.0').default('1.7'),
        pageSize: Joi.string().valid('auto', 'A4', 'A3', 'A5', 'Letter', 'Legal', 'Tabloid').default('auto'),
        orientation: Joi.string().valid('auto', 'portrait', 'landscape').default('auto'),
        preserveFormatting: Joi.boolean().default(true),
        preserveImages: Joi.boolean().default(true),
        preserveTables: Joi.boolean().default(true),
        preserveHyperlinks: Joi.boolean().default(true),
        preserveHeaders: Joi.boolean().default(true),
        preserveBookmarks: Joi.boolean().default(false),
        embedFonts: Joi.boolean().default(true),
        compressImages: Joi.boolean().default(false),
        linearize: Joi.boolean().default(false),
        pdfA: Joi.boolean().default(false),
        addMetadata: Joi.boolean().default(true),
        createTOC: Joi.boolean().default(false),
        imageQuality: Joi.number().min(50).max(100).default(90),
        margins: Joi.object({
          top: Joi.number().default(72),
          right: Joi.number().default(72),
          bottom: Joi.number().default(72),
          left: Joi.number().default(72)
        }).default({})
      }).default({})
    })
  }),
  async (req, res) => {
    try {
      const { fileIds, options } = req.body;

      // Get file metadata
      const { data: files, error: filesError } = await supabaseAdmin
        .from('files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', req.user.id);

      if (filesError || !files || files.length !== fileIds.length) {
        return res.status(404).json({ error: 'One or more files not found' });
      }

      // Validate all files are Office documents
      const officeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'text/plain'
      ];
      
      const nonOfficeFiles = files.filter(file => !officeTypes.includes(file.type));
      if (nonOfficeFiles.length > 0) {
        return res.status(400).json({ 
          error: 'All files must be Office documents (Word, Excel, PowerPoint, RTF, ODT, or TXT)',
          invalidFiles: nonOfficeFiles.map(f => f.filename)
        });
      }

      const convertedFiles = [];

      // Convert each file
      for (const file of files) {
        try {
          console.log(`Converting ${file.filename} to PDF`);
          
          // Perform conversion
          const result = await advancedPdfService.convertOfficeToPdf(file, options);

          // Save converted file to database
          const { data: convertedFile, error: saveError } = await supabaseAdmin
            .from('files')
            .insert([{
              user_id: req.user.id,
              filename: result.filename,
              original_name: result.filename,
              type: 'application/pdf',
              size: result.size,
              path: result.path,
              metadata: {
                operation: 'office-to-pdf',
                source_file: { id: file.id, filename: file.filename },
                source_format: file.type,
                page_count: result.pageCount,
                options: options,
                created_at: new Date().toISOString()
              }
            }])
            .select()
            .single();

          if (saveError) {
            console.error(`Failed to save converted file ${result.filename}:`, saveError.message);
            continue;
          }

          convertedFiles.push(convertedFile);

          // Log operation
          await supabaseAdmin
            .from('history')
            .insert([{
              user_id: req.user.id,
              file_id: convertedFile.id,
              action: 'office_to_pdf',
              metadata: { 
                source_file: file.id,
                source_format: file.type,
                page_count: result.pageCount,
                options
              }
            }]);

        } catch (conversionError) {
          console.error(`Error converting ${file.filename}:`, conversionError.message);
          // Continue with other files
        }
      }

      if (convertedFiles.length === 0) {
        return res.status(500).json({ error: 'Failed to convert any files' });
      }

      res.json({
        message: `Successfully converted ${convertedFiles.length} file(s) to PDF`,
        files: convertedFiles,
        totalConverted: convertedFiles.length,
        totalRequested: files.length
      });

    } catch (error) {
      console.error('Office to PDF conversion error:', error);
      res.status(500).json({ error: error.message || 'Office to PDF conversion failed' });
    }
  }
);

// Get supported output formats for PDF to Office conversion
router.get('/pdf-to-office/formats',
  authenticateUser,
  async (req, res) => {
    try {
      const formats = [
        {
          id: 'docx',
          name: 'Word Document (.docx)',
          description: 'Microsoft Word 2007 and later',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          category: 'Document',
          recommended: true
        },
        {
          id: 'doc',
          name: 'Word 97-2003 (.doc)',
          description: 'Legacy Microsoft Word format',
          mimeType: 'application/msword',
          category: 'Document',
          recommended: false
        },
        {
          id: 'xlsx',
          name: 'Excel Spreadsheet (.xlsx)',
          description: 'Microsoft Excel 2007 and later',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          category: 'Spreadsheet',
          recommended: true
        },
        {
          id: 'xls',
          name: 'Excel 97-2003 (.xls)',
          description: 'Legacy Microsoft Excel format',
          mimeType: 'application/vnd.ms-excel',
          category: 'Spreadsheet',
          recommended: false
        },
        {
          id: 'pptx',
          name: 'PowerPoint (.pptx)',
          description: 'Microsoft PowerPoint 2007 and later',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          category: 'Presentation',
          recommended: true
        },
        {
          id: 'rtf',
          name: 'Rich Text Format (.rtf)',
          description: 'Universal document format',
          mimeType: 'application/rtf',
          category: 'Document',
          recommended: false
        },
        {
          id: 'odt',
          name: 'OpenDocument Text (.odt)',
          description: 'Open standard document format',
          mimeType: 'application/vnd.oasis.opendocument.text',
          category: 'Document',
          recommended: false
        },
        {
          id: 'txt',
          name: 'Plain Text (.txt)',
          description: 'Simple text file without formatting',
          mimeType: 'text/plain',
          category: 'Text',
          recommended: false
        }
      ];

      res.json({
        message: 'Supported output formats retrieved successfully',
        formats
      });

    } catch (error) {
      console.error('Get output formats error:', error);
      res.status(500).json({ error: error.message || 'Failed to get output formats' });
    }
  }
);

module.exports = router;