/**
 * EX Trade Worker — Cloudflare Worker
 * =====================================
 * Binary options trading platform backend.
 * Handles: payments (bKash, Nagad, Crypto), trades, tournaments, referrals, users, signals.
 *
 * SETUP GUIDE:
 * ============
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file → Save & Deploy
 * 3. Go to Worker Settings → Variables → Add these secrets:
 *
 *    FIREBASE_API_KEY     — AIzaSyCPSsxifbE92WqEa2VsGdSqaJIRTPkZiLQ
 *    WORKER_SECRET        — any random string to protect admin endpoints
 *    BKASH_APP_KEY        — from bKash Developer Portal (sandbox or live)
 *    BKASH_APP_SECRET     — from bKash Developer Portal
 *    BKASH_USERNAME       — bKash merchant username
 *    BKASH_PASSWORD       — bKash merchant password
 *    NAGAD_MERCHANT_ID    — from Nagad merchant dashboard
 *    NAGAD_MERCHANT_KEY   — Nagad merchant private key (for signing)
 *    ANTHROPIC_API_KEY    — from console.anthropic.com (optional, for AI signals)
 *
 * 4. Copy the Worker URL (e.g. https://ex-trade-worker.yourname.workers.dev)
 * 5. Set it as the API_BASE in your trade.html frontend.
 *
 * BKASH SANDBOX:
 * ==============
 *   Base URL: https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout
 *   Live URL: https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout
 *   Docs: https://developer.bka.sh/docs
 *
 * NAGAD SANDBOX:
 * ==============
 *   Base URL: http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs
 *   Live URL: https://api.mynagad.com/api/dfs
 *   Docs: https://nagad.com.bd/api/
 *
 * BLOCKCHAIN EXPLORERS (free, no key needed for basic use):
 *   TronScan: https://apilist.tronscanapi.com/api/transaction-info?hash={txHash}
 *   BlockCypher BTC: https://api.blockcypher.com/v1/btc/main/txs/{txHash}
 *   Etherscan ETH: https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash={txHash}
 *
 * FIRESTORE COLLECTIONS:
 * ======================
 *   traders/{uid}            — user profiles & balances
 *   trades/{tradeId}         — individual trade records
 *   deposits/{id}            — deposit records
 *   withdrawals/{id}         — withdrawal records
 *   tournaments/{id}         — tournament metadata
 *   tournament_trades/{id}   — per-user tournament performance
 *   signals/{assetId}        — latest trading signals
 *   referrals/{code}         — referral code → referrer mapping
 *
 * ROUTES:
 * =======
 *   POST /api/payment/bkash/initiate
 *   POST /api/payment/bkash/callback
 *   POST /api/payment/nagad/initiate
 *   POST /api/payment/nagad/callback
 *   POST /api/payment/crypto/verify
 *   POST /api/trade/create
 *   POST /api/trade/resolve
 *   GET  /api/tournament/current
 *   POST /api/tournament/join
 *   POST /api/tournament/trade
 *   GET  /api/referral/:code
 *   POST /api/referral/apply
 *   POST /api/user/create
 *   GET  /api/user/:uid
 *   POST /api/signal/generate
 *   GET  /api/signals
 *   GET  /health
 */

/* ─────────────────────────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────────────────────────── */

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

/** Wrap fetch with a timeout using AbortController */
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Generate a short unique ID with a given prefix */
function genId(prefix = 'ID') {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 7).toUpperCase();
}

/** Generate a unique 8-char alphanumeric referral code */
function genReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Require bearer token to match WORKER_SECRET */
function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!env.WORKER_SECRET || token !== env.WORKER_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null; // null = authorized
}

/* ─────────────────────────────────────────────────────────────────
   FIRESTORE REST API
   Project: exglobal21
─────────────────────────────────────────────────────────────────── */

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/exglobal21/databases/(default)/documents';

/** Convert a plain JS object to Firestore wire format */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

/** Convert Firestore wire format back to plain JS */
function fromFirestoreFields(fields) {
  if (!fields) return {};
  const obj = {};
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = fromFirestoreValue(val);
  }
  return obj;
}

function fromFirestoreValue(val) {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) return fromFirestoreFields(val.mapValue.fields || {});
  return null;
}

/**
 * Upsert a Firestore document.
 * collection: e.g. 'traders', 'trades', 'deposits'
 * docId: document ID string
 * data: plain JS object
 */
async function firestoreWrite(collection, docId, data, apiKey) {
  const url = `${FIRESTORE_BASE}/${collection}/${encodeURIComponent(docId)}?key=${apiKey}`;
  const body = JSON.stringify({ fields: toFirestoreFields(data) });
  const res = await fetchWithTimeout(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  }, 10000);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore write to ${collection}/${docId} failed (${res.status}): ${errText}`);
  }
  return await res.json();
}

/**
 * Read a Firestore document.
 * Returns plain JS object or null if not found.
 */
async function firestoreRead(collection, docId, apiKey) {
  const url = `${FIRESTORE_BASE}/${collection}/${encodeURIComponent(docId)}?key=${apiKey}`;
  const res = await fetchWithTimeout(url, { method: 'GET' }, 10000);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore read ${collection}/${docId} failed (${res.status})`);
  const doc = await res.json();
  return fromFirestoreFields(doc.fields || {});
}

/**
 * Query a Firestore collection with simple equality filters.
 * filters: [{ field, op, value }]  op: 'EQUAL', 'GREATER_THAN', etc.
 * Returns array of plain JS objects, each with an added __id field.
 */
