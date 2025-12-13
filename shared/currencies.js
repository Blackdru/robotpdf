// Multi-currency pricing configuration
const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    position: 'before', // symbol position
    countries: ['US', 'PR', 'GU', 'VI', 'AS', 'MP']
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    position: 'after',
    countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU', 'SI', 'CY', 'MT', 'SK', 'EE', 'LV', 'LT']
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    position: 'before',
    countries: ['GB', 'UK']
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    position: 'before',
    countries: ['IN']
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    locale: 'en-CA',
    position: 'before',
    countries: ['CA']
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU',
    position: 'before',
    countries: ['AU']
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    position: 'before',
    countries: ['JP'],
    decimals: 0 // Yen doesn't use decimals
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    locale: 'pt-BR',
    position: 'before',
    countries: ['BR']
  },
  MXN: {
    code: 'MXN',
    symbol: 'MX$',
    name: 'Mexican Peso',
    locale: 'es-MX',
    position: 'before',
    countries: ['MX']
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    position: 'before',
    countries: ['SG']
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    locale: 'de-CH',
    position: 'before',
    countries: ['CH']
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    locale: 'zh-CN',
    position: 'before',
    countries: ['CN']
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    locale: 'sv-SE',
    position: 'after',
    countries: ['SE']
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    locale: 'nb-NO',
    position: 'after',
    countries: ['NO']
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    locale: 'da-DK',
    position: 'after',
    countries: ['DK']
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Zloty',
    locale: 'pl-PL',
    position: 'after',
    countries: ['PL']
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    locale: 'en-NZ',
    position: 'before',
    countries: ['NZ']
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    locale: 'en-ZA',
    position: 'before',
    countries: ['ZA']
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    locale: 'ar-AE',
    position: 'before',
    countries: ['AE']
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    locale: 'ar-SA',
    position: 'before',
    countries: ['SA']
  }
};

// Plan prices in INR (monthly) - Primary currency
// All users will pay in INR via Razorpay
const PLAN_PRICES = {
  pro: {
    INR: 16900, // ₹169 (in paise)
    USD: 200, // $2.00 (in cents) - for display only
    EUR: 200, // €2.00
    GBP: 170, // £1.70
    CAD: 270, // C$2.70
    AUD: 300, // A$3.00
    JPY: 300, // ¥300
    BRL: 1000, // R$10.00
    MXN: 3600, // MX$36
    SGD: 270, // S$2.70
    CHF: 180, // CHF 1.80
    CNY: 1400, // ¥14
    SEK: 2100, // 21 kr
    NOK: 2100, // 21 kr
    DKK: 1400, // 14 kr
    PLN: 800, // 8 zł
    NZD: 330, // NZ$3.30
    ZAR: 3600, // R36
    AED: 740, // 7.40 د.إ
    SAR: 750 // 7.50 ر.س
  },
  devs: {
    INR: 45900, // ₹459 (in paise)
    USD: 600, // $6.00 (in cents) - for display only
    EUR: 550, // €5.50
    GBP: 500, // £5.00
    CAD: 800, // C$8.00
    AUD: 900, // A$9.00
    JPY: 900, // ¥900
    BRL: 3000, // R$30.00
    MXN: 10800, // MX$108
    SGD: 800, // S$8.00
    CHF: 540, // CHF 5.40
    CNY: 4200, // ¥42
    SEK: 6300, // 63 kr
    NOK: 6300, // 63 kr
    DKK: 4200, // 42 kr
    PLN: 2400, // 24 zł
    NZD: 990, // NZ$9.90
    ZAR: 10800, // R108
    AED: 2200, // 22 د.إ
    SAR: 2250 // 22.50 ر.س
  }
};

