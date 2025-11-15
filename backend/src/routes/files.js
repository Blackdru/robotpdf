const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for free tools (10MB limit)
const uploadFree = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for free tools
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', { filename: file.originalname, mimetype: file.mimetype });
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/tif',
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'text/html'];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(html|htm)$/i)) {
      cb(null, true);
    } else {
      console.log('File rejected - mimetype not allowed:', file.mimetype);
      cb(new Error('Invalid file type. Only PDF, images (JPG, PNG, GIF, BMP, WebP, TIFF), Word, Excel, and HTML files are allowed.'));
    }
  }
});

// Configure multer for advanced tools (100MB limit)
const uploadAdvanced = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for advanced tools
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', { filename: file.originalname, mimetype: file.mimetype });
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/tif',
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'text/html'];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(html|htm)$/i)) {
      cb(null, true);
    } else {
      console.log('File rejected - mimetype not allowed:', file.mimetype);
      cb(new Error('Invalid file type. Only PDF, images (JPG, PNG, GIF, BMP, WebP, TIFF), Word, Excel, and HTML files are allowed.'));
    }
  }
});

// Middleware to determine which upload handler to use based on user subscription
const dynamicUpload = (req, res, next) => {
  // Check if user has premium/pro subscription
  const isAdvancedUser = req.user && (req.user.subscription === 'premium' || req.user.subscription === 'pro');
  
  // Use advanced upload for premium users, free upload for others
  const uploadHandler = isAdvancedUser ? uploadAdvanced : uploadFree;
  
  uploadHandler.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxSize = isAdvancedUser ? '100MB' : '10MB';
        const upgradeMsg = isAdvancedUser ? '' : ' Upgrade to Premium for files up to 100MB.';
        return res.status(400).json({ 
          error: `File size exceeds ${maxSize} limit.${upgradeMsg}`,
          maxSize: isAdvancedUser ? 100 : 10,
          requiresUpgrade: !isAdvancedUser
        });
      }
      return next(err);
    }
    next();
  });
};

// Legacy upload for backward compatibility
const upload = uploadFree;

// Middleware to extend timeout for file uploads
const extendTimeout = (req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
};

