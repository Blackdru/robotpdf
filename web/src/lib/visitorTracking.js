/**
 * Enhanced Visitor Tracking Utility
 * Tracks page views, visitor sessions, and provides analytics
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generate a unique visitor fingerprint
export const generateVisitorId = () => {
  let visitorId = localStorage.getItem('visitor_id');
  
  if (!visitorId) {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2, 15)
    };
    
    const fingerprintString = JSON.stringify(fingerprint);
    visitorId = btoa(fingerprintString).substring(0, 64);
    localStorage.setItem('visitor_id', visitorId);
  }
  
  return visitorId;
};

// Parse user agent to get browser and OS information
export const parseUserAgent = (userAgent) => {
  const ua = userAgent || navigator.userAgent;
  
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  let deviceType = 'desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  return { browser, os, deviceType };
};

// Get page category from URL
export const getPageCategory = (pageUrl) => {
  const url = new URL(pageUrl, window.location.origin);
  const path = url.pathname;
  
  // Tool pages
  const toolPages = [
    'merge-pdf', 'split-pdf', 'compress-pdf', 'image-to-pdf', 'html-to-pdf',
    'pdf-to-word', 'word-to-pdf', 'pdf-to-excel', 'excel-to-pdf',
    'password-remover', 'text-to-pdf', 'image-compress'
  ];
  
  if (path === '/' || path === '') return 'home';
  if (path === '/tools') return 'tools_menu';
  if (path === '/advanced-tools') return 'advanced_tools';
  if (path === '/pricing') return 'pricing';
  if (toolPages.some(tool => path.includes(tool))) return 'tool_page';
  if (path.includes('/ai-')) return 'ai_tool';
  if (path.includes('/developers')) return 'developer';
  if (path.includes('/contact')) return 'contact';
  
  return 'other';
};

// Track visitor visit to a page
export const trackVisitor = async (pageUrl, pageTitle) => {
  try {
    const visitorId = generateVisitorId();
    const { browser, os, deviceType } = parseUserAgent(navigator.userAgent);
    const referrer = document.referrer || 'direct';
    const pageCategory = getPageCategory(pageUrl);
    
    const trackingData = {
      visitorId,
      userAgent: navigator.userAgent,
      browser,
      os,
      deviceType,
      referrer,
      pageUrl,
      pageTitle,
      pageCategory
    };
    
    const response = await fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData)
    });
    
    if (!response.ok) {
      console.warn('Failed to track visitor:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return null;
  }
};

// Track page view (can be called multiple times)
export const trackPageView = async (pageUrl, pageTitle) => {
  try {
    const visitorId = generateVisitorId();
    const pageCategory = getPageCategory(pageUrl);
    
    const response = await fetch(`${API_URL}/analytics/page-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        pageUrl,
        pageTitle,
        pageCategory,
        referrer: document.referrer || 'direct'
      })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error tracking page view:', error);
    return null;
  }
};

// Check if this is a unique visit (not tracked in current session)
export const isUniqueSession = () => {
  return !sessionStorage.getItem('visitor_tracked');
};

// Check if page was tracked in this session
export const isPageTracked = (pageUrl) => {
  const trackedPages = JSON.parse(sessionStorage.getItem('tracked_pages') || '[]');
  return trackedPages.includes(pageUrl);
};

// Mark page as tracked
export const markPageTracked = (pageUrl) => {
  const trackedPages = JSON.parse(sessionStorage.getItem('tracked_pages') || '[]');
  if (!trackedPages.includes(pageUrl)) {
    trackedPages.push(pageUrl);
    sessionStorage.setItem('tracked_pages', JSON.stringify(trackedPages));
  }
};

// Mark session as tracked
export const markSessionTracked = () => {
  sessionStorage.setItem('visitor_tracked', 'true');
};

// Track page view only once per session (for visitor counting)
export const trackPageViewOnce = async (pageUrl, pageTitle) => {
  const isNewSession = isUniqueSession();
  
  // Always call trackVisitor first - it creates new visitor OR updates existing
  // This ensures visitor record exists before we track page views
  const result = await trackVisitor(pageUrl, pageTitle);
  
  // Mark session as tracked only on first visit
  if (isNewSession && result && result.success) {
    markSessionTracked();
  }
  
  // Then track the page view for detailed analytics
  await trackPageView(pageUrl, pageTitle);
  
  return result || { success: true, alreadyTracked: !isNewSession };
};

// Track tool usage (when a tool is actually used)
export const trackToolUsage = async (toolId, toolName) => {
  try {
    const visitorId = generateVisitorId();
    
    const response = await fetch(`${API_URL}/analytics/tool-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, toolId, toolName })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error tracking tool usage:', error);
    return null;
  }
};