// Stripe Price IDs for different currencies
// These should be created in Stripe Dashboard and added to environment variables
const STRIPE_PRICE_IDS = {
  pro: {
    USD: process.env.STRIPE_PRICE_PRO_USD || process.env.STRIPE_PRICE_ID_PRO || 'price_pro_usd',
    EUR: process.env.STRIPE_PRICE_PRO_EUR || 'price_pro_eur',
    GBP: process.env.STRIPE_PRICE_PRO_GBP || 'price_pro_gbp',
    INR: process.env.STRIPE_PRICE_PRO_INR || 'price_pro_inr',
    CAD: process.env.STRIPE_PRICE_PRO_CAD || 'price_pro_cad',
    AUD: process.env.STRIPE_PRICE_PRO_AUD || 'price_pro_aud',
    JPY: process.env.STRIPE_PRICE_PRO_JPY || 'price_pro_jpy',
    BRL: process.env.STRIPE_PRICE_PRO_BRL || 'price_pro_brl',
    MXN: process.env.STRIPE_PRICE_PRO_MXN || 'price_pro_mxn',
    SGD: process.env.STRIPE_PRICE_PRO_SGD || 'price_pro_sgd',
    CHF: process.env.STRIPE_PRICE_PRO_CHF || 'price_pro_chf',
    CNY: process.env.STRIPE_PRICE_PRO_CNY || 'price_pro_cny',
    SEK: process.env.STRIPE_PRICE_PRO_SEK || 'price_pro_sek',
    NOK: process.env.STRIPE_PRICE_PRO_NOK || 'price_pro_nok',
    DKK: process.env.STRIPE_PRICE_PRO_DKK || 'price_pro_dkk',
    PLN: process.env.STRIPE_PRICE_PRO_PLN || 'price_pro_pln',
    NZD: process.env.STRIPE_PRICE_PRO_NZD || 'price_pro_nzd',
    ZAR: process.env.STRIPE_PRICE_PRO_ZAR || 'price_pro_zar',
    AED: process.env.STRIPE_PRICE_PRO_AED || 'price_pro_aed',
    SAR: process.env.STRIPE_PRICE_PRO_SAR || 'price_pro_sar'
  },
  devs: {
    USD: process.env.STRIPE_PRICE_DEVS_USD || process.env.STRIPE_PRICE_ID_DEVS || 'price_devs_usd',
    EUR: process.env.STRIPE_PRICE_DEVS_EUR || 'price_devs_eur',
    GBP: process.env.STRIPE_PRICE_DEVS_GBP || 'price_devs_gbp',
    INR: process.env.STRIPE_PRICE_DEVS_INR || 'price_devs_inr',
    CAD: process.env.STRIPE_PRICE_DEVS_CAD || 'price_devs_cad',
    AUD: process.env.STRIPE_PRICE_DEVS_AUD || 'price_devs_aud',
    JPY: process.env.STRIPE_PRICE_DEVS_JPY || 'price_devs_jpy',
    BRL: process.env.STRIPE_PRICE_DEVS_BRL || 'price_devs_brl',
    MXN: process.env.STRIPE_PRICE_DEVS_MXN || 'price_devs_mxn',
    SGD: process.env.STRIPE_PRICE_DEVS_SGD || 'price_devs_sgd',
    CHF: process.env.STRIPE_PRICE_DEVS_CHF || 'price_devs_chf',
    CNY: process.env.STRIPE_PRICE_DEVS_CNY || 'price_devs_cny',
    SEK: process.env.STRIPE_PRICE_DEVS_SEK || 'price_devs_sek',
    NOK: process.env.STRIPE_PRICE_DEVS_NOK || 'price_devs_nok',
    DKK: process.env.STRIPE_PRICE_DEVS_DKK || 'price_devs_dkk',
    PLN: process.env.STRIPE_PRICE_DEVS_PLN || 'price_devs_pln',
    NZD: process.env.STRIPE_PRICE_DEVS_NZD || 'price_devs_nzd',
    ZAR: process.env.STRIPE_PRICE_DEVS_ZAR || 'price_devs_zar',
    AED: process.env.STRIPE_PRICE_DEVS_AED || 'price_devs_aed',
    SAR: process.env.STRIPE_PRICE_DEVS_SAR || 'price_devs_sar'
  }
};

// Helper functions
const getCurrencyByCountry = (countryCode) => {
  if (!countryCode) return CURRENCIES.USD;
  
  const upperCountry = countryCode.toUpperCase();
  
  for (const [code, currency] of Object.entries(CURRENCIES)) {
    if (currency.countries.includes(upperCountry)) {
      return currency;
    }
  }
  
  return CURRENCIES.USD; // Default to USD
};

const formatPrice = (amount, currencyCode = 'USD') => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const decimals = currency.decimals !== undefined ? currency.decimals : 2;
  
  // Convert from cents to main unit
  const value = amount / 100;
  
  // Format the number
  const formattedValue = value.toLocaleString(currency.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  // Position symbol
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedValue}`;
  } else {
    return `${formattedValue} ${currency.symbol}`;
  }
};

const getPlanPrice = (plan, currencyCode = 'USD') => {
  const prices = PLAN_PRICES[plan];
  if (!prices) return 0;
  
  return prices[currencyCode] || prices.USD;
};

const getStripePriceId = (plan, currencyCode = 'USD') => {
  const priceIds = STRIPE_PRICE_IDS[plan];
  if (!priceIds) return null;
  
  return priceIds[currencyCode] || priceIds.USD;
};

const getSupportedCurrencies = () => {
  return Object.keys(CURRENCIES);
};

const getCurrencyInfo = (currencyCode) => {
  return CURRENCIES[currencyCode] || CURRENCIES.USD;
};

// Detect user's currency based on browser/location
const detectUserCurrency = () => {
  // Try to get from browser locale
  try {
    const locale = navigator.language || navigator.userLanguage;
    const region = locale.split('-')[1];
    
    if (region) {
      const currency = getCurrencyByCountry(region);
      return currency.code;
    }
  } catch (error) {
    console.warn('Could not detect user currency:', error);
  }
  
  return 'USD'; // Default
};

// CommonJS exports for backend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CURRENCIES,
    PLAN_PRICES,
    STRIPE_PRICE_IDS,
    getCurrencyByCountry,
    formatPrice,
    getPlanPrice,
    getStripePriceId,
    getSupportedCurrencies,
    getCurrencyInfo,
    detectUserCurrency
  };
}

// ES6 exports for frontend
if (typeof window !== 'undefined') {
  window.CurrencyUtils = {
    CURRENCIES,
    PLAN_PRICES,
    getCurrencyByCountry,
    formatPrice,
    getPlanPrice,
    getSupportedCurrencies,
    getCurrencyInfo,
    detectUserCurrency
  };
}
