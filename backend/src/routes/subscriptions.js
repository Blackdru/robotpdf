const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { PLAN_LIMITS } = require('../../../shared/planLimits.js');
const paymentService = require('../services/paymentService');
const currencyService = require('../services/currencyService');

const router = express.Router();

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.entries(PLAN_LIMITS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      restrictions: plan.restrictions,
      limits: {
        filesPerMonth: plan.filesPerMonth,
        maxFileSize: plan.maxFileSize,
        storageLimit: plan.storageLimit,
        aiOperations: plan.aiOperations,
        apiCalls: plan.apiCalls,
        batchOperations: plan.batchOperations
      }
    }));

    res.json({ plans });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Get current user subscription
router.get('/current', authenticateUser, async (req, res) => {
  try {
    // Get user profile with subscription info
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get subscription from subscriptions table if exists
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    const currentPlan = subscription?.plan || 'free';
    const planLimits = PLAN_LIMITS[currentPlan];

    res.json({
      subscription: {
        id: subscription?.id,
        plan: currentPlan,
        status: subscription?.status || 'active',
        started_at: subscription?.started_at,
        expires_at: subscription?.expires_at,
        cancel_at_period_end: subscription?.cancel_at_period_end || false,
        payment_method: subscription?.payment_method || null,
        planLimits: planLimits
      },
      user: userProfile
    });
  } catch (error) {
    console.error('Error getting current subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Get usage statistics
router.get('/usage', authenticateUser, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Initialize counters
    let filesProcessed = 0;
    let totalStorage = 0;
    let ocrCount = 0;
    let aiOperationsCount = 0;

    // Get file count this month and total storage
    try {
      const { data: filesThisMonth, error: filesError } = await supabaseAdmin
        .from('files')
        .select('id, size')
        .eq('user_id', req.user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (filesError) {
        console.error('Error getting files this month:', filesError);
      } else {
        filesProcessed = filesThisMonth?.length || 0;
      }

      // Get total storage used
      const { data: allFiles, error: storageError } = await supabaseAdmin
        .from('files')
        .select('size')
        .eq('user_id', req.user.id);

      if (storageError) {
        console.error('Error getting total storage:', storageError);
      } else {
        totalStorage = allFiles?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
      }
    } catch (error) {
      console.error('Error querying files table:', error);
    }

    // Get OCR operations this month
    try {
      const { data: ocrOperations, error: ocrError } = await supabaseAdmin
        .from('ocr_results')
        .select('id')
        .eq('user_id', req.user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (ocrError) {
        console.error('Error getting OCR operations:', ocrError);
      } else {
        ocrCount = ocrOperations?.length || 0;
      }
    } catch (error) {
      console.error('Error querying ocr_results table:', error);
      ocrCount = 0;
    }

    // Get AI operations this month
    try {
      const { data: summaries, error: summariesError } = await supabaseAdmin
        .from('summaries')
        .select('id')
        .eq('user_id', req.user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (summariesError) {
        console.error('Error getting summaries:', summariesError);
      } else {
        aiOperationsCount += summaries?.length || 0;
      }
    } catch (error) {
      console.error('Error querying summaries table:', error);
    }

    // Get chat messages this month
    try {
      const { data: chatMessages, error: chatError } = await supabaseAdmin
        .from('chat_messages')
        .select(`
          id,
          chat_sessions!inner(user_id)
        `)
        .eq('chat_sessions.user_id', req.user.id)
        .eq('role', 'user')
        .gte('created_at', startOfMonth.toISOString());

      if (chatError) {
        console.error('Error getting chat messages:', chatError);
      } else {
        aiOperationsCount += chatMessages?.length || 0;
      }
    } catch (error) {
      console.error('Error querying chat_messages table:', error);
    }

    res.json({
      usage: {
        files_processed: filesProcessed,
        storage_used: totalStorage,
        ocr_operations: ocrCount,
        ai_operations: aiOperationsCount,
        api_calls: 0
      },
      period: {
        start: startOfMonth.toISOString(),
        end: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting usage statistics:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// Get available payment methods for user's location
router.get('/payment-methods', authenticateUser, async (req, res) => {
  try {
    const countryCode = await currencyService.getCountryFromRequest(req);
    const paymentMethods = paymentService.getAvailablePaymentMethods(countryCode);
    
    res.json({ 
      paymentMethods,
      countryCode,
      recommendedGateway: paymentService.getPaymentGateway(countryCode)
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Create subscription with automatic gateway selection
router.post('/create', authenticateUser, async (req, res) => {
  try {
    const { plan, currency, countryCode } = req.body;

    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({ error: 'Invalid plan specified' });
    }

    // For free plan, just update database
    if (plan === 'free') {
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: req.user.id,
            plan: 'free',
            status: 'active',
            started_at: new Date().toISOString(),
            payment_method: null
          },
          { onConflict: 'user_id' }
        );

      if (updateError) {
        console.error('Subscription creation error:', updateError);
        return res.status(400).json({ error: updateError.message });
      }

      return res.json({ message: 'Free plan activated successfully' });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      return res.status(400).json({ error: 'User profile not found' });
    }

    // Detect country and currency
    const detectedCountry = countryCode || await currencyService.getCountryFromRequest(req);
    const detectedCurrency = currency || await currencyService.getCurrencyFromRequest(req);
    
    // Determine payment gateway
    const gateway = paymentService.getPaymentGateway(detectedCountry, detectedCurrency);
    
    console.log(`Creating subscription for user ${req.user.id} with ${gateway} gateway`);

    // Create subscription with appropriate gateway
    let result;
    try {
      result = await paymentService.createSubscription(
        req.user.id,
        plan,
        userProfile.email,
        userProfile.name,
        detectedCountry,
        detectedCurrency
      );
    } catch (createError) {
      console.error('Error in paymentService.createSubscription:', createError);
      return res.status(500).json({ 
        error: 'Failed to create subscription order',
        details: createError.message,
        gateway: gateway
      });
    }

    // Get pricing info
    const pricing = paymentService.getPlanPricing(plan, gateway, detectedCurrency, detectedCountry);

    res.json({
      success: true,
      gateway: gateway,
      subscriptionId: result.subscriptionId,
      approvalUrl: result.approvalUrl, // For PayPal
      orderId: result.id, // For Razorpay
      currency: pricing.currency,
      amount: pricing.amount,
      countryCode: detectedCountry,
      ...result
    });

  } catch (error) {
    console.error('Error creating subscription (outer):', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Verify payment (for Razorpay)
router.post('/verify-payment', authenticateUser, async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({ error: 'Invalid plan specified' });
    }

    const isValid = paymentService.verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Activate subscription after successful payment
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    const { data: subscription, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          user_id: req.user.id,
          plan: plan,
          status: 'active',
          payment_method: 'razorpay',
          payment_gateway: 'razorpay',
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          expires_at: periodEnd.toISOString(),
          started_at: now.toISOString(),
          updated_at: now.toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (updateError) {
      console.error('Error creating subscription:', updateError);
      return res.status(500).json({ 
        error: 'Payment verified but failed to create subscription',
        details: updateError.message 
      });
    }

    // Get plan pricing
    const pricing = paymentService.getPlanPricing(plan, 'razorpay', 'INR');

    // Record payment transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: req.user.id,
        subscription_id: subscription?.id,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        amount: pricing.amount,
        currency: pricing.currency,
        status: 'succeeded',
        payment_method: 'razorpay',
        metadata: {
          plan: plan,
          verified_at: now.toISOString()
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error recording payment transaction:', transactionError);
      console.error('Transaction error details:', JSON.stringify(transactionError, null, 2));
      // Log but don't fail - subscription is already created
    } else {
      console.log('Payment transaction recorded successfully:', transaction?.id);
    }

    // Send subscription upgrade email
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', req.user.id)
        .single();

      if (user) {
        const emailService = require('../services/emailService');
        await emailService.sendSubscriptionUpgradeEmail(
          user.email,
          user.name,
          plan,
          {
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending upgrade email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true, 
      message: 'Payment verified and subscription activated successfully',
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        expires_at: subscription.expires_at
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message 
    });
  }
});

// Capture PayPal order
router.post('/capture-paypal-order', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await paymentService.capturePayPalOrder(orderId);

    res.json({ 
      success: true, 
      message: 'Payment captured successfully',
      result 
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateUser, async (req, res) => {
  try {
    const { immediate = false } = req.body;

    // Get current subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const gateway = subscription.payment_method || 'paypal';
    const subscriptionId = subscription.razorpay_subscription_id || subscription.paypal_subscription_id;

    if (subscriptionId) {
      // Cancel with payment gateway
      await paymentService.cancelSubscription(subscriptionId, gateway, immediate);
    } else {
      // Just update database for free plans
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: immediate ? 'cancelled' : 'active',
          cancel_at_period_end: !immediate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    res.json({
      message: immediate 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at the end of the billing period'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticateUser, async (req, res) => {
  try {
    // Get current subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const gateway = subscription.payment_method || 'paypal';
    const subscriptionId = subscription.paypal_subscription_id;

    if (subscriptionId && gateway === 'paypal') {
      // Reactivate with PayPal
      await paymentService.activatePayPalSubscription(subscriptionId, 'Customer reactivation');
    }

    // Update database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Update subscription plan
router.put('/plan', authenticateUser, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({ error: 'Invalid plan specified' });
    }

    // Get current subscription
    const { data: currentSub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (subError || !currentSub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // For now, just update the plan in database
    // In production, you'd need to handle plan changes with payment gateways
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: plan,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Get billing history
router.get('/billing-history', authenticateUser, async (req, res) => {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error getting billing history:', error);
      return res.json({ history: [] });
    }

    res.json({ history: transactions || [] });
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.json({ history: [] });
  }
});

module.exports = router;
