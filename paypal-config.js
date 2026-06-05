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
  clientId: 'AYCqh2SQjhxqLU9D6pKQNhBVgU7dVIUN_e_UhQ_HT2ziGSe0vzxY7bAIDDB4q_eUHZU5Q8DLIvXqjlSE',
  currency: 'USD',
  environment: 'production'
};

// Check if configured
const PAYPAL_READY = PAYPAL_CONFIG.clientId !== 'PASTE_YOUR_PAYPAL_CLIENT_ID';
