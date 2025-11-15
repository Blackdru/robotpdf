const subscriptionService = require('../services/subscriptionService');
const path = require('path');
const planLimitsPath = path.join(__dirname, '../../../shared/planLimits.js');
const { getPlanLimits, hasFeature } = require(planLimitsPath);

/**
 * Middleware to check subscription status
 */
const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validation = await subscriptionService.validateSubscription(userId);
    
    if (!validation.isValid) {
      return res.status(403).json({ 
        error: 'Subscription required',
        message: 'Your subscription has expired or is inactive',
        subscription: validation.subscription
      });
    }

    req.subscription = validation.subscription;
    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Failed to validate subscription' });
  }
};

/**
 * Middleware to enforce file upload limits
 */
const enforceFileLimit = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const fileCount = req.files ? req.files.length : 1;
    const limitCheck = await subscriptionService.checkPlanLimit(userId, 'filesPerMonth', fileCount);
    
    if (!limitCheck.allowed) {
      const planName = limitCheck.plan.charAt(0).toUpperCase() + limitCheck.plan.slice(1);
      return res.status(403).json({
        error: 'File limit exceeded',
        message: limitCheck.remaining === 0 
          ? `You've reached your monthly file limit of ${limitCheck.limit} files on the ${planName} plan. Upgrade to Pro for unlimited file processing.`
          : `You have ${limitCheck.remaining} files remaining this month. You're trying to upload ${fileCount} files. Upgrade to Pro for unlimited files.`,
        limit: limitCheck.limit,
        current: limitCheck.current,
        remaining: limitCheck.remaining,
        plan: limitCheck.plan,
        upgradeUrl: '/upgrade',
        limitType: 'filesPerMonth'
      });
    }

    req.fileLimitCheck = limitCheck;
    next();
  } catch (error) {
    console.error('Error enforcing file limit:', error);
    res.status(500).json({ error: 'Failed to check file limits' });
  }
};

/**
 * Middleware to enforce storage limits
 */
const enforceStorageLimit = (req, res, next) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Calculate total file size
      let totalSize = 0;
      if (req.files) {
        totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
      } else if (req.file) {
        totalSize = req.file.size;
      }

      const limitCheck = await subscriptionService.checkPlanLimit(userId, 'storageLimit', totalSize);
      
      if (!limitCheck.allowed) {
        const planName = limitCheck.plan.charAt(0).toUpperCase() + limitCheck.plan.slice(1);
        const formatBytes = (bytes) => {
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        return res.status(403).json({
          error: 'Storage limit exceeded',
          message: `You've used ${formatBytes(limitCheck.current)} of your ${formatBytes(limitCheck.limit)} storage on the ${planName} plan. This upload would exceed your limit. Upgrade to Pro for unlimited storage.`,
          limit: limitCheck.limit,
          current: limitCheck.current,
          remaining: limitCheck.remaining,
          plan: limitCheck.plan,
          upgradeUrl: '/upgrade',
          limitType: 'storageLimit'
        });
      }

      req.storageLimitCheck = limitCheck;
      next();
    } catch (error) {
      console.error('Error enforcing storage limit:', error);
      res.status(500).json({ error: 'Failed to check storage limits' });
    }
  };
};

/**
 * Middleware to enforce file size limits
 */
const enforceFileSizeLimit = (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's plan limits
    const subscription = req.subscription;
    if (!subscription) {
      return res.status(500).json({ error: 'Subscription data not available' });
    }

    const planLimits = getPlanLimits(subscription.plan);
    const maxFileSize = planLimits.maxFileSize;

    // Check file sizes
    const files = req.files || (req.file ? [req.file] : []);
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        return res.status(413).json({
          error: 'File too large',
          message: `File "${file.originalname}" (${Math.round(file.size / 1024 / 1024)}MB) exceeds your plan's ${Math.round(maxFileSize / 1024 / 1024)}MB limit.`,
          maxFileSize,
          plan: subscription.plan
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error enforcing file size limit:', error);
    res.status(500).json({ error: 'Failed to check file size limits' });
  }
};

/**
 * Middleware to require Pro plan or higher
 */
const requireProPlan = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    
    if (!['pro', 'premium'].includes(subscription.plan)) {
      return res.status(403).json({
        error: 'Pro plan required',
        message: 'This feature requires a Pro or Premium subscription.',
        currentPlan: subscription.plan,
        requiredPlan: 'pro'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking Pro plan requirement:', error);
    res.status(500).json({ error: 'Failed to verify plan requirements' });
  }
};

/**
 * Middleware to require Basic plan or higher
 */
const requireBasicPlan = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    
    if (!['basic', 'pro', 'premium'].includes(subscription.plan)) {
      return res.status(403).json({
        error: 'Basic plan required',
        message: 'This feature requires a Basic, Pro, or Premium subscription.',
        currentPlan: subscription.plan,
        requiredPlan: 'basic'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking Basic plan requirement:', error);
    res.status(500).json({ error: 'Failed to verify plan requirements' });
  }
};

/**
 * Middleware to require Premium plan
 */
const requirePremiumPlan = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    
    if (subscription.plan !== 'premium') {
      return res.status(403).json({
        error: 'Premium plan required',
        message: 'This feature requires a Premium subscription.',
        currentPlan: subscription.plan,
        requiredPlan: 'premium'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking Premium plan requirement:', error);
    res.status(500).json({ error: 'Failed to verify plan requirements' });
  }
};

/**
 * Middleware to check feature access
 */
const requireFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const featureCheck = await subscriptionService.checkFeatureAccess(userId, feature);
      
      if (!featureCheck.hasAccess) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `The ${feature} feature is not available in your ${featureCheck.plan} plan.`,
          feature,
          currentPlan: featureCheck.plan
        });
      }

      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
};

