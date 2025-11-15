const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      user: data
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateUser, validateRequest(schemas.updateProfile), async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If email is being updated, also update in Supabase Auth
    if (email && email !== req.user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: email
      });

      if (authError) {
        console.error('Auth email update error:', authError);
        // Revert database change if auth update fails
        await supabaseAdmin
          .from('users')
          .update({ email: req.user.email })
          .eq('id', req.user.id);
        
        return res.status(400).json({ error: 'Failed to update email in authentication system' });
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user: data
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Get file count
    const { count: fileCount, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (fileError) {
      console.error('File count error:', fileError);
    }

    // Get total storage used
    const { data: files, error: storageError } = await supabaseAdmin
      .from('files')
      .select('size')
      .eq('user_id', req.user.id);

    if (storageError) {
      console.error('Storage calculation error:', storageError);
    }

    const totalStorage = files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

    // Get recent activity count
    const { count: activityCount, error: activityError } = await supabaseAdmin
      .from('history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (activityError) {
      console.error('Activity count error:', activityError);
    }

    res.json({
      stats: {
        totalFiles: fileCount || 0,
        totalStorage: totalStorage,
        recentActivity: activityCount || 0,
        storageLimit: 1024 * 1024 * 1024 * 5, // 5GB limit for free users
        filesLimit: 1000 // 1000 files limit for free users
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get user activity history
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('history')
      .select(`
        id,
        action,
        created_at,
        files (
          id,
          filename,
          type
        )
      `, { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      history: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Delete user account
router.delete('/account', authenticateUser, async (req, res) => {
  try {
    // Delete user files from storage
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('path')
      .eq('user_id', req.user.id);

    if (files && files.length > 0) {
      const filePaths = files.map(file => file.path);
      const { error: storageError } = await supabaseAdmin.storage
        .from('files')
        .remove(filePaths);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    // Delete user data from database (cascading deletes will handle related records)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    // Delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(req.user.id);

    if (authError) {
      console.error('Auth deletion error:', authError);
      // Continue anyway as database cleanup was successful
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;