/* ===== MULTI-COUNTRY CONFIGURATION =====
   Add a new country by adding an entry here + a PRODUCTS_<CODE> catalog file.
   Everything else (currency, payments, delivery, language, geocoding) reads from this config. */
const COUNTRIES = {
  sa: {
    code: 'sa',
    name: 'Saudi Arabia',
    nameNative: 'المملكة العربية السعودية',
    flag: '🇸🇦',
    currency: 'SAR',
    currencySymbol: 'ر.س ',
    rate: 0.034,                // base product price -> displayed price multiplier
    defaultLang: 'ar',
    langs: ['ar', 'en', 'bn', 'hi'],
    dialCode: '+966',
    geoNames: ['SA', 'Saudi Arabia', 'KSA'],
    geocodeCC: 'sa',
    mapCenter: { lat: 24.7136, lng: 46.6753 },   // Riyadh
    paymentMethods: ['card', 'apple', 'gpay', 'stc', 'tamara', 'tabby', 'paypal', 'binance', 'whatsapp'],
    deliveryAreas: [
      'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha',
      'Jubail', 'Taif', 'Buraidah', 'Khamis Mushait', 'Hail', 'Najran', 'Yanbu',
      'Al-Ahsa', 'Jazan', 'Qatif'
    ],
    deliveryAreasNative: [
      'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها',
      'الجبيل', 'الطائف', 'بريدة', 'خميس مشيط', 'حائل', 'نجران', 'ينبع',
      'الأحساء', 'جازان', 'القطيف'
    ],
    deliveryDays: '2–5',
    freeDeliveryThreshold: 0,
    deliveryCost: 0
  },
  bd: {
    code: 'bd',
    name: 'Bangladesh',
    nameNative: 'বাংলাদেশ',
    flag: '🇧🇩',
    currency: 'BDT',
    currencySymbol: '৳',
    rate: 1,                    // BD catalog prices are stored natively in BDT
    defaultLang: 'bn',
    langs: ['bn', 'en'],
    dialCode: '+880',
    geoNames: ['BD', 'Bangladesh'],
    geocodeCC: 'bd',
    mapCenter: { lat: 23.8103, lng: 90.4125 },   // Dhaka
    paymentMethods: ['bkash', 'nagad', 'rocket', 'bankcard', 'whatsapp'],
    deliveryAreas: [
      'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal',
      'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj', 'Gazipur', "Cox's Bazar"
    ],
    deliveryAreasNative: [
      'ঢাকা', 'চট্টগ্রাম', 'খুলনা', 'রাজশাহী', 'সিলেট', 'বরিশাল',
      'রংপুর', 'ময়মনসিংহ', 'কুমিল্লা', 'নারায়ণগঞ্জ', 'গাজীপুর', 'কক্সবাজার'
    ],
    deliveryDays: '3–6',
    freeDeliveryThreshold: 0,
    deliveryCost: 0
  }
};

const DEFAULT_COUNTRY = 'sa';
const SUPPORTED_COUNTRIES = Object.keys(COUNTRIES);

function countryInfo(code) {
  return COUNTRIES[code] || COUNTRIES[DEFAULT_COUNTRY];
}

/* Map an ISO-3166 alpha-2 country code (from IP geolocation) to a supported store country.
   Returns null when the visitor's country isn't one we operate in yet. */
function _matchSupportedCountry(isoCode) {
  if (!isoCode) return null;
  const up = String(isoCode).toUpperCase();
  for (const code of SUPPORTED_COUNTRIES) {
    if (COUNTRIES[code].geoNames.some(n => n.toUpperCase() === up)) return code;
  }
  return null;
}