// Upload single file - supports both authenticated and anonymous uploads
router.post('/upload', optionalAuth, extendTimeout, dynamicUpload, async (req, res) => {
  try {
    console.log('=== FILE UPLOAD STARTED ===');
    console.log('User:', req.user?.id || 'anonymous');
    console.log('File:', req.file?.originalname, 'Size:', req.file?.size, 'Type:', req.file?.mimetype);
    
    if (!req.file) {
      console.log('ERROR: No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    // If user is authenticated, verify they exist in the database
    if (req.user?.id) {
      console.log('Verifying user exists in database...');
      const { data: userExists, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('id', req.user.id)
        .single();

      if (userCheckError || !userExists) {
        console.log('User not found in database, attempting to create profile...');
        
        // Try to create user profile automatically
        try {
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert([{
              id: req.user.id,
              email: req.user.email || 'unknown@example.com',
              name: req.user.name || req.user.email?.split('@')[0] || 'User',
              role: 'user'
            }])
            .select()
            .single();

          if (createError) {
            console.error('Failed to create user profile:', createError);
            
            // Check if error is due to duplicate key (user already exists)
            if (createError.code === '23505') {
              console.log('User already exists in database (duplicate key), fetching existing user...');
              
              // Try to fetch the existing user again
              const { data: existingUser, error: fetchError } = await supabaseAdmin
                .from('users')
                .select('id, email, name')
                .eq('email', req.user.email)
                .single();
              
              if (existingUser) {
                console.log('Successfully retrieved existing user:', existingUser.id);
                // Continue with file upload - user exists
              } else {
                console.error('Could not retrieve existing user:', fetchError);
                return res.status(400).json({ 
                  error: 'User profile conflict. Please log out and log in again.' 
                });
              }
            } else {
              return res.status(400).json({ 
                error: 'User profile not found and could not be created. Please log out and log in again.' 
              });
            }
          } else {
            console.log('User profile created successfully:', newUser.id);

            // Create free subscription for new user
            try {
              await supabaseAdmin
                .from('subscriptions')
                .insert([{
                  user_id: newUser.id,
                  plan: 'free',
                  status: 'active',
                  started_at: new Date().toISOString()
                }]);

              console.log('Free subscription created for user:', newUser.id);
            } catch (subError) {
              console.error('Error creating subscription:', subError);
              // Don't fail the upload if subscription creation fails
            }
          }
        } catch (createErr) {
          console.error('Error creating user profile:', createErr);
          return res.status(400).json({ 
            error: 'User profile not found. Please log out and log in again.' 
          });
        }
      } else {
        console.log('User verified:', userExists.id);
      }
    }

    const file = req.file;
    // Use 'anonymous' folder for non-authenticated uploads
    const userId = req.user?.id || 'anonymous';
    const fileName = `${userId}/${Date.now()}-${file.originalname}`;
    console.log('Generated filename:', fileName);

    // Upload to Supabase Storage
    console.log('Step 1: Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.log('Storage upload error:', uploadError);
      return res.status(400).json({ error: uploadError.message });
    }
    
    console.log('Storage upload successful:', uploadData);

    // Save file metadata to database
    console.log('Step 2: Saving metadata to database...');
    const insertData = {
      user_id: req.user?.id || null, // null for anonymous uploads
      filename: file.originalname,
      path: uploadData.path,
      type: file.mimetype,
      size: file.size,
      is_anonymous: !req.user, // Flag for anonymous uploads
      expires_at: !req.user ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null // 24 hours expiry for anonymous
    };
    console.log('Insert data:', insertData);
    
    const { data: fileData, error: dbError } = await supabaseAdmin
      .from('files')
      .insert([insertData])
      .select()
      .single();

    console.log('Database insert result:', { fileData, dbError });

    if (dbError) {
      console.log('Database insert error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage.from('files').remove([uploadData.path]);
      return res.status(400).json({ error: dbError.message });
    }

    console.log('File upload completed successfully:', fileData);
    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileData,
      isAnonymous: !req.user
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload multiple files - with dynamic size limits
router.post('/upload-multiple', authenticateUser, extendTimeout, (req, res, next) => {
  const isAdvancedUser = req.user && (req.user.subscription === 'premium' || req.user.subscription === 'pro');
  const uploadHandler = isAdvancedUser ? uploadAdvanced : uploadFree;
  
  uploadHandler.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxSize = isAdvancedUser ? '100MB' : '10MB';
        const upgradeMsg = isAdvancedUser ? '' : ' Upgrade to Premium for files up to 100MB.';
        return res.status(400).json({ 
          error: `One or more files exceed ${maxSize} limit.${upgradeMsg}`,
          maxSize: isAdvancedUser ? 100 : 10,
          requiresUpgrade: !isAdvancedUser
        });
      }
      return next(err);
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileName = `${req.user.id}/${Date.now()}-${file.originalname}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed for ${file.originalname}: ${uploadError.message}`);
      }

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabaseAdmin
        .from('files')
        .insert([
          {
            user_id: req.user.id,
            filename: file.originalname,
            path: uploadData.path,
            type: file.mimetype,
            size: file.size
          }
        ])
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabaseAdmin.storage.from('files').remove([uploadData.path]);
        throw new Error(`Database error for ${file.originalname}: ${dbError.message}`);
      }

      return fileData;
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// Get user files
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike('filename', `%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      files: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file: data });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Download file - allow anonymous downloads for anonymous uploads
router.get('/:id/download', optionalAuth, async (req, res) => {
  try {
    // Get file metadata - allow access if user owns it OR if it's anonymous
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', req.params.id);
    
    // If user is authenticated, check ownership
    if (req.user) {
      query = query.eq('user_id', req.user.id);
    } else {
      // For anonymous, only allow downloading anonymous files
      query = query.is('user_id', null);
    }
    
    const { data: fileData, error: fileError } = await query.single();

    if (fileError || !fileData) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if anonymous file has expired
    if (fileData.is_anonymous && fileData.expires_at) {
      const expiryDate = new Date(fileData.expires_at);
      if (expiryDate < new Date()) {
        return res.status(410).json({ error: 'File has expired' });
      }
    }

    // Get file from storage
    const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
      .from('files')
      .download(fileData.path);

    if (downloadError) {
      return res.status(400).json({ error: downloadError.message });
    }

    // Convert blob to buffer for Node.js
    const buffer = Buffer.from(await fileBuffer.arrayBuffer());

    res.set({
      'Content-Type': fileData.type,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);
    
    // Schedule cleanup for anonymous files after download
    if (fileData.is_anonymous) {
      setTimeout(async () => {
        try {
          await supabaseAdmin.storage.from('files').remove([fileData.path]);
          await supabaseAdmin.from('files').delete().eq('id', fileData.id);
          console.log(`Cleaned up anonymous file: ${fileData.id}`);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }, 5000); // Delete after 5 seconds
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Delete file
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Get file metadata
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !fileData) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('files')
      .remove([fileData.path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// Get file preview/thumbnail
router.get('/:id/preview', authenticateUser, async (req, res) => {
  try {
    // Get file metadata
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fileError || !fileData) {
      return res.status(404).json({ error: 'File not found' });
    }

    // For now, return file metadata for preview
    // In a full implementation, you would generate thumbnails for images/PDFs
    res.json({
      file: fileData,
      previewUrl: null, // Would contain thumbnail URL in full implementation
      canPreview: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(fileData.type)
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Preview generation failed' });
  }
});

module.exports = router;