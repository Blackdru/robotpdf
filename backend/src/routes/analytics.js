const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { getLocationWithCache } = require('../services/geolocation');

const router = express.Router();

/**
 * Track visitor to tools page
 * POST /api/analytics/track
 * Public endpoint - no authentication required
 */
router.post('/track', async (req, res) => {
  try {
    const {
      visitorId,
      userAgent,
      browser,
      os,
      deviceType,
      referrer,
      country,
      city,
      pageUrl,
      pageTitle
    } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: 'Visitor ID is required' });
    }

    // Get IP address from request - check multiple headers for different proxy setups
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    const trueClientIp = req.headers['true-client-ip'];
    const xClientIp = req.headers['x-client-ip'];
    const forwardedIp = req.headers['forwarded'];
    
    // Log all relevant headers for debugging
    console.log('[Analytics] IP Detection headers:');
    console.log('  x-forwarded-for:', forwardedFor);
    console.log('  x-real-ip:', realIp);
    console.log('  cf-connecting-ip:', cfConnectingIp);
    console.log('  true-client-ip:', trueClientIp);
    console.log('  x-client-ip:', xClientIp);
    console.log('  forwarded:', forwardedIp);
    console.log('  req.ip:', req.ip);
    console.log('  connection.remoteAddress:', req.connection?.remoteAddress);
    
    // Priority: Cloudflare > x-forwarded-for (first IP) > x-real-ip > req.ip > socket
    let ipAddress = cfConnectingIp ||
                    trueClientIp ||
                    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
                    realIp ||
                    xClientIp ||
                    req.ip ||
                    req.connection?.remoteAddress ||
                    req.socket?.remoteAddress;

    console.log('[Analytics] Selected IP before cleaning:', ipAddress);

    // Clean IP address (remove ::ffff: prefix for IPv4-mapped IPv6)
    if (ipAddress && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }
    
    console.log('[Analytics] Final IP for geolocation:', ipAddress);

    // Get location from IP address
    let locationData = { country: null, city: null };
    
    // Check if it's a local/private IP
    const isLocalIP = !ipAddress || 
                      ipAddress === '127.0.0.1' || 
                      ipAddress === '::1' ||
                      ipAddress.startsWith('192.168.') ||
                      ipAddress.startsWith('10.') ||
                      ipAddress.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);
    
    if (isLocalIP) {
      console.log('[Analytics] Local IP detected, fetching public IP from external service...');
      // For local development or when behind NAT, fetch real public IP
      try {
        const axios = require('axios');
        const publicIpResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
        if (publicIpResponse.data && publicIpResponse.data.ip) {
          ipAddress = publicIpResponse.data.ip;
          console.log('[Analytics] Got public IP from ipify:', ipAddress);
        }
      } catch (err) {
        console.log('[Analytics] Could not fetch public IP:', err.message);
      }
    }
    
    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      try {
        console.log('[Analytics] Getting location for IP:', ipAddress);
        locationData = await getLocationWithCache(ipAddress);
        console.log('[Analytics] Location data retrieved:', locationData);
      } catch (error) {
        console.error('[Analytics] Error getting location for IP', ipAddress, ':', error);
      }
    } else {
      console.log('[Analytics] Skipping location lookup - no valid IP available');
    }

    // Check if visitor already exists
    const { data: existingVisitor, error: checkError } = await supabaseAdmin
      .from('visitor_analytics')
      .select('*')
      .eq('visitor_id', visitorId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking visitor:', checkError);
      return res.status(500).json({ error: 'Failed to check visitor' });
    }

    let visitorData;

    if (existingVisitor) {
      // Update existing visitor
      const { data, error } = await supabaseAdmin
        .from('visitor_analytics')
        .update({
          last_visit_at: new Date().toISOString(),
          visit_count: existingVisitor.visit_count + 1,
          user_agent: userAgent || existingVisitor.user_agent,
          browser: browser || existingVisitor.browser,
          os: os || existingVisitor.os,
          device_type: deviceType || existingVisitor.device_type,
          referrer: referrer || existingVisitor.referrer,
          country: locationData.country || country || existingVisitor.country,
          city: locationData.city || city || existingVisitor.city,
          ip_address: ipAddress
        })
        .eq('visitor_id', visitorId)
        .select()
        .single();

      if (error) {
        console.error('Error updating visitor:', error);
        return res.status(500).json({ error: 'Failed to update visitor data' });
      }

      visitorData = data;
    } else {
      // Create new visitor
      const { data, error } = await supabaseAdmin
        .from('visitor_analytics')
        .insert([{
          visitor_id: visitorId,
          user_agent: userAgent,
          browser: browser,
          os: os,
          device_type: deviceType,
          referrer: referrer,
          country: locationData.country || country,
          city: locationData.city || city,
          ip_address: ipAddress,
          first_visit_at: new Date().toISOString(),
          last_visit_at: new Date().toISOString(),
          visit_count: 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating visitor:', error);
        return res.status(500).json({ error: 'Failed to create visitor record' });
      }

      visitorData = data;
    }

    // Track page view
    if (pageUrl) {
      const { error: pageViewError } = await supabaseAdmin
        .from('page_views')
        .insert([{
          visitor_id: visitorId,
          page_url: pageUrl,
          page_title: pageTitle,
          visited_at: new Date().toISOString()
        }]);

      if (pageViewError) {
        console.error('Error tracking page view:', pageViewError);
        // Don't fail the request if page view tracking fails
      }
    }

    res.json({
      success: true,
      message: 'Visitor tracked successfully',
      isNewVisitor: !existingVisitor,
      visitCount: visitorData.visit_count
    });
  } catch (error) {
    console.error('Track visitor error:', error);
    res.status(500).json({ error: 'Failed to track visitor' });
  }
});

