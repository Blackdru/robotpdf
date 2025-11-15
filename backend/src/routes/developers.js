const express = require('express');
const router = express.Router();
const developerService = require('../services/developerService');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateUser);
router.use(requireAdmin);

// POST /api/developers - Create new developer
router.post('/', async (req, res) => {
  try {
    const { name, email, monthly_limit, rate_limit_per_minute, metadata } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const developer = await developerService.createDeveloper({
      name,
      email,
      monthlyLimit: monthly_limit,
      rateLimitPerMinute: rate_limit_per_minute,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Developer created successfully',
      data: developer
    });
  } catch (error) {
    console.error('Create developer error:', error);
    res.status(500).json({
      error: 'Failed to create developer',
      message: error.message
    });
  }
});

// GET /api/developers - List all developers
router.get('/', async (req, res) => {
  try {
    const developers = await developerService.listDevelopers();

    res.json({
      success: true,
      data: developers
    });
  } catch (error) {
    console.error('List developers error:', error);
    res.status(500).json({
      error: 'Failed to list developers',
      message: error.message
    });
  }
});

// GET /api/developers/:id - Get developer details
router.get('/:id', async (req, res) => {
  try {
    const developer = await developerService.getDeveloper(req.params.id);

    res.json({
      success: true,
      data: developer
    });
  } catch (error) {
    console.error('Get developer error:', error);
    res.status(500).json({
      error: 'Failed to get developer',
      message: error.message
    });
  }
});

// PUT /api/developers/:id - Update developer
router.put('/:id', async (req, res) => {
  try {
    const { name, email, is_active, metadata } = req.body;

    const developer = await developerService.updateDeveloper(req.params.id, {
      name,
      email,
      is_active,
      metadata
    });

    res.json({
      success: true,
      message: 'Developer updated successfully',
      data: developer
    });
  } catch (error) {
    console.error('Update developer error:', error);
    res.status(500).json({
      error: 'Failed to update developer',
      message: error.message
    });
  }
});

// PUT /api/developers/:id/limits - Update developer limits
router.put('/:id/limits', async (req, res) => {
  try {
    const { monthly_limit, rate_limit_per_minute } = req.body;

    const limits = await developerService.updateLimits(req.params.id, {
      monthly_limit,
      rate_limit_per_minute
    });

    res.json({
      success: true,
      message: 'Limits updated successfully',
      data: limits
    });
  } catch (error) {
    console.error('Update limits error:', error);
    res.status(500).json({
      error: 'Failed to update limits',
      message: error.message
    });
  }
});

// DELETE /api/developers/:id - Delete developer
router.delete('/:id', async (req, res) => {
  try {
    await developerService.deleteDeveloper(req.params.id);

    res.json({
      success: true,
      message: 'Developer deleted successfully'
    });
  } catch (error) {
    console.error('Delete developer error:', error);
    res.status(500).json({
      error: 'Failed to delete developer',
      message: error.message
    });
  }
});

// POST /api/developers/:id/regenerate-keys - Regenerate API keys
router.post('/:id/regenerate-keys', async (req, res) => {
  try {
    const keys = await developerService.regenerateKeys(req.params.id);

    res.json({
      success: true,
      message: 'API keys regenerated successfully',
      data: keys
    });
  } catch (error) {
    console.error('Regenerate keys error:', error);
    res.status(500).json({
      error: 'Failed to regenerate keys',
      message: error.message
    });
  }
});

// GET /api/developers/:id/logs - Get usage logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const logs = await developerService.getUsageLogs(req.params.id, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get usage logs error:', error);
    res.status(500).json({
      error: 'Failed to get usage logs',
      message: error.message
    });
  }
});

// POST /api/developers/:id/reset-usage - Reset monthly usage
router.post('/:id/reset-usage', async (req, res) => {
  try {
    const limits = await developerService.resetMonthlyUsage(req.params.id);

    res.json({
      success: true,
      message: 'Monthly usage reset successfully',
      data: limits
    });
  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({
      error: 'Failed to reset usage',
      message: error.message
    });
  }
});

module.exports = router;
