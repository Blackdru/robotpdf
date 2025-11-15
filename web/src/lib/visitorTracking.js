/**
 * Visitor Tracking Utility
 * Generates unique visitor fingerprints and tracks page visits
 */

import { api } from './api';

// Generate a unique visitor fingerprint
export const generateVisitorId = () => {
  // Check if visitor ID already exists in localStorage
  let visitorId = localStorage.getItem('visitor_id');
  
  if (!visitorId) {
    // Create a new unique visitor ID based on browser fingerprint
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
    
    // Create a hash from the fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    visitorId = btoa(fingerprintString).substring(0, 64); // Base64 encode and truncate
    
    // Store in localStorage for future visits
    localStorage.setItem('visitor_id', visitorId);
  }
  
  return visitorId;
};

// Parse user agent to get browser and OS information
export const parseUserAgent = (userAgent) => {
  const ua = userAgent || navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let deviceType = 'desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  return { browser, os, deviceType };
};

// Track visitor visit to a page
export const trackVisitor = async (pageUrl, pageTitle) => {
  try {
    const visitorId = generateVisitorId();
    const { browser, os, deviceType } = parseUserAgent(navigator.userAgent);
    
    // Get referrer
    const referrer = document.referrer || 'direct';
    
    // Get location (optional - can be determined by IP on backend)
    // For privacy, we don't get exact location on frontend
    
    const trackingData = {
      visitorId,
      userAgent: navigator.userAgent,
      browser,
      os,
      deviceType,
      referrer,
      pageUrl,
      pageTitle
    };
    
    // Send tracking data to backend
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    });
    
    if (!response.ok) {
      console.warn('Failed to track visitor:', await response.text());
      return null;
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return null;
  }
};

// Check if this is a unique visit (not tracked in current session)
export const isUniqueSession = () => {
  const sessionTracked = sessionStorage.getItem('visitor_tracked');
  return !sessionTracked;
};

// Mark session as tracked
export const markSessionTracked = () => {
  sessionStorage.setItem('visitor_tracked', 'true');
};

// Track page view only once per session
export const trackPageViewOnce = async (pageUrl, pageTitle) => {
  if (isUniqueSession()) {
    const result = await trackVisitor(pageUrl, pageTitle);
    if (result && result.success) {
      markSessionTracked();
      console.log('Visitor tracked:', result);
    }
    return result;
  }
  return null;
};