/**
 * Middleware to enforce AI operation limits
 */
const enforceAILimit = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limitCheck = await subscriptionService.checkPlanLimit(userId, 'aiOperations', 1);
    
    if (!limitCheck.allowed) {
      const planName = limitCheck.plan.charAt(0).toUpperCase() + limitCheck.plan.slice(1);
      return res.status(403).json({
        error: 'AI operation limit exceeded',
        message: limitCheck.remaining === 0
          ? `You've used all ${limitCheck.limit} AI operations on your ${planName} plan this month. Upgrade to Pro for unlimited AI features (OCR, Chat, Summaries).`
          : `You have ${limitCheck.remaining} AI operations remaining this month. Upgrade to Pro for unlimited AI features.`,
        limit: limitCheck.limit,
        current: limitCheck.current,
        remaining: limitCheck.remaining,
        plan: limitCheck.plan,
        upgradeUrl: '/upgrade',
        limitType: 'aiOperations'
      });
    }

    req.aiLimitCheck = limitCheck;
    next();
  } catch (error) {
    console.error('Error enforcing AI limit:', error);
    res.status(500).json({ error: 'Failed to check AI operation limits' });
  }
};

/**
 * Middleware to enforce API call limits
 */
const enforceAPILimit = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limitCheck = await subscriptionService.checkPlanLimit(userId, 'apiCalls', 1);
    
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'API call limit exceeded',
        message: `Your ${limitCheck.plan} plan allows ${limitCheck.limit} API calls per month. You have ${limitCheck.remaining} remaining.`,
        limit: limitCheck.limit,
        current: limitCheck.current,
        remaining: limitCheck.remaining,
        plan: limitCheck.plan
      });
    }

    req.apiLimitCheck = limitCheck;
    next();
  } catch (error) {
    console.error('Error enforcing API limit:', error);
    res.status(500).json({ error: 'Failed to check API call limits' });
  }
};

/**
 * Middleware to track usage after successful operation
 */
const trackUsage = (usageType, getAmount = () => 1, getMetadata = () => ({})) => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only track usage on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        if (userId) {
          const amount = typeof getAmount === 'function' ? getAmount(req, data) : getAmount;
          const metadata = typeof getMetadata === 'function' ? getMetadata(req, data) : getMetadata;
          
          // Track usage asynchronously (don't wait for it)
          subscriptionService.trackUsage(userId, usageType, amount, metadata)
            .catch(error => console.error('Error tracking usage:', error));
        }
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to enforce batch operation limits
 */
const enforceBatchLimit = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    const planLimits = getPlanLimits(subscription.plan);
    
    // Get number of files in batch operation
    const fileCount = req.body.fileIds ? req.body.fileIds.length : 1;
    const maxBatchSize = planLimits.restrictions.maxFilesPerBatch;
    
    if (maxBatchSize !== -1 && fileCount > maxBatchSize) {
      return res.status(403).json({
        error: 'Batch size limit exceeded',
        message: `Your ${subscription.plan} plan allows batch operations on up to ${maxBatchSize} files. You selected ${fileCount} files.`,
        maxBatchSize,
        currentBatchSize: fileCount,
        plan: subscription.plan
      });
    }

    req.batchLimitCheck = { maxBatchSize, currentBatchSize: fileCount };
    next();
  } catch (error) {
    console.error('Error enforcing batch limit:', error);
    res.status(500).json({ error: 'Failed to check batch operation limits' });
  }
};

module.exports = {
  checkSubscriptionStatus,
  enforceFileLimit,
  enforceStorageLimit,
  enforceFileSizeLimit,
  requireProPlan,
  requireBasicPlan,
  requirePremiumPlan,
  requireFeature,
  enforceAILimit,
  enforceAPILimit,
  trackUsage,
  enforceBatchLimit
};