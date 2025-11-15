const express = require('express');
const paymentService = require('../services/paymentService');

const router = express.Router();

// Razorpay webhook endpoint
router.post('/razorpay', express.json(), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  try {
    // Verify webhook signature
    const isValid = await paymentService.verifyWebhookSignature(
      'razorpay',
      req.body,
      signature
    );
    
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return res.status(400).send('Invalid signature');
    }
    
    console.log(`Received Razorpay webhook: ${req.body.event}`);
    
    // Handle the event
    await paymentService.handleWebhook('razorpay', req.body);
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// PayPal webhook endpoint
router.post('/paypal', express.json(), async (req, res) => {
  try {
    // Verify webhook signature
    const isValid = await paymentService.verifyWebhookSignature(
      'paypal',
      req.body,
      null,
      req.headers
    );
    
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return res.status(400).send('Invalid signature');
    }
    
    console.log(`Received PayPal webhook: ${req.body.event_type}`);
    
    // Handle the event
    await paymentService.handleWebhook('paypal', req.body);
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Legacy Stripe webhook endpoint (for backward compatibility during migration)
// This can be removed once all Stripe subscriptions are migrated
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Received Stripe webhook - Stripe is deprecated, please migrate to Razorpay or PayPal');
  res.status(410).json({ 
    error: 'Stripe integration has been removed. Please use Razorpay (India) or PayPal (International).' 
  });
});

module.exports = router;