/**
 * Get visitor analytics dashboard data
 * GET /api/analytics/dashboard
 * Admin only
 */
router.get('/dashboard', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total unique visitors
    const { count: totalVisitors } = await supabaseAdmin
      .from('visitor_analytics')
      .select('*', { count: 'exact', head: true });

    // Get new visitors in time range
    const { count: newVisitors } = await supabaseAdmin
      .from('visitor_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('first_visit_at', startDate.toISOString());

    // Get returning visitors (visit_count > 1) in time range
    const { count: returningVisitors } = await supabaseAdmin
      .from('visitor_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('last_visit_at', startDate.toISOString())
      .gt('visit_count', 1);

    // Get total page views in time range
    const { count: totalPageViews } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('visited_at', startDate.toISOString());

    // Get visitors by device type
    const { data: deviceData } = await supabaseAdmin
      .from('visitor_analytics')
      .select('device_type')
      .gte('last_visit_at', startDate.toISOString());

    const deviceStats = deviceData?.reduce((acc, item) => {
      const device = item.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Get visitors by browser
    const { data: browserData } = await supabaseAdmin
      .from('visitor_analytics')
      .select('browser')
      .gte('last_visit_at', startDate.toISOString());

    const browserStats = browserData?.reduce((acc, item) => {
      const browser = item.browser || 'unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    // Get visitors by country
    const { data: countryData } = await supabaseAdmin
      .from('visitor_analytics')
      .select('country')
      .gte('last_visit_at', startDate.toISOString())
      .not('country', 'is', null);

    const countryStats = countryData?.reduce((acc, item) => {
      const country = item.country;
      if (country && country !== 'Unknown' && country !== 'unknown') {
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {});

    // Sort and get top countries
    const topCountries = Object.entries(countryStats || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Get daily visitors trend (last 30 days)
    const { data: dailyTrend } = await supabaseAdmin
      .from('visitor_analytics')
      .select('first_visit_at')
      .gte('first_visit_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('first_visit_at', { ascending: true });

    // Group by date
    const dailyVisitors = dailyTrend?.reduce((acc, item) => {
      const date = new Date(item.first_visit_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Fill in missing dates with 0
    const dailyVisitorsArray = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyVisitorsArray.push({
        date,
        count: dailyVisitors?.[date] || 0
      });
    }

    res.json({
      summary: {
        totalVisitors: totalVisitors || 0,
        newVisitors: newVisitors || 0,
        returningVisitors: returningVisitors || 0,
        totalPageViews: totalPageViews || 0,
        avgVisitsPerVisitor: totalVisitors > 0 
          ? ((totalPageViews || 0) / totalVisitors).toFixed(2)
          : 0
      },
      deviceStats: deviceStats || {},
      browserStats: browserStats || {},
      topCountries: topCountries,
      dailyTrend: dailyVisitorsArray,
      timeRange
    });
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

/**
 * Get detailed visitor list
 * GET /api/analytics/visitors
 * Admin only
 */
router.get('/visitors', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'last_visit_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('visitor_analytics')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      visitors: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

/**
 * Get visitor details by ID
 * GET /api/analytics/visitors/:visitorId
 * Admin only
 */
router.get('/visitors/:visitorId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { visitorId } = req.params;

    // Get visitor data
    const { data: visitor, error: visitorError } = await supabaseAdmin
      .from('visitor_analytics')
      .select('*')
      .eq('visitor_id', visitorId)
      .single();

    if (visitorError || !visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Get page view history
    const { data: pageViews, error: pageViewError } = await supabaseAdmin
      .from('page_views')
      .select('*')
      .eq('visitor_id', visitorId)
      .order('visited_at', { ascending: false })
      .limit(100);

    if (pageViewError) {
      console.error('Error fetching page views:', pageViewError);
    }

    res.json({
      visitor,
      pageViews: pageViews || []
    });
  } catch (error) {
    console.error('Get visitor details error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor details' });
  }
});

module.exports = router;
