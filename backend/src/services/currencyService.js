const { 
  CURRENCIES, 
  getCurrencyByCountry, 
  formatPrice, 
  getPlanPrice,
  getStripePriceId,
  getSupportedCurrencies,
  getCurrencyInfo
} = require('../../../shared/currencies');

class CurrencyService {
  /**
   * Detect currency from IP address using a geolocation service
   * You can use services like ipapi.co, ip-api.com, or ipgeolocation.io
   */
  async detectCurrencyFromIP(ipAddress) {
    try {
      // Using ip-api.com (free, no API key required)
      const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,countryCode`);
      const data = await response.json();
      
      if (data.status === 'success' && data.countryCode) {
        const currency = getCurrencyByCountry(data.countryCode);
        return currency.code;
      }
    } catch (error) {
      console.warn('Error detecting currency from IP:', error);
    }
    
    return 'USD'; // Default fallback
  }

  /**
   * Get country code from request headers or IP
   * Enhanced with multiple detection methods
   */
  async getCountryFromRequest(req) {
    try {
      console.log('\n=== LOCATION DETECTION START ===');
      
      // Log all available headers for debugging
      console.log('Available headers:', {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'cf-ipcountry': req.headers['cf-ipcountry'],
        'accept-language': req.headers['accept-language']
      });
      
      // Get IP address from various sources
      const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       req.headers['x-real-ip'] ||
                       req.connection?.remoteAddress ||
                       req.socket?.remoteAddress ||
                       req.ip;

      console.log('Raw IP detected:', ipAddress);

      // Check for localhost
      const isLocalhost = !ipAddress || 
                         ipAddress === '::1' || 
                         ipAddress === '127.0.0.1' || 
                         ipAddress.includes('::ffff:127.0.0.1') ||
                         ipAddress.includes('::ffff:0.0.0.0');
      
      if (isLocalhost) {
        console.log('⚠️  Localhost detected, defaulting to IN for testing');
        console.log('=== LOCATION DETECTION END: IN (localhost) ===\n');
        return 'IN';
      }

      // Clean IP address
      const cleanIp = ipAddress.replace('::ffff:', '').trim();
      console.log('Clean IP:', cleanIp);
      
      // Method 0: Check CloudFlare header first (fastest)
      if (req.headers['cf-ipcountry'] && req.headers['cf-ipcountry'] !== 'XX') {
        const countryCode = req.headers['cf-ipcountry'];
        console.log(`✓ Location detected via CloudFlare header: ${countryCode}`);
        console.log('=== LOCATION DETECTION END ===\n');
        return countryCode;
      }

      // Method 1: Try ip-api.com (no rate limit for non-commercial)
      try {
        const fetch = require('node-fetch');
        console.log('Trying ip-api.com...');
        
        const response = await Promise.race([
          fetch(`http://ip-api.com/json/${cleanIp}?fields=status,countryCode,country,query`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (response.ok) {
          const data = await response.json();
          console.log('ip-api.com response:', data);
          
          if (data.status === 'success' && data.countryCode) {
            console.log(`✓ Location detected via ip-api.com: ${data.countryCode} (${data.country})`);
            console.log('=== LOCATION DETECTION END ===\n');
            return data.countryCode;
          }
        }
      } catch (error) {
        console.warn('✗ ip-api.com failed:', error.message);
      }

      // Method 2: Try ipapi.co (backup)
      try {
        const fetch = require('node-fetch');
        console.log('Trying ipapi.co...');
        
        const response = await Promise.race([
          fetch(`https://ipapi.co/${cleanIp}/json/`, {
            headers: {
              'User-Agent': 'RobotPDF/1.0'
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (response.ok) {
          const data = await response.json();
          console.log('ipapi.co response:', data);
          
          if (data.country_code && data.country_code !== 'undefined') {
            console.log(`✓ Location detected via ipapi.co: ${data.country_code} (${data.country_name})`);
            console.log('=== LOCATION DETECTION END ===\n');
            return data.country_code;
          }
        }
      } catch (error) {
        console.warn('✗ ipapi.co failed:', error.message);
      }

      // Method 3: Try Accept-Language header
      const acceptLanguage = req.headers['accept-language'];
      if (acceptLanguage) {
        console.log('Trying Accept-Language header:', acceptLanguage);
        const locale = acceptLanguage.split(',')[0];
        const region = locale.split('-')[1];
        
        if (region && region.length === 2) {
          const countryCode = region.toUpperCase();
          console.log(`✓ Location detected via Accept-Language: ${countryCode}`);
          console.log('=== LOCATION DETECTION END ===\n');
          return countryCode;
        }
      }

      // Default to India if all methods fail
      console.log('⚠️  All detection methods failed, defaulting to IN');
      console.log('=== LOCATION DETECTION END: IN (default) ===\n');
      return 'IN';
      
    } catch (error) {
      console.error('❌ Error in getCountryFromRequest:', error);
      console.log('=== LOCATION DETECTION END: IN (error) ===\n');
      return 'IN';
    }
  }

  /**
   * Get currency from request headers or IP
   */
  async getCurrencyFromRequest(req) {
    // First, check if user has a preferred currency stored
    if (req.user && req.user.preferred_currency) {
      return req.user.preferred_currency;
    }

    // Get country code
    const countryCode = await this.getCountryFromRequest(req);
    
    // Get currency for country
    const currency = getCurrencyByCountry(countryCode);
    if (currency) {
      return currency.code;
    }

    return 'USD'; // Default fallback
  }

  /**
   * Get pricing information for all plans in a specific currency
   */
  getPricingForCurrency(currencyCode = 'USD') {
    const plans = ['basic', 'pro'];
    const pricing = {};

    plans.forEach(plan => {
      const amount = getPlanPrice(plan, currencyCode);
      const stripePriceId = getStripePriceId(plan, currencyCode);
      
      pricing[plan] = {
        amount,
        formatted: formatPrice(amount, currencyCode),
        currency: currencyCode,
        stripePriceId
      };
    });

    return pricing;
  }

  /**
   * Get all supported currencies with their info
   */
  getAllCurrencies() {
    const currencies = getSupportedCurrencies();
    return currencies.map(code => ({
      code,
      ...getCurrencyInfo(code)
    }));
  }

  /**
   * Format a price in a specific currency
   */
  formatPrice(amount, currencyCode = 'USD') {
    return formatPrice(amount, currencyCode);
  }

  /**
   * Get Stripe price ID for a plan and currency
   */
  getStripePriceId(plan, currencyCode = 'USD') {
    return getStripePriceId(plan, currencyCode);
  }

  /**
   * Validate if a currency is supported
   */
  isCurrencySupported(currencyCode) {
    return getSupportedCurrencies().includes(currencyCode);
  }

  /**
   * Get currency info
   */
  getCurrencyInfo(currencyCode) {
    return getCurrencyInfo(currencyCode);
  }

  /**
   * Convert amount between currencies (simplified - in production use a real exchange rate API)
   * This is just for display purposes, actual billing is done in the selected currency
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    // In production, use a service like exchangerate-api.com or fixer.io
    // For now, we'll use approximate rates based on our pricing
    const fromPrice = getPlanPrice('basic', fromCurrency);
    const toPrice = getPlanPrice('basic', toCurrency);
    
    if (fromPrice === 0) return amount;
    
    const rate = toPrice / fromPrice;
    return Math.round(amount * rate);
  }
}

module.exports = new CurrencyService();
