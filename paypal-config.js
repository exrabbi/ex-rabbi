/*
 * ====================================================
 *  EX GLOBAL — PayPal Configuration
 * ====================================================
 *  SETUP STEPS (free, 10 minutes):
 *  1. Go to: https://developer.paypal.com
 *  2. Log in with your PayPal Business account
 *     (create one free at paypal.com/business)
 *  3. Dashboard → Apps & Credentials
 *  4. Create App → copy "Client ID"
 *  5. Replace PASTE_YOUR_PAYPAL_CLIENT_ID below
 *  6. For live payments switch sandbox→live
 * ====================================================
 */

const PAYPAL_CONFIG = {
  clientId: 'PASTE_YOUR_PAYPAL_CLIENT_ID',
  currency: 'SAR',
  // Change to 'production' after testing
  environment: 'sandbox'
};

// Check if configured
const PAYPAL_READY = PAYPAL_CONFIG.clientId !== 'PASTE_YOUR_PAYPAL_CLIENT_ID';
