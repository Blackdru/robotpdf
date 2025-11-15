const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createFolderSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  parent_id: Joi.string().uuid().optional().allow(null),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});

const updateFolderSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  parent_id: Joi.string().uuid().optional().allow(null),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});

const moveFolderSchema = Joi.object({
  parent_id: Joi.string().uuid().optional().allow(null)
});

const moveFilesSchema = Joi.object({
  fileIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  folder_id: Joi.string().uuid().optional().allow(null)
});

// Create folder
router.post('/', authenticateUser, validateRequest(createFolderSchema), async (req, res) => {
  try {
    const { name, parent_id, color = '#3B82F6' } = req.body;

    // Check if parent folder exists and belongs to user
    if (parent_id) {
      const { data: parentFolder, error: parentError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', parent_id)
        .eq('user_id', req.user.id)
        .single();

      if (parentError || !parentFolder) {
        return res.status(400).json({ error: 'Parent folder not found' });
      }
    }

    // Check for duplicate folder names in the same parent
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('name', name)
      .eq('parent_id', parent_id || null)
      .single();

    if (existingFolder) {
      return res.status(400).json({ error: 'Folder with this name already exists in this location' });
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .insert([
        {
          user_id: req.user.id,
          name,
          parent_id,
          color
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Folder created successfully',
      folder
    });

  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Get user folders with hierarchy
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { parent_id, flat = false } = req.query;

    let query = supabase
      .from('folders')
      .select(`
        *,
        files:files(count),
        subfolders:folders!parent_id(count)
      `)
      .eq('user_id', req.user.id);

    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    } else if (!flat) {
      query = query.is('parent_id', null);
    }

    const { data: folders, error } = await query.order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If flat is requested, return all folders
    if (flat === 'true') {
      const { data: allFolders, error: allError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', req.user.id)
        .order('name');

      if (allError) {
        return res.status(400).json({ error: allError.message });
      }

      return res.json({ folders: allFolders });
    }

    // Build folder tree if not flat
    const buildFolderTree = async (parentId = null) => {
      const { data: folders, error } = await supabase
        .from('folders')
        .select(`
          *,
          files:files(count),
          subfolders:folders!parent_id(count)
        `)
        .eq('user_id', req.user.id)
        .eq('parent_id', parentId)
        .order('name');

      if (error) return [];

      const foldersWithChildren = await Promise.all(
        folders.map(async (folder) => ({
          ...folder,
          children: await buildFolderTree(folder.id)
        }))
      );

      return foldersWithChildren;
    };

    const folderTree = await buildFolderTree();

    res.json({ folders: folderTree });

  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
});

// Get folder by ID with contents
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Get folder details
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (folderError || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Get folder contents (subfolders and files)
    const [subfoldersResult, filesResult] = await Promise.all([
      supabase
        .from('folders')
        .select(`
          *,
          files:files(count),
          subfolders:folders!parent_id(count)
        `)
        .eq('user_id', req.user.id)
        .eq('parent_id', id)
        .order('name'),
      
      supabase
        .from('files')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('folder_id', id)
        .order('created_at', { ascending: false })
    ]);

    const subfolders = subfoldersResult.data || [];
    const files = filesResult.data || [];

    // Get folder path (breadcrumb)
    const getFolderPath = async (folderId) => {
      const path = [];
      let currentId = folderId;

      while (currentId) {
        const { data: currentFolder } = await supabase
          .from('folders')
          .select('id, name, parent_id')
          .eq('id', currentId)
          .eq('user_id', req.user.id)
          .single();

        if (currentFolder) {
          path.unshift(currentFolder);
          currentId = currentFolder.parent_id;
        } else {
          break;
        }
      }

      return path;
    };

    const folderPath = await getFolderPath(id);

    res.json({
      folder: {
        ...folder,
        path: folderPath,
        subfolders,
        files,
        totalItems: subfolders.length + files.length
      }
    });

  } catch (error) {
    console.error('Error getting folder:', error);
    res.status(500).json({ error: 'Failed to get folder' });
  }
});

// Update folder
router.put('/:id', authenticateUser, validateRequest(updateFolderSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if folder exists and belongs to user
    const { data: existingFolder, error: checkError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !existingFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if new parent exists and belongs to user
    if (updates.parent_id) {
      const { data: parentFolder, error: parentError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', updates.parent_id)
        .eq('user_id', req.user.id)
        .single();

      if (parentError || !parentFolder) {
        return res.status(400).json({ error: 'Parent folder not found' });
      }

      // Prevent moving folder into itself or its descendants
      if (updates.parent_id === id) {
        return res.status(400).json({ error: 'Cannot move folder into itself' });
      }

      // Check for circular reference
      const isDescendant = async (folderId, ancestorId) => {
        let currentId = folderId;
        while (currentId) {
          if (currentId === ancestorId) return true;
          
          const { data: parent } = await supabase
            .from('folders')
            .select('parent_id')
            .eq('id', currentId)
            .single();
          
          currentId = parent?.parent_id;
        }
        return false;
      };

      if (await isDescendant(updates.parent_id, id)) {
        return res.status(400).json({ error: 'Cannot move folder into its descendant' });
      }
    }

    // Check for duplicate names if name is being updated
    if (updates.name && updates.name !== existingFolder.name) {
      const { data: duplicateFolder } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('name', updates.name)
        .eq('parent_id', updates.parent_id || existingFolder.parent_id)
        .neq('id', id)
        .single();

      if (duplicateFolder) {
        return res.status(400).json({ error: 'Folder with this name already exists in this location' });
      }
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Folder updated successfully',
      folder
    });

  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Check if folder exists and belongs to user
    const { data: folder, error: checkError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if folder has contents
    const [subfoldersResult, filesResult] = await Promise.all([
      supabase
        .from('folders')
        .select('id')
        .eq('parent_id', id)
        .eq('user_id', req.user.id)
        .limit(1),
      
      supabase
        .from('files')
        .select('id')
        .eq('folder_id', id)
        .eq('user_id', req.user.id)
        .limit(1)
    ]);

    const hasSubfolders = subfoldersResult.data && subfoldersResult.data.length > 0;
    const hasFiles = filesResult.data && filesResult.data.length > 0;

    if ((hasSubfolders || hasFiles) && force !== 'true') {
      return res.status(400).json({ 
        error: 'Folder is not empty. Use force=true to delete folder and all its contents.',
        hasSubfolders,
        hasFiles
      });
    }

    // If force delete, move all contents to root (or delete them)
    if (force === 'true') {
      // Move subfolders to parent or root
      await supabase
        .from('folders')
        .update({ parent_id: folder.parent_id })
        .eq('parent_id', id)
        .eq('user_id', req.user.id);

      // Move files to parent or root
      await supabase
        .from('files')
        .update({ folder_id: folder.parent_id })
        .eq('folder_id', id)
        .eq('user_id', req.user.id);
    }

    // Delete the folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.json({ message: 'Folder deleted successfully' });

  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Move files to folder
router.post('/move-files', authenticateUser, validateRequest(moveFilesSchema), async (req, res) => {
  try {
    const { fileIds, folder_id } = req.body;

    // Verify folder exists and belongs to user (if folder_id is provided)
    if (folder_id) {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', req.user.id)
        .single();

      if (folderError || !folder) {
        return res.status(400).json({ error: 'Destination folder not found' });
      }
    }

    // Verify all files belong to user
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id')
      .in('id', fileIds)
      .eq('user_id', req.user.id);

    if (filesError || !files || files.length !== fileIds.length) {
      return res.status(400).json({ error: 'Some files not found or do not belong to user' });
    }

    // Move files
    const { error: moveError } = await supabase
      .from('files')
      .update({ folder_id: folder_id })
      .in('id', fileIds)
      .eq('user_id', req.user.id);

    if (moveError) {
      return res.status(400).json({ error: moveError.message });
    }

    res.json({
      message: `${fileIds.length} file(s) moved successfully`,
      movedFiles: fileIds.length
    });

  } catch (error) {
    console.error('Error moving files:', error);
    res.status(500).json({ error: 'Failed to move files' });
  }
});

// Get folder statistics
router.get('/:id/stats', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify folder belongs to user
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (folderError || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Get recursive statistics
    const getRecursiveStats = async (folderId) => {
      // Get direct files
      const { data: files } = await supabase
        .from('files')
        .select('size, type')
        .eq('folder_id', folderId)
        .eq('user_id', req.user.id);

      // Get subfolders
      const { data: subfolders } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', folderId)
        .eq('user_id', req.user.id);

      let stats = {
        fileCount: files?.length || 0,
        totalSize: files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0,
        folderCount: subfolders?.length || 0,
        fileTypes: {}
      };

      // Count file types
      files?.forEach(file => {
        stats.fileTypes[file.type] = (stats.fileTypes[file.type] || 0) + 1;
      });

      // Get stats from subfolders recursively
      if (subfolders) {
        for (const subfolder of subfolders) {
          const subStats = await getRecursiveStats(subfolder.id);
          stats.fileCount += subStats.fileCount;
          stats.totalSize += subStats.totalSize;
          stats.folderCount += subStats.folderCount;

          // Merge file types
          Object.keys(subStats.fileTypes).forEach(type => {
            stats.fileTypes[type] = (stats.fileTypes[type] || 0) + subStats.fileTypes[type];
          });
        }
      }

      return stats;
    };

    const stats = await getRecursiveStats(id);

    res.json({
      folder: {
        id: folder.id,
        name: folder.name
      },
      stats
    });

  } catch (error) {
    console.error('Error getting folder stats:', error);
    res.status(500).json({ error: 'Failed to get folder statistics' });
  }
});

module.exports = router;