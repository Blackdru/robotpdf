/**
 * IP Geolocation Service
 * Determines country and city from IP addresses
 */

const axios = require('axios');

/**
 * Get location data from IP address
 * Uses ip-api.com (free, no API key required, 45 requests/minute)
 * 
 * @param {string} ipAddress - IP address to lookup
 * @returns {Promise<{country: string, city: string, region: string}>}
 */
async function getLocationFromIP(ipAddress) {
  // Handle localhost and private IPs
  if (!ipAddress || 
      ipAddress === '::1' || 
      ipAddress === '127.0.0.1' || 
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')) {
    return {
      country: 'Local Network',
      city: 'Local',
      region: 'Local',
      countryCode: 'LOCAL'
    };
  }

  try {
    // Try ip-api.com first (free tier, no key required)
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000,
      params: {
        fields: 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp'
      }
    });

    if (response.data.status === 'success') {
      return {
        country: response.data.country || null,
        city: response.data.city || null,
        region: response.data.regionName || response.data.region || '',
        countryCode: response.data.countryCode || '',
        timezone: response.data.timezone || '',
        isp: response.data.isp || '',
        coordinates: {
          lat: response.data.lat,
          lon: response.data.lon
        }
      };
    }
  } catch (error) {
    console.error('ip-api.com error:', error.message);
  }

  // Fallback to ipapi.co (free tier, no key required, 30k requests/month)
  try {
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000
    });

    if (response.data && !response.data.error) {
      return {
        country: response.data.country_name || null,
        city: response.data.city || null,
        region: response.data.region || '',
        countryCode: response.data.country_code || '',
        timezone: response.data.timezone || '',
        isp: response.data.org || '',
        coordinates: {
          lat: response.data.latitude,
          lon: response.data.longitude
        }
      };
    }
  } catch (error) {
    console.error('ipapi.co error:', error.message);
  }

  // If all APIs fail, return null instead of 'Unknown'
  return {
    country: null,
    city: null,
    region: '',
    countryCode: ''
  };
}

/**
 * Get location data from IP using ipinfo.io (alternative service)
 * Requires API token (free tier: 50k requests/month)
 * 
 * @param {string} ipAddress - IP address to lookup
 * @param {string} apiToken - IPInfo.io API token
 * @returns {Promise<{country: string, city: string, region: string}>}
 */
async function getLocationFromIPInfo(ipAddress, apiToken) {
  if (!apiToken) {
    console.warn('IPInfo.io API token not provided');
    return getLocationFromIP(ipAddress); // Fallback to ip-api.com
  }

  try {
    const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`, {
      timeout: 3000,
      params: { token: apiToken }
    });

    if (response.data) {
      const [city, region] = (response.data.region || '').split(',');
      return {
        country: response.data.country || 'Unknown',
        city: response.data.city || city || 'Unknown',
        region: region?.trim() || '',
        countryCode: response.data.country || '',
        timezone: response.data.timezone || '',
        coordinates: response.data.loc ? {
          lat: parseFloat(response.data.loc.split(',')[0]),
          lon: parseFloat(response.data.loc.split(',')[1])
        } : null
      };
    }
  } catch (error) {
    console.error('IPInfo.io geolocation error:', error.message);
    return getLocationFromIP(ipAddress); // Fallback
  }
}

/**
 * Get location with caching to reduce API calls
 */
const ipCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getLocationWithCache(ipAddress) {
  // Check cache
  const cached = ipCache.get(ipAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch fresh data
  const location = await getLocationFromIP(ipAddress);
  
  // Store in cache
  ipCache.set(ipAddress, {
    data: location,
    timestamp: Date.now()
  });

  // Clean old cache entries (keep last 1000)
  if (ipCache.size > 1000) {
    const firstKey = ipCache.keys().next().value;
    ipCache.delete(firstKey);
  }

  return location;
}

module.exports = {
  getLocationFromIP,
  getLocationFromIPInfo,
  getLocationWithCache
};
