/**
 * IP Geolocation Service
 * Determines country and city from IP addresses
 */

const axios = require('axios');

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip) {
  if (!ip) return true;
  
  // IPv6 localhost
  if (ip === '::1') return true;
  
  // IPv4 localhost
  if (ip === '127.0.0.1') return true;
  
  // Private IPv4 ranges
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return true;
  
  // Link-local
  if (ip.startsWith('169.254.')) return true;
  
  return false;
}

/**
 * Get location data from IP address
 * Uses multiple free geolocation APIs with fallbacks
 * 
 * @param {string} ipAddress - IP address to lookup
 * @returns {Promise<{country: string, city: string, region: string}>}
 */
async function getLocationFromIP(ipAddress) {
  console.log('[Geolocation] Starting lookup for IP:', ipAddress);
  
  // Handle localhost and private IPs
  if (isPrivateIP(ipAddress)) {
    console.log('[Geolocation] Private/local IP detected, skipping lookup');
    return {
      country: 'Local Network',
      city: 'Local',
      region: 'Local',
      countryCode: 'LOCAL'
    };
  }

  // Try ip-api.com first (most reliable, 45 req/min, HTTP only but works server-side)
  try {
    console.log('[Geolocation] Trying ip-api.com...');
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000,
      params: {
        fields: 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp'
      }
    });

    console.log('[Geolocation] ip-api.com response:', JSON.stringify(response.data));

    if (response.data && response.data.status === 'success') {
      const result = {
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
      console.log('[Geolocation] Success from ip-api.com:', result.country, result.city);
      return result;
    } else {
      console.log('[Geolocation] ip-api.com returned non-success:', response.data.message);
    }
  } catch (error) {
    console.error('[Geolocation] ip-api.com error:', error.message);
  }

  // Fallback to ipwho.is (HTTPS, no rate limit advertised)
  try {
    console.log('[Geolocation] Trying ipwho.is...');
    const response = await axios.get(`https://ipwho.is/${ipAddress}`, {
      timeout: 5000
    });

    console.log('[Geolocation] ipwho.is response:', JSON.stringify(response.data));

    if (response.data && response.data.success !== false) {
      const result = {
        country: response.data.country || null,
        city: response.data.city || null,
        region: response.data.region || '',
        countryCode: response.data.country_code || '',
        timezone: response.data.timezone?.id || '',
        isp: response.data.connection?.isp || '',
        coordinates: {
          lat: response.data.latitude,
          lon: response.data.longitude
        }
      };
      console.log('[Geolocation] Success from ipwho.is:', result.country, result.city);
      return result;
    } else {
      console.log('[Geolocation] ipwho.is returned error:', response.data.message);
    }
  } catch (error) {
    console.error('[Geolocation] ipwho.is error:', error.message);
  }

  // Third fallback: freeipapi.com (HTTPS, free)
  try {
    console.log('[Geolocation] Trying freeipapi.com...');
    const response = await axios.get(`https://freeipapi.com/api/json/${ipAddress}`, {
      timeout: 5000
    });

    console.log('[Geolocation] freeipapi.com response:', JSON.stringify(response.data));

    if (response.data && response.data.countryName) {
      const result = {
        country: response.data.countryName || null,
        city: response.data.cityName || null,
        region: response.data.regionName || '',
        countryCode: response.data.countryCode || '',
        timezone: response.data.timeZone || '',
        isp: '',
        coordinates: {
          lat: response.data.latitude,
          lon: response.data.longitude
        }
      };
      console.log('[Geolocation] Success from freeipapi.com:', result.country, result.city);
      return result;
    }
  } catch (error) {
    console.error('[Geolocation] freeipapi.com error:', error.message);
  }

  // Fourth fallback: ipapi.co (30k/month limit)
  try {
    console.log('[Geolocation] Trying ipapi.co...');
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000
    });

    console.log('[Geolocation] ipapi.co response:', JSON.stringify(response.data));

    if (response.data && !response.data.error) {
      const result = {
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
      console.log('[Geolocation] Success from ipapi.co:', result.country, result.city);
      return result;
    } else {
      console.log('[Geolocation] ipapi.co returned error:', response.data.reason || response.data.error);
    }
  } catch (error) {
    console.error('[Geolocation] ipapi.co error:', error.message);
  }

  // If all APIs fail, return null
  console.log('[Geolocation] All APIs failed for IP:', ipAddress);
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
  console.log('[Geolocation Cache] Looking up IP:', ipAddress);
  
  // Check cache - but only if we have valid data (not null country)
  const cached = ipCache.get(ipAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.data.country) {
    console.log('[Geolocation Cache] Cache hit for IP:', ipAddress, '- Country:', cached.data.country);
    return cached.data;
  }

  // Fetch fresh data
  console.log('[Geolocation Cache] Cache miss, fetching fresh data for IP:', ipAddress);
  const location = await getLocationFromIP(ipAddress);
  
  // Only cache successful results (with country data)
  if (location && location.country && location.country !== 'Local Network') {
    console.log('[Geolocation Cache] Caching result for IP:', ipAddress, '- Country:', location.country);
    ipCache.set(ipAddress, {
      data: location,
      timestamp: Date.now()
    });

    // Clean old cache entries (keep last 1000)
    if (ipCache.size > 1000) {
      const firstKey = ipCache.keys().next().value;
      ipCache.delete(firstKey);
    }
  } else {
    console.log('[Geolocation Cache] Not caching null/local result for IP:', ipAddress);
  }

  return location;
}

module.exports = {
  getLocationFromIP,
  getLocationFromIPInfo,
  getLocationWithCache
};