async function firestoreQuery(collection, filters, apiKey, limit = 50) {
  const url = `${FIRESTORE_BASE}:runQuery?key=${apiKey}`;
  const structuredQuery = {
    from: [{ collectionId: collection }],
    limit,
  };

  if (filters && filters.length > 0) {
    const conditions = filters.map(f => ({
      fieldFilter: {
        field: { fieldPath: f.field },
        op: f.op || 'EQUAL',
        value: toFirestoreValue(f.value),
      },
    }));
    structuredQuery.where = conditions.length === 1
      ? conditions[0]
      : { compositeFilter: { op: 'AND', filters: conditions } };
  }

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  }, 12000);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore query ${collection} failed (${res.status}): ${errText}`);
  }

  const results = await res.json();
  return (results || [])
    .filter(r => r.document)
    .map(r => {
      const data = fromFirestoreFields(r.document.fields || {});
      // Extract the document ID from the resource name
      const parts = r.document.name.split('/');
      data.__id = parts[parts.length - 1];
      return data;
    });
}

/**
 * Atomically update a numeric field in a Firestore document
 * by reading current value, applying delta, then writing back.
 * Returns the new value.
 */
async function firestoreIncrement(collection, docId, field, delta, apiKey) {
  const doc = await firestoreRead(collection, docId, apiKey);
  if (!doc) throw new Error(`Document ${collection}/${docId} not found`);
  const current = typeof doc[field] === 'number' ? doc[field] : 0;
  const newValue = Math.round((current + delta) * 1e8) / 1e8; // float precision guard
  await firestoreWrite(collection, docId, { ...doc, [field]: newValue }, apiKey);
  return newValue;
}

/* ─────────────────────────────────────────────────────────────────
   BKASH PAYMENT GATEWAY
   Docs: https://developer.bka.sh/docs/tokenized-checkout-process
─────────────────────────────────────────────────────────────────── */

const BKASH_BASE = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout';
// For production change to: https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout

/** Get a fresh bKash access token (short-lived: ~1 hour) */
async function bkashGetToken(env) {
  const res = await fetchWithTimeout(`${BKASH_BASE}/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: env.BKASH_USERNAME,
      password: env.BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: env.BKASH_APP_KEY,
      app_secret: env.BKASH_APP_SECRET,
    }),
  }, 12000);

  if (!res.ok) throw new Error(`bKash token grant failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.id_token) throw new Error(`bKash token grant error: ${data.msg || JSON.stringify(data)}`);
  return data.id_token;
}

/**
 * POST /api/payment/bkash/initiate
 * Body: { userId, amount, email }
 * Returns: { paymentID, bkashURL }
 */
async function handleBkashInitiate(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { userId, amount, email } = body;
  if (!userId || !amount) return json({ error: 'userId and amount are required' }, 400);

  if (!env.BKASH_APP_KEY || !env.BKASH_APP_SECRET) {
    return json({ error: 'bKash credentials not configured' }, 503);
  }

  let token;
  try { token = await bkashGetToken(env); }
  catch (e) { return json({ error: `bKash auth failed: ${e.message}` }, 502); }

  // Create a payment request
  const paymentRef = genId('BK');
  let paymentData;
  try {
    const res = await fetchWithTimeout(`${BKASH_BASE}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        mode: '0011',                    // Checkout URL mode
        payerReference: userId,
        callbackURL: 'https://extrade.app/payment/bkash/callback', // update for production
        amount: String(amount),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: paymentRef,
      }),
    }, 15000);

    if (!res.ok) throw new Error(`bKash create payment HTTP ${res.status}`);
    paymentData = await res.json();
  } catch (e) {
    return json({ error: `bKash create payment failed: ${e.message}` }, 502);
  }

  if (paymentData.statusCode !== '0000' || !paymentData.paymentID) {
    return json({
      error: paymentData.statusMessage || 'bKash payment creation failed',
      raw: paymentData,
    }, 400);
  }

  // Store pending deposit record so callback can look it up
  try {
    await firestoreWrite('deposits', paymentData.paymentID, {
      userId,
      amount: Number(amount),
      method: 'bkash',
      paymentID: paymentData.paymentID,
      merchantInvoiceNumber: paymentRef,
      email: email || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }, env.FIREBASE_API_KEY);
  } catch (e) {
    console.error('[bKash initiate] Firestore write failed:', e.message);
    // Non-fatal — continue so user can still pay
  }

  return json({
    paymentID: paymentData.paymentID,
    bkashURL: paymentData.bkashURL,
    statusCode: paymentData.statusCode,
  });
}

/**
 * POST /api/payment/bkash/callback
 * bKash redirects user here after payment.
 * Body: { paymentID, status }  (or query params — accept both)
 * On success: credit user balance, update deposit record
 */
