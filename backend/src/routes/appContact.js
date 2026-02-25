const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// Submit app contact form (public endpoint)
router.post('/submit', async (req, res) => {
  try {
    const { name, email, mobile, appName, message } = req.body;

    // Validation
    if (!name || !email || !appName || !message) {
      return res.status(400).json({ 
        error: 'Name, email, app name, and message are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    // Mobile validation (optional, but if provided must be valid)
    if (mobile && mobile.trim()) {
      const mobileRegex = /^[\d\s\-\+\(\)]+$/;
      if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ 
          error: 'Invalid mobile number format' 
        });
      }
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { data, error } = await supabaseAdmin
      .from('app_contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile?.trim() || null,
        app_name: appName.trim(),
        message: message.trim(),
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('App contact submission error:', error);
      return res.status(500).json({ 
        error: 'Failed to submit app contact form' 
      });
    }

    res.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      submission: {
        id: data.id,
        created_at: data.created_at
      }
    });
  } catch (error) {
    console.error('App contact submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit app contact form' 
    });
  }
});

module.exports = router;
