const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      users: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details (admin only)
router.get('/users/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const { count: fileCount } = await supabaseAdmin
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: files } = await supabaseAdmin
      .from('files')
      .select('size')
      .eq('user_id', userId);

    const totalStorage = files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

    const { count: activityCount } = await supabaseAdmin
      .from('history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      user: user,
      stats: {
        totalFiles: fileCount || 0,
        totalStorage: totalStorage,
        totalActivity: activityCount || 0
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user role (admin only)
router.put('/users/:userId/role', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'User role updated successfully',
      user: data
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user files for cleanup
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('path')
      .eq('user_id', userId);

    // Delete user files from storage
    if (files && files.length > 0) {
      const filePaths = files.map(file => file.path);
      const { error: storageError } = await supabaseAdmin.storage
        .from('files')
        .remove(filePaths);

      if (storageError) {
        console.error('Storage cleanup error:', storageError);
      }
    }

    // Delete user from database (cascading deletes will handle related records)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    // Delete user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth deletion error:', authError);
      // Continue anyway as database cleanup was successful
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system statistics (admin only)
router.get('/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total files
    const { count: totalFiles } = await supabaseAdmin
      .from('files')
      .select('*', { count: 'exact', head: true });

    // Get total storage used
    const { data: allFiles } = await supabaseAdmin
      .from('files')
      .select('size');

    const totalStorage = allFiles?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentActivity } = await supabaseAdmin
      .from('history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo);

    // Get new users this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: newUsersThisMonth } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // Get most popular operations
    const { data: operations } = await supabaseAdmin
      .from('history')
      .select('action')
      .gte('created_at', thirtyDaysAgo);

    const operationCounts = operations?.reduce((acc, op) => {
      acc[op.action] = (acc[op.action] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalFiles: totalFiles || 0,
        totalStorage: totalStorage,
        recentActivity: recentActivity || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        popularOperations: operationCounts
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get recent activity (admin only)
router.get('/activity', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('history')
      .select(`
        id,
        action,
        created_at,
        users (
          id,
          email,
          name
        ),
        files (
          id,
          filename,
          type
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      activity: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get storage usage by user (admin only)
router.get('/storage', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        files (
          size
        )
      `);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const storageByUser = data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      totalStorage: user.files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0,
      fileCount: user.files?.length || 0
    })).sort((a, b) => b.totalStorage - a.totalStorage);

    res.json({
      storageByUser: storageByUser
    });
  } catch (error) {
    console.error('Get storage usage error:', error);
    res.status(500).json({ error: 'Failed to fetch storage usage' });
  }
});

module.exports = router;