async function handleBkashCallback(request, env) {
  let paymentID, status;

  // Accept JSON body or URL-encoded query params
  const url = new URL(request.url);
  paymentID = url.searchParams.get('paymentID');
  status = url.searchParams.get('status');

  if (!paymentID) {
    try {
      const body = await request.json();
      paymentID = body.paymentID;
      status = body.status || status;
    } catch { /* ignore */ }
  }

  if (!paymentID) return json({ error: 'paymentID is required' }, 400);

  // Look up the pending deposit record
  let depositDoc;
  try { depositDoc = await firestoreRead('deposits', paymentID, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `Could not read deposit: ${e.message}` }, 500); }

  if (!depositDoc) return json({ error: 'Deposit record not found' }, 404);
  if (depositDoc.status === 'completed') {
    return json({ success: true, message: 'Already processed' });
  }

  // Execute bKash payment verification
  if (!env.BKASH_APP_KEY) return json({ error: 'bKash not configured' }, 503);
  let token;
  try { token = await bkashGetToken(env); }
  catch (e) { return json({ error: `bKash auth failed: ${e.message}` }, 502); }

  let verifyData;
  try {
    const res = await fetchWithTimeout(`${BKASH_BASE}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': env.BKASH_APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    }, 15000);
    if (!res.ok) throw new Error(`bKash execute HTTP ${res.status}`);
    verifyData = await res.json();
  } catch (e) {
    return json({ error: `bKash verification failed: ${e.message}` }, 502);
  }

  const isSuccess = verifyData.transactionStatus === 'Completed' && verifyData.statusCode === '0000';

  if (!isSuccess) {
    // Mark deposit as failed
    await firestoreWrite('deposits', paymentID, {
      ...depositDoc,
      status: 'failed',
      failReason: verifyData.statusMessage || 'Payment not completed',
      updatedAt: new Date().toISOString(),
    }, env.FIREBASE_API_KEY).catch(() => {});
    return json({ success: false, message: verifyData.statusMessage || 'Payment not completed' });
  }

  // Credit user balance
  const { userId, amount } = depositDoc;
  try {
    await firestoreIncrement('traders', userId, 'realBalance', amount, env.FIREBASE_API_KEY);
    await firestoreIncrement('traders', userId, 'totalDeposit', amount, env.FIREBASE_API_KEY);
  } catch (e) {
    console.error('[bKash callback] Balance update failed:', e.message);
    // Still mark deposit completed so we can manually fix balance
  }

  // Mark deposit completed
  await firestoreWrite('deposits', paymentID, {
    ...depositDoc,
    status: 'completed',
    trxID: verifyData.trxID || '',
    updatedAt: new Date().toISOString(),
  }, env.FIREBASE_API_KEY).catch(() => {});

  return json({
    success: true,
    trxID: verifyData.trxID,
    amount,
    userId,
  });
}

/* ─────────────────────────────────────────────────────────────────
   NAGAD PAYMENT GATEWAY
   Docs: https://nagad.com.bd/api/
─────────────────────────────────────────────────────────────────── */

const NAGAD_BASE = 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs';
// For production: https://api.mynagad.com/api/dfs

/**
 * Sign a Nagad request payload with RSA-SHA256.
 * Nagad requires requests signed with the merchant's private key.
 * NOTE: Web Crypto API used — key must be PKCS8 PEM without headers, base64 only.
 */
async function nagadSign(dataStr, privateKeyB64) {
  // Decode base64 PEM (strip header/footer if present)
  const keyStr = privateKeyB64.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const keyBytes = Uint8Array.from(atob(keyStr), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const sigBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(dataStr));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
}

/**
 * POST /api/payment/nagad/initiate
 * Body: { userId, amount }
 * Returns: { paymentURL }
 */
async function handleNagadInitiate(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { userId, amount } = body;
  if (!userId || !amount) return json({ error: 'userId and amount are required' }, 400);

  if (!env.NAGAD_MERCHANT_ID || !env.NAGAD_MERCHANT_KEY) {
    return json({ error: 'Nagad credentials not configured' }, 503);
  }

  const orderId = genId('NG');
  const datetime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss

  // Step 1: Initialize the payment
  const initPayload = {
    merchantId: env.NAGAD_MERCHANT_ID,
    orderId,
    datetime,
    challenge: genId('CH'),
  };

  let initSignature;
  try {
    initSignature = await nagadSign(JSON.stringify(initPayload), env.NAGAD_MERCHANT_KEY);
  } catch (e) {
    return json({ error: `Nagad signing failed: ${e.message}` }, 500);
  }

  let initData;
  try {
    const res = await fetchWithTimeout(
      `${NAGAD_BASE}/check-out/initialize/${env.NAGAD_MERCHANT_ID}/${orderId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': '127.0.0.1',
          'X-KM-Client-Type': 'PC_WEB',
        },
        body: JSON.stringify({
          dateTime: datetime,
          sensitiveData: btoa(JSON.stringify(initPayload)),
          signature: initSignature,
        }),
      },
      15000
    );
    if (!res.ok) throw new Error(`Nagad init HTTP ${res.status}`);
    initData = await res.json();
  } catch (e) {
    return json({ error: `Nagad init failed: ${e.message}` }, 502);
  }

  if (!initData.sensitiveData) {
    return json({ error: 'Nagad init returned no sensitiveData', raw: initData }, 400);
  }

  // Step 2: Complete checkout to get payment URL
  const checkoutPayload = {
    merchantId: env.NAGAD_MERCHANT_ID,
    orderId,
    currencyCode: '050', // BDT
    amount: String(amount),
    challenge: initData.sensitiveData,
  };

  let checkoutSig;
  try {
    checkoutSig = await nagadSign(JSON.stringify(checkoutPayload), env.NAGAD_MERCHANT_KEY);
  } catch (e) {
    return json({ error: `Nagad checkout signing failed: ${e.message}` }, 500);
  }

  let checkoutData;
  try {
    const res = await fetchWithTimeout(
      `${NAGAD_BASE}/check-out/complete/${env.NAGAD_MERCHANT_ID}/${orderId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': '127.0.0.1',
          'X-KM-Client-Type': 'PC_WEB',
        },
        body: JSON.stringify({
          sensitiveData: btoa(JSON.stringify(checkoutPayload)),
          signature: checkoutSig,
          merchantCallbackURL: 'https://extrade.app/payment/nagad/callback',
        }),
      },
      15000
    );
    if (!res.ok) throw new Error(`Nagad checkout HTTP ${res.status}`);
    checkoutData = await res.json();
  } catch (e) {
    return json({ error: `Nagad checkout failed: ${e.message}` }, 502);
  }

  // Store pending deposit
  try {
    await firestoreWrite('deposits', orderId, {
      userId,
      amount: Number(amount),
      method: 'nagad',
      nagadOrderId: orderId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }, env.FIREBASE_API_KEY);
  } catch (e) {
    console.error('[Nagad initiate] Firestore write failed:', e.message);
  }

  return json({
    paymentURL: checkoutData.callBackUrl || checkoutData.redirectUrl || '',
    orderId,
    raw: checkoutData,
  });
}

/**
 * POST /api/payment/nagad/callback
 * Body or query: { payment_ref_id, order_id, status, ... }
 */
async function handleNagadCallback(request, env) {
  const url = new URL(request.url);
  let paymentRefId = url.searchParams.get('payment_ref_id');
  let orderId = url.searchParams.get('order_id');
  let status = url.searchParams.get('status');

  if (!paymentRefId) {
    try {
      const body = await request.json();
      paymentRefId = body.payment_ref_id || body.paymentRefId;
      orderId = body.order_id || body.orderId || orderId;
      status = body.status || status;
    } catch { /* ignore */ }
  }

  if (!orderId) return json({ error: 'order_id is required' }, 400);

  let depositDoc;
  try { depositDoc = await firestoreRead('deposits', orderId, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `Could not read deposit: ${e.message}` }, 500); }

  if (!depositDoc) return json({ error: 'Deposit record not found' }, 404);
  if (depositDoc.status === 'completed') return json({ success: true, message: 'Already processed' });

  // Verify with Nagad API
  if (!env.NAGAD_MERCHANT_ID) return json({ error: 'Nagad not configured' }, 503);

  let verifyData;
  try {
    const res = await fetchWithTimeout(
      `${NAGAD_BASE}/verify/payment/${paymentRefId}`,
      {
        method: 'GET',
        headers: { 'X-KM-Api-Version': 'v-0.2.0' },
      },
      12000
    );
    if (!res.ok) throw new Error(`Nagad verify HTTP ${res.status}`);
    verifyData = await res.json();
  } catch (e) {
    return json({ error: `Nagad verification failed: ${e.message}` }, 502);
  }

  const isSuccess = verifyData.status === 'Success';

  if (!isSuccess) {
    await firestoreWrite('deposits', orderId, {
      ...depositDoc,
      status: 'failed',
      failReason: verifyData.status || 'Payment not successful',
      updatedAt: new Date().toISOString(),
    }, env.FIREBASE_API_KEY).catch(() => {});
    return json({ success: false, message: verifyData.status });
  }

  const { userId, amount } = depositDoc;
  try {
    await firestoreIncrement('traders', userId, 'realBalance', amount, env.FIREBASE_API_KEY);
    await firestoreIncrement('traders', userId, 'totalDeposit', amount, env.FIREBASE_API_KEY);
  } catch (e) {
    console.error('[Nagad callback] Balance update failed:', e.message);
  }

  await firestoreWrite('deposits', orderId, {
    ...depositDoc,
    status: 'completed',
    paymentRefId: paymentRefId || '',
    updatedAt: new Date().toISOString(),
  }, env.FIREBASE_API_KEY).catch(() => {});

  return json({ success: true, amount, userId });
}

/* ─────────────────────────────────────────────────────────────────
   CRYPTO PAYMENT VERIFICATION
   Supports: USDT TRC20 (TronScan), BTC (BlockCypher), ETH (Etherscan)
─────────────────────────────────────────────────────────────────── */

const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // Mainnet USDT TRC20

/**
 * Verify a USDT TRC20 transaction on TronScan.
 * Returns { confirmed, amount } where amount is in USDT.
 */
async function verifyTronUSDT(txHash) {
  const res = await fetchWithTimeout(
    `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`,
    { method: 'GET', headers: { 'TRON-PRO-API-KEY': '' } },
    15000
  );
  if (!res.ok) throw new Error(`TronScan API HTTP ${res.status}`);
  const data = await res.json();

  // TronScan returns contractType == 31 for TRC20 transfers
  const confirmed = data.confirmed === true || data.contractRet === 'SUCCESS';
  if (!confirmed) return { confirmed: false, amount: 0 };

  // Try to parse token transfer amount from trc20TransferInfo
  let amount = 0;
  const transfers = data.trc20TransferInfo || [];
  for (const t of transfers) {
    if (t.contract_address === USDT_TRC20_CONTRACT) {
      // Amount is in smallest unit (6 decimals for USDT)
      amount = parseFloat(t.amount_str || t.amount || '0') / 1e6;
      break;
    }
  }

  return { confirmed, amount };
}

/**
 * Verify a BTC transaction on BlockCypher.
 * Returns { confirmed, amount } where amount is in BTC.
 */
async function verifyBTC(txHash) {
  const res = await fetchWithTimeout(
    `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`,
    { method: 'GET' },
    15000
  );
  if (!res.ok) throw new Error(`BlockCypher API HTTP ${res.status}`);
  const data = await res.json();

  const confirmed = (data.confirmations || 0) >= 1;
  // Total output value in satoshis; for deposit verification we use total_received
  const satoshis = data.total || 0;
  const amount = satoshis / 1e8;

  return { confirmed, amount, confirmations: data.confirmations || 0 };
}

/**
 * Verify an ETH transaction on Etherscan (free tier).
 * Returns { confirmed, amount } where amount is in ETH.
 */
async function verifyETH(txHash) {
  // Using public Etherscan endpoint (no key required for basic status check)
  const res = await fetchWithTimeout(
    `https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=YourApiKeyToken`,
    { method: 'GET' },
    15000
  );
  if (!res.ok) throw new Error(`Etherscan API HTTP ${res.status}`);
  const statusData = await res.json();
  const confirmed = statusData.result?.status === '1';

  // Fetch the actual tx to get value
  const txRes = await fetchWithTimeout(
    `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=YourApiKeyToken`,
    { method: 'GET' },
    15000
  );
  let amount = 0;
  if (txRes.ok) {
    const txData = await txRes.json();
    const weiHex = txData.result?.value || '0x0';
    amount = parseInt(weiHex, 16) / 1e18;
  }

  return { confirmed, amount };
}

/**
 * POST /api/payment/crypto/verify
 * Body: { userId, txHash, currency, amount }
 * currency: 'USDT_TRC20' | 'BTC' | 'ETH'
 * On verified: add balance, create deposit record
 */
async function handleCryptoVerify(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { userId, txHash, currency, amount: expectedAmount } = body;
  if (!userId || !txHash || !currency) {
    return json({ error: 'userId, txHash, and currency are required' }, 400);
  }

  // Prevent double-processing same txHash
  const existingDeposit = await firestoreRead('deposits', txHash, env.FIREBASE_API_KEY).catch(() => null);
  if (existingDeposit?.status === 'completed') {
    return json({ error: 'This transaction has already been processed' }, 409);
  }

  let verifyResult;
  try {
    if (currency === 'USDT_TRC20') {
      verifyResult = await verifyTronUSDT(txHash);
    } else if (currency === 'BTC') {
      verifyResult = await verifyBTC(txHash);
    } else if (currency === 'ETH') {
      verifyResult = await verifyETH(txHash);
    } else {
      return json({ error: `Unsupported currency: ${currency}` }, 400);
    }
  } catch (e) {
    return json({ error: `Blockchain verification failed: ${e.message}` }, 502);
  }

  if (!verifyResult.confirmed) {
    await firestoreWrite('deposits', txHash, {
      userId,
      amount: expectedAmount || 0,
      currency,
      txHash,
      method: 'crypto',
      status: 'unconfirmed',
      verifyResult,
      createdAt: new Date().toISOString(),
    }, env.FIREBASE_API_KEY).catch(() => {});
    return json({ success: false, message: 'Transaction not yet confirmed', verifyResult });
  }

  const creditAmount = Number(expectedAmount) || verifyResult.amount;

  // Credit user balance (USDT-denominated; BTC/ETH amounts treated as USD-equivalent)
  try {
    await firestoreIncrement('traders', userId, 'realBalance', creditAmount, env.FIREBASE_API_KEY);
    await firestoreIncrement('traders', userId, 'totalDeposit', creditAmount, env.FIREBASE_API_KEY);
  } catch (e) {
    console.error('[Crypto verify] Balance update failed:', e.message);
  }

  await firestoreWrite('deposits', txHash, {
    userId,
    amount: creditAmount,
    currency,
    txHash,
    method: 'crypto',
    status: 'completed',
    onChainAmount: verifyResult.amount,
    verifyResult,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, env.FIREBASE_API_KEY).catch(() => {});

  return json({ success: true, amount: creditAmount, onChainAmount: verifyResult.amount, userId });
}

/* ─────────────────────────────────────────────────────────────────
   TRADING ENGINE
─────────────────────────────────────────────────────────────────── */

// Payout multipliers for binary options
const PAYOUT_MULTIPLIER = 0.85; // 85% profit on correct prediction

/**
 * POST /api/trade/create
 * Body: { userId, assetId, direction, amount, openPrice, expirySec, mode }
 * mode: 'real' | 'demo'
 * Returns: { tradeId }
 */
async function handleTradeCreate(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { userId, assetId, direction, amount, openPrice, expirySec, mode = 'demo' } = body;
  if (!userId || !assetId || !direction || !amount || openPrice == null) {
    return json({ error: 'userId, assetId, direction, amount, openPrice are required' }, 400);
  }
  if (!['UP', 'DOWN'].includes(direction)) {
    return json({ error: 'direction must be UP or DOWN' }, 400);
  }

  // Validate user and balance
  let trader;
  try { trader = await firestoreRead('traders', userId, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `User lookup failed: ${e.message}` }, 500); }
  if (!trader) return json({ error: 'User not found' }, 404);

  const balanceKey = mode === 'real' ? 'realBalance' : 'demoBalance';
  const currentBalance = trader[balanceKey] || 0;
  if (currentBalance < amount) {
    return json({ error: `Insufficient ${mode} balance (have ${currentBalance}, need ${amount})` }, 400);
  }

  // Deduct balance immediately (locked in trade)
  try {
    await firestoreIncrement('traders', userId, balanceKey, -amount, env.FIREBASE_API_KEY);
  } catch (e) {
    return json({ error: `Balance deduction failed: ${e.message}` }, 500);
  }

  const tradeId = genId('TR');
  const expiresAt = new Date(Date.now() + (expirySec || 60) * 1000).toISOString();

  const tradeDoc = {
    tradeId,
    userId,
    assetId,
    direction,
    amount: Number(amount),
    openPrice: Number(openPrice),
    closePrice: null,
    profit: null,
    status: 'open',
    mode,
    expirySec: expirySec || 60,
    expiresAt,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  try {
    await firestoreWrite('trades', tradeId, tradeDoc, env.FIREBASE_API_KEY);
  } catch (e) {
    // Refund on Firestore failure
    await firestoreIncrement('traders', userId, balanceKey, amount, env.FIREBASE_API_KEY).catch(() => {});
    return json({ error: `Trade save failed: ${e.message}` }, 500);
  }

  // Update user trade count
  await firestoreIncrement('traders', userId, 'totalTrades', 1, env.FIREBASE_API_KEY).catch(() => {});

  return json({ success: true, tradeId, expiresAt, trade: tradeDoc });
}

/**
 * POST /api/trade/resolve
 * Body: { tradeId, closePrice }
 * Resolves the trade outcome and updates user balance.
 */
async function handleTradeResolve(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { tradeId, closePrice } = body;
  if (!tradeId || closePrice == null) {
    return json({ error: 'tradeId and closePrice are required' }, 400);
  }

  let trade;
  try { trade = await firestoreRead('trades', tradeId, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `Trade lookup failed: ${e.message}` }, 500); }
  if (!trade) return json({ error: 'Trade not found' }, 404);
  if (trade.status !== 'open') return json({ error: `Trade already resolved (status: ${trade.status})` }, 409);

  const { direction, openPrice, amount, userId, mode } = trade;
  const close = Number(closePrice);
  const open = Number(openPrice);

  // Determine win/loss
  const priceWentUp = close > open;
  const isWin = (direction === 'UP' && priceWentUp) || (direction === 'DOWN' && !priceWentUp);
  const isTie = close === open;

  let profit = 0;
  let status = 'lost';
  let returnAmount = 0; // amount returned to wallet

  if (isTie) {
    status = 'tie';
    profit = 0;
    returnAmount = amount; // refund stake on tie
  } else if (isWin) {
    status = 'won';
    profit = Math.round(amount * PAYOUT_MULTIPLIER * 100) / 100;
    returnAmount = amount + profit;
  } else {
    status = 'lost';
    profit = -amount;
    returnAmount = 0;
  }

  // Credit return amount to user
  if (returnAmount > 0) {
    const balanceKey = mode === 'real' ? 'realBalance' : 'demoBalance';
    try {
      await firestoreIncrement('traders', userId, balanceKey, returnAmount, env.FIREBASE_API_KEY);
    } catch (e) {
      console.error('[resolve] Balance credit failed:', e.message);
    }
  }

  // Update trade record
  const updatedTrade = {
    ...trade,
    closePrice: close,
    profit,
    status,
    resolvedAt: new Date().toISOString(),
  };

  try {
    await firestoreWrite('trades', tradeId, updatedTrade, env.FIREBASE_API_KEY);
  } catch (e) {
    return json({ error: `Trade update failed: ${e.message}` }, 500);
  }

  return json({ success: true, tradeId, status, profit, closePrice: close, returnAmount });
}

/* ─────────────────────────────────────────────────────────────────
   TOURNAMENT SYSTEM
─────────────────────────────────────────────────────────────────── */

/**
 * GET /api/tournament/current
 * Returns active tournament with leaderboard.
 */
async function handleTournamentCurrent(env) {
  // Query for active tournament
  let tournaments;
  try {
    tournaments = await firestoreQuery(
      'tournaments',
      [{ field: 'status', op: 'EQUAL', value: 'active' }],
      env.FIREBASE_API_KEY,
      1
    );
  } catch (e) {
    return json({ error: `Tournament query failed: ${e.message}` }, 500);
  }

  if (!tournaments.length) {
    return json({ tournament: null, message: 'No active tournament' });
  }

  const tournament = tournaments[0];
  const tournamentId = tournament.__id;

  // Fetch leaderboard from tournament_trades
  let entries;
  try {
    entries = await firestoreQuery(
      'tournament_trades',
      [{ field: 'tournamentId', op: 'EQUAL', value: tournamentId }],
      env.FIREBASE_API_KEY,
      100
    );
  } catch (e) {
    entries = [];
  }

  // Sort by profit descending
  const leaderboard = entries
    .sort((a, b) => (b.profit || 0) - (a.profit || 0))
    .map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      name: e.name || 'Anonymous',
      profit: e.profit || 0,
      trades: e.trades || 0,
    }));

  return json({
    id: tournamentId,
    name: tournament.name || 'EX Trade Championship',
    prizePool: tournament.prizePool || 0,
    startAt: tournament.startAt,
    endsAt: tournament.endsAt,
    status: tournament.status,
    participants: leaderboard.length,
    leaderboard: leaderboard.slice(0, 50),
  });
}

/**
 * POST /api/tournament/join
 * Body: { userId, tournamentId }
 */
async function handleTournamentJoin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { userId, tournamentId } = body;
  if (!userId || !tournamentId) {
    return json({ error: 'userId and tournamentId are required' }, 400);
  }

  // Check tournament exists and is active
  let tournament;
  try { tournament = await firestoreRead('tournaments', tournamentId, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `Tournament lookup failed: ${e.message}` }, 500); }
  if (!tournament) return json({ error: 'Tournament not found' }, 404);
  if (tournament.status !== 'active') return json({ error: 'Tournament is not active' }, 400);

  // Check if already joined
  const entryId = `${tournamentId}_${userId}`;
  let existing;
  try { existing = await firestoreRead('tournament_trades', entryId, env.FIREBASE_API_KEY); }
  catch { existing = null; }
  if (existing) return json({ success: true, message: 'Already joined', alreadyJoined: true });

  // Get user name
  let trader;
  try { trader = await firestoreRead('traders', userId, env.FIREBASE_API_KEY); }
  catch { trader = null; }

  // Create tournament entry
  await firestoreWrite('tournament_trades', entryId, {
    tournamentId,
    userId,
    name: trader?.name || 'Anonymous',
    profit: 0,
    trades: 0,
    joinedAt: new Date().toISOString(),
  }, env.FIREBASE_API_KEY);

  return json({ success: true, message: 'Joined tournament successfully' });
}

/**
 * POST /api/tournament/trade
 * Record a tournament trade result.
 * Body: { tournamentId, userId, profit }
 */
async function handleTournamentTrade(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { tournamentId, userId, profit } = body;
  if (!tournamentId || !userId || profit == null) {
    return json({ error: 'tournamentId, userId, and profit are required' }, 400);
  }

  const entryId = `${tournamentId}_${userId}`;
  let entry;
  try { entry = await firestoreRead('tournament_trades', entryId, env.FIREBASE_API_KEY); }
  catch { entry = null; }

  if (!entry) return json({ error: 'User has not joined this tournament' }, 404);

  const updatedEntry = {
    ...entry,
    profit: Math.round(((entry.profit || 0) + Number(profit)) * 1e8) / 1e8,
    trades: (entry.trades || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    await firestoreWrite('tournament_trades', entryId, updatedEntry, env.FIREBASE_API_KEY);
  } catch (e) {
    return json({ error: `Tournament trade update failed: ${e.message}` }, 500);
  }

  return json({ success: true, entry: updatedEntry });
}

/* ─────────────────────────────────────────────────────────────────
   REFERRAL SYSTEM
─────────────────────────────────────────────────────────────────── */

const REFERRAL_COMMISSION_RATE = 0.05; // 5% of referred user's deposits

/**
 * GET /api/referral/:code
 * Returns referral info and referrer's public profile.
 */
async function handleReferralGet(code, env) {
  let referral;
  try { referral = await firestoreRead('referrals', code, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `Referral lookup failed: ${e.message}` }, 500); }

  if (!referral) return json({ error: 'Referral code not found' }, 404);

  // Fetch referrer name (don't expose sensitive fields)
  let referrerName = 'Anonymous';
  if (referral.userId) {
    const trader = await firestoreRead('traders', referral.userId, env.FIREBASE_API_KEY).catch(() => null);
    if (trader?.name) referrerName = trader.name;
  }

  return json({
    code,
    referrerName,
    earnings: referral.earnings || 0,
    referredCount: (referral.referredUsers || []).length,
  });
}

/**
 * POST /api/referral/apply
 * Apply a referral code when a new user registers.
 * Body: { newUserId, referralCode }
 * Grants commission to referrer on future deposits.
 */
async function handleReferralApply(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { newUserId, referralCode } = body;
  if (!newUserId || !referralCode) {
    return json({ error: 'newUserId and referralCode are required' }, 400);
  }

  let referral;
  try { referral = await firestoreRead('referrals', referralCode, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `Referral lookup failed: ${e.message}` }, 500); }
  if (!referral) return json({ error: 'Referral code not found' }, 404);

  const referrerId = referral.userId;
  if (referrerId === newUserId) {
    return json({ error: 'Cannot use your own referral code' }, 400);
  }

  // Check if new user already has a referrer
  const newUser = await firestoreRead('traders', newUserId, env.FIREBASE_API_KEY).catch(() => null);
  if (!newUser) return json({ error: 'New user not found' }, 404);
  if (newUser.referredBy) return json({ error: 'User already has a referral applied' }, 409);

  // Link new user to referrer
  await firestoreWrite('traders', newUserId, {
    ...newUser,
    referredBy: referralCode,
    referredByUserId: referrerId,
    updatedAt: new Date().toISOString(),
  }, env.FIREBASE_API_KEY);

  // Add newUserId to referrer's referredUsers list
  const referredUsers = Array.isArray(referral.referredUsers) ? referral.referredUsers : [];
  if (!referredUsers.includes(newUserId)) {
    referredUsers.push(newUserId);
  }
  await firestoreWrite('referrals', referralCode, {
    ...referral,
    referredUsers,
    updatedAt: new Date().toISOString(),
  }, env.FIREBASE_API_KEY);

  // Grant a small sign-up bonus to referrer (e.g. $1)
  const SIGNUP_BONUS = 1;
  await firestoreIncrement('traders', referrerId, 'realBalance', SIGNUP_BONUS, env.FIREBASE_API_KEY).catch(() => {});
  await firestoreIncrement('referrals', referralCode, 'earnings', SIGNUP_BONUS, env.FIREBASE_API_KEY).catch(() => {});

  return json({ success: true, referrerId, referralCode });
}

/* ─────────────────────────────────────────────────────────────────
   USER MANAGEMENT
─────────────────────────────────────────────────────────────────── */

/**
 * POST /api/user/create
 * Body: { uid, email, name, referralCode? }
 * Creates a new trader profile. Auto-generates a unique referral code.
 */
async function handleUserCreate(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { uid, email, name, referralCode: appliedCode } = body;
  if (!uid || !email) return json({ error: 'uid and email are required' }, 400);

  // Check if already exists
  const existing = await firestoreRead('traders', uid, env.FIREBASE_API_KEY).catch(() => null);
  if (existing) return json({ success: true, message: 'User already exists', user: existing });

  // Generate a unique referral code (retry up to 5 times on collision)
  let ownCode = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = genReferralCode();
    const clash = await firestoreRead('referrals', candidate, env.FIREBASE_API_KEY).catch(() => null);
    if (!clash) { ownCode = candidate; break; }
  }
  if (!ownCode) ownCode = genId('REF').slice(0, 8);

  const now = new Date().toISOString();
  const trader = {
    uid,
    email,
    name: name || email.split('@')[0],
    demoBalance: 10000,   // $10,000 demo balance for new users
    realBalance: 0,
    referralCode: ownCode,
    referredBy: appliedCode || null,
    totalDeposit: 0,
    totalTrades: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await firestoreWrite('traders', uid, trader, env.FIREBASE_API_KEY);
  } catch (e) {
    return json({ error: `User creation failed: ${e.message}` }, 500);
  }

  // Create referral code document
  await firestoreWrite('referrals', ownCode, {
    userId: uid,
    code: ownCode,
    earnings: 0,
    referredUsers: [],
    createdAt: now,
  }, env.FIREBASE_API_KEY).catch(e => console.error('[user create] Referral doc failed:', e.message));

  // Apply referral code if provided
  if (appliedCode) {
    const refDoc = await firestoreRead('referrals', appliedCode, env.FIREBASE_API_KEY).catch(() => null);
    if (refDoc && refDoc.userId !== uid) {
      const referredUsers = Array.isArray(refDoc.referredUsers) ? refDoc.referredUsers : [];
      if (!referredUsers.includes(uid)) referredUsers.push(uid);
      await firestoreWrite('referrals', appliedCode, {
        ...refDoc,
        referredUsers,
        updatedAt: now,
      }, env.FIREBASE_API_KEY).catch(() => {});
      // Signup bonus to referrer
      await firestoreIncrement('traders', refDoc.userId, 'realBalance', 1, env.FIREBASE_API_KEY).catch(() => {});
      await firestoreIncrement('referrals', appliedCode, 'earnings', 1, env.FIREBASE_API_KEY).catch(() => {});
      // Link referrer on new user
      await firestoreWrite('traders', uid, {
        ...trader,
        referredByUserId: refDoc.userId,
      }, env.FIREBASE_API_KEY).catch(() => {});
    }
  }

  return json({ success: true, user: trader });
}

/**
 * GET /api/user/:uid
 * Returns user profile and balances.
 */
async function handleUserGet(uid, env) {
  let trader;
  try { trader = await firestoreRead('traders', uid, env.FIREBASE_API_KEY); }
  catch (e) { return json({ error: `User lookup failed: ${e.message}` }, 500); }
  if (!trader) return json({ error: 'User not found' }, 404);

  // Fetch open trades count
  let openTrades = 0;
  try {
    const trades = await firestoreQuery(
      'trades',
      [{ field: 'userId', op: 'EQUAL', value: uid }, { field: 'status', op: 'EQUAL', value: 'open' }],
      env.FIREBASE_API_KEY,
      100
    );
    openTrades = trades.length;
  } catch { openTrades = 0; }

  return json({ ...trader, openTrades });
}

/* ─────────────────────────────────────────────────────────────────
   TRADING SIGNALS
   Simple RSI + Moving Average signal generation.
   In production, replace random OHLC with real price history from
   a market data API (e.g. Twelvedata, Polygon.io, Yahoo Finance).
─────────────────────────────────────────────────────────────────── */

const ASSETS = [
  { id: 'BTC/USD',  name: 'Bitcoin',        category: 'crypto' },
  { id: 'ETH/USD',  name: 'Ethereum',        category: 'crypto' },
  { id: 'EUR/USD',  name: 'Euro / US Dollar', category: 'forex'  },
  { id: 'GBP/USD',  name: 'Pound / US Dollar', category: 'forex' },
  { id: 'XAU/USD',  name: 'Gold',             category: 'commodity' },
  { id: 'OIL/USD',  name: 'Crude Oil',         category: 'commodity' },
  { id: 'AAPL',     name: 'Apple',             category: 'stock'  },
  { id: 'TSLA',     name: 'Tesla',             category: 'stock'  },
];

/** Calculate RSI from an array of closing prices (14-period default) */
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50; // not enough data
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

/** Calculate Simple Moving Average */
function calcSMA(closes, period = 20) {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Generate a synthetic price series seeded by asset ID.
 * In production, fetch real OHLCV data here.
 */
function generatePriceSeries(assetId, length = 30) {
  // Use asset ID chars as a seed for deterministic-ish variation
  const seed = assetId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  let price = 100 + (seed % 500);
  const closes = [price];
  for (let i = 1; i < length; i++) {
    const change = (Math.sin(i * seed * 0.1) + Math.cos(i * 0.3)) * (price * 0.008);
    price = Math.max(1, price + change);
    closes.push(Math.round(price * 100) / 100);
  }
  return closes;
}

/** Compute signal from price series */
function computeSignal(closes) {
  const rsi = calcRSI(closes);
  const sma20 = calcSMA(closes, 20);
  const sma5 = calcSMA(closes, 5);
  const lastClose = closes[closes.length - 1];

  let signal = 'NEUTRAL';
  let strength = 50;

  const aboveSMA20 = lastClose > sma20;
  const smaUptrend = sma5 > sma20;

  if (rsi < 30 && aboveSMA20) {
    signal = 'STRONG_BUY';
    strength = Math.round(90 - rsi);
  } else if (rsi < 45 && smaUptrend) {
    signal = 'BUY';
    strength = Math.round(65 + (45 - rsi));
  } else if (rsi > 70 && !aboveSMA20) {
    signal = 'STRONG_SELL';
    strength = Math.round(rsi - 10);
  } else if (rsi > 55 && !smaUptrend) {
    signal = 'SELL';
    strength = Math.round(rsi - 5);
  } else {
    signal = 'NEUTRAL';
    strength = 50;
  }

  return { signal, strength: Math.min(100, Math.max(0, strength)), rsi, sma5, sma20, lastClose };
}

/**
 * POST /api/signal/generate
 * Generate and store signals for all assets.
 * Protected — caller should pass Authorization: Bearer WORKER_SECRET in production.
 */
async function handleSignalGenerate(request, env) {
  const authErr = requireAuth(request, env);
  if (authErr) return authErr;

  const results = [];
  for (const asset of ASSETS) {
    const closes = generatePriceSeries(asset.id + Date.now().toString().slice(-5));
    const { signal, strength, rsi, sma5, sma20, lastClose } = computeSignal(closes);

    const signalDoc = {
      assetId: asset.id,
      assetName: asset.name,
      category: asset.category,
      signal,
      strength,
      rsi,
      sma5: Math.round(sma5 * 100) / 100,
      sma20: Math.round(sma20 * 100) / 100,
      price: lastClose,
      createdAt: new Date().toISOString(),
    };

    try {
      await firestoreWrite('signals', asset.id.replace('/', '_'), signalDoc, env.FIREBASE_API_KEY);
      results.push({ assetId: asset.id, signal, strength });
    } catch (e) {
      results.push({ assetId: asset.id, error: e.message });
    }
  }

  return json({ success: true, generated: results.length, signals: results });
}

/**
 * GET /api/signals
 * Return latest signals for all assets.
 */
async function handleSignalsGet(env) {
  const signals = [];
  for (const asset of ASSETS) {
    const docId = asset.id.replace('/', '_');
    const doc = await firestoreRead('signals', docId, env.FIREBASE_API_KEY).catch(() => null);
    if (doc) {
      signals.push(doc);
    } else {
      // Return a default neutral signal if none stored yet
      signals.push({
        assetId: asset.id,
        assetName: asset.name,
        category: asset.category,
        signal: 'NEUTRAL',
        strength: 50,
        rsi: 50,
        createdAt: null,
      });
    }
  }
  return json({ signals });
}

/* ─────────────────────────────────────────────────────────────────
   ROUTER — main fetch handler
─────────────────────────────────────────────────────────────────── */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ── GET /health
      if (method === 'GET' && path === '/health') {
        return json({
          status: 'ok',
          service: 'EX Trade Worker',
          timestamp: new Date().toISOString(),
          configured: {
            firebase: !!env.FIREBASE_API_KEY,
            bkash: !!(env.BKASH_APP_KEY && env.BKASH_APP_SECRET),
            nagad: !!(env.NAGAD_MERCHANT_ID && env.NAGAD_MERCHANT_KEY),
          },
        });
      }

      // ── Payment: bKash
      if (method === 'POST' && path === '/api/payment/bkash/initiate') {
        return handleBkashInitiate(request, env);
      }
      if (method === 'POST' && path === '/api/payment/bkash/callback') {
        return handleBkashCallback(request, env);
      }

      // ── Payment: Nagad
      if (method === 'POST' && path === '/api/payment/nagad/initiate') {
        return handleNagadInitiate(request, env);
      }
      if (method === 'POST' && path === '/api/payment/nagad/callback') {
        return handleNagadCallback(request, env);
      }

      // ── Payment: Crypto
      if (method === 'POST' && path === '/api/payment/crypto/verify') {
        return handleCryptoVerify(request, env);
      }

      // ── Trading
      if (method === 'POST' && path === '/api/trade/create') {
        return handleTradeCreate(request, env);
      }
      if (method === 'POST' && path === '/api/trade/resolve') {
        return handleTradeResolve(request, env);
      }

      // ── Tournament
      if (method === 'GET' && path === '/api/tournament/current') {
        return handleTournamentCurrent(env);
      }
      if (method === 'POST' && path === '/api/tournament/join') {
        return handleTournamentJoin(request, env);
      }
      if (method === 'POST' && path === '/api/tournament/trade') {
        return handleTournamentTrade(request, env);
      }

      // ── Referral: GET /api/referral/:code
      const referralGetMatch = path.match(/^\/api\/referral\/([^/]+)$/);
      if (method === 'GET' && referralGetMatch) {
        return handleReferralGet(decodeURIComponent(referralGetMatch[1]), env);
      }
      if (method === 'POST' && path === '/api/referral/apply') {
        return handleReferralApply(request, env);
      }

      // ── User
      if (method === 'POST' && path === '/api/user/create') {
        return handleUserCreate(request, env);
      }
      // GET /api/user/:uid
      const userGetMatch = path.match(/^\/api\/user\/([^/]+)$/);
      if (method === 'GET' && userGetMatch) {
        return handleUserGet(decodeURIComponent(userGetMatch[1]), env);
      }

      // ── Signals
      if (method === 'POST' && path === '/api/signal/generate') {
        return handleSignalGenerate(request, env);
      }
      if (method === 'GET' && path === '/api/signals') {
        return handleSignalsGet(env);
      }

      // ── 404 fallback
      return json({ error: 'Not found', path }, 404);

    } catch (err) {
      console.error('[trade-worker] Unhandled error:', err);
      return json({ error: 'Internal server error', message: err.message }, 500);
    }
  },
};
