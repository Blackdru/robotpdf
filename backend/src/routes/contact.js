const express = require('express')
const router = express.Router()
const { supabase, supabaseAdmin } = require('../config/supabase')
const { optionalAuth } = require('../middleware/auth')

// Submit contact form (public endpoint)
router.post('/submit', optionalAuth, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      })
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']

    // Insert contact submission
    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || null,
        message: message.trim(),
        user_id: req.user?.id || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      console.error('Contact submission error:', error)
      return res.status(500).json({ 
        error: 'Failed to submit contact form' 
      })
    }

    res.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      submission: {
        id: data.id,
        created_at: data.created_at
      }
    })
  } catch (error) {
    console.error('Contact submission error:', error)
    res.status(500).json({ 
      error: 'Failed to submit contact form' 
    })
  }
})

// Get all contact submissions (admin only)
router.get('/submissions', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    let query = supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Get submissions error:', error)
      return res.status(500).json({ error: 'Failed to fetch submissions' })
    }

    res.json({
      submissions: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// Update submission status (admin only)
router.patch('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update submission error:', error)
      return res.status(500).json({ error: 'Failed to update submission' })
    }

    res.json({
      success: true,
      submission: data
    })
  } catch (error) {
    console.error('Update submission error:', error)
    res.status(500).json({ error: 'Failed to update submission' })
  }
})

// Get user's own submissions
router.get('/my-submissions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get user submissions error:', error)
      return res.status(500).json({ error: 'Failed to fetch submissions' })
    }

    res.json({
      submissions: data
    })
  } catch (error) {
    console.error('Get user submissions error:', error)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

module.exports = router
