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
  basic: {
    INR: 9900, // ₹99 (in paise)
    USD: 100, // $1.00 (in cents) - for display only
    EUR: 100, // €1.00
    GBP: 100, // £1.00
    CAD: 135, // C$1.35
    AUD: 150, // A$1.50
    JPY: 150, // ¥150
    BRL: 500, // R$5.00
    MXN: 1800, // MX$18
    SGD: 135, // S$1.35
    CHF: 90, // CHF 0.90
    CNY: 700, // ¥7
    SEK: 1050, // 10.50 kr
    NOK: 1050, // 10.50 kr
    DKK: 700, // 7 kr
    PLN: 400, // 4 zł
    NZD: 165, // NZ$1.65
    ZAR: 1800, // R18
    AED: 370, // 3.70 د.إ
    SAR: 375 // 3.75 ر.س
  },
  pro: {
    INR: 49900, // ₹499 (in paise)
    USD: 1000, // $10.00 (in cents) - for display only
    EUR: 1000, // €10.00
    GBP: 900, // £9.00
    CAD: 1350, // C$13.50
    AUD: 1500, // A$15.00
    JPY: 1500, // ¥1500
    BRL: 5000, // R$50.00
    MXN: 18000, // MX$180
    SGD: 1350, // S$13.50
    CHF: 900, // CHF 9.00
    CNY: 7000, // ¥70
    SEK: 10500, // 105 kr
    NOK: 10500, // 105 kr
    DKK: 7000, // 70 kr
    PLN: 4000, // 40 zł
    NZD: 1650, // NZ$16.50
    ZAR: 18000, // R180
    AED: 3700, // 37 د.إ
    SAR: 3750 // 37.50 ر.س
  }
};

// Stripe Price IDs for different currencies
// These should be created in Stripe Dashboard and added to environment variables
const STRIPE_PRICE_IDS = {
  basic: {
    USD: process.env.STRIPE_PRICE_BASIC_USD || process.env.STRIPE_PRICE_ID_PRO || 'price_basic_usd',
    EUR: process.env.STRIPE_PRICE_BASIC_EUR || 'price_basic_eur',
    GBP: process.env.STRIPE_PRICE_BASIC_GBP || 'price_basic_gbp',
    INR: process.env.STRIPE_PRICE_BASIC_INR || 'price_basic_inr',
    CAD: process.env.STRIPE_PRICE_BASIC_CAD || 'price_basic_cad',
    AUD: process.env.STRIPE_PRICE_BASIC_AUD || 'price_basic_aud',
    JPY: process.env.STRIPE_PRICE_BASIC_JPY || 'price_basic_jpy',
    BRL: process.env.STRIPE_PRICE_BASIC_BRL || 'price_basic_brl',
    MXN: process.env.STRIPE_PRICE_BASIC_MXN || 'price_basic_mxn',
    SGD: process.env.STRIPE_PRICE_BASIC_SGD || 'price_basic_sgd',
    CHF: process.env.STRIPE_PRICE_BASIC_CHF || 'price_basic_chf',
    CNY: process.env.STRIPE_PRICE_BASIC_CNY || 'price_basic_cny',
    SEK: process.env.STRIPE_PRICE_BASIC_SEK || 'price_basic_sek',
    NOK: process.env.STRIPE_PRICE_BASIC_NOK || 'price_basic_nok',
    DKK: process.env.STRIPE_PRICE_BASIC_DKK || 'price_basic_dkk',
    PLN: process.env.STRIPE_PRICE_BASIC_PLN || 'price_basic_pln',
    NZD: process.env.STRIPE_PRICE_BASIC_NZD || 'price_basic_nzd',
    ZAR: process.env.STRIPE_PRICE_BASIC_ZAR || 'price_basic_zar',
    AED: process.env.STRIPE_PRICE_BASIC_AED || 'price_basic_aed',
    SAR: process.env.STRIPE_PRICE_BASIC_SAR || 'price_basic_sar'
  },
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
