/**
 * EX GLOBAL Automation Worker — Cloudflare Worker
 * ================================================
 * Handles order automation: payment webhooks → supplier ordering → courier booking → Firestore
 *
 * SETUP GUIDE:
 * ============
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file → Save & Deploy
 * 3. Go to Worker Settings → Variables → Add these secrets:
 *
 *    MOYASAR_SECRET_KEY   — from Moyasar Dashboard → Settings → API Keys (Secret Key)
 *    HYPERPAY_TOKEN       — from HyperPay Dashboard → My Account → Authentication Token
 *    HYPERPAY_ENTITY_ID   — from HyperPay Dashboard → My Account → Entity ID
 *    CJ_API_KEY           — from CJ Dropshipping Dashboard → My Account → API Key (password)
 *    CJ_EMAIL             — your CJ Dropshipping account email
 *    ARAMEX_USERNAME      — Aramex account username / login
 *    ARAMEX_PASSWORD      — Aramex account password
 *    ARAMEX_ACCOUNT_NUMBER — Aramex account number (e.g. 12345)
 *    ARAMEX_ACCOUNT_ENTITY — Aramex account entity (e.g. AMM, RUH, DXB)
 *    ARAMEX_ACCOUNT_COUNTRY_CODE — Aramex country code (e.g. SA for Saudi Arabia)
 *    FIREBASE_API_KEY     — AIzaSyCPSsxifbE92WqEa2VsGdSqaJIRTPkZiLQ
 *    WORKER_SECRET        — any random string used to authenticate /api/order/create
 *
 * 4. Copy the Worker URL (e.g. https://ex-global-automation.yourname.workers.dev)
 * 5. Paste that URL in Admin Panel → Settings → API Automation → Automation Worker URL → Save
 *
 * 6. In Moyasar Dashboard → Settings → Webhooks → Add webhook:
 *    URL: https://your-worker.workers.dev/webhook/moyasar
 *    Events: payment.paid, payment.failed
 *
 * ROUTES:
 * =======
 *   POST /webhook/moyasar    — Moyasar payment webhook (verifies HMAC signature)
 *   POST /webhook/hyperpay   — HyperPay alternative webhook
 *   POST /api/order/create   — Create/trigger order manually (requires Authorization: Bearer WORKER_SECRET)
 *   POST /api/order/:id/fulfill — Manually re-trigger supplier+courier for an order
 *   GET  /api/track/:trackingNumber — Get Aramex shipment tracking status
 *   GET  /health             — Health check endpoint
 *
 * FIRESTORE:
 * ==========
 * Orders are stored in: notifications/{orderId}  with  docType: 'order'
 * Project: exglobal21
 */

/* ─────────────────────────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────────────────────────── */

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-moyasar-signature',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

/** Wrap a fetch with a timeout using AbortController */
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

/** Generate a short unique ID for orders */
function genId() {
  return 'ORD' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

/* ─────────────────────────────────────────────────────────────────
   MOYASAR SIGNATURE VERIFICATION
─────────────────────────────────────────────────────────────────── */

/**
 * Verify Moyasar HMAC-SHA256 webhook signature.
 * Header: x-moyasar-signature  (hex-encoded HMAC of raw body)
 * Key: MOYASAR_SECRET_KEY
 */
async function verifyMoyasarSignature(rawBody, signature, secretKey) {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const msgData = encoder.encode(rawBody);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const computed = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return computed === signature;
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────────
   FIRESTORE REST API
   Collection: notifications
   Document path: notifications/{docId}
─────────────────────────────────────────────────────────────────── */

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/exglobal21/databases/(default)/documents';

/** Convert a plain JS object to Firestore fields format */
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

/** Convert Firestore fields back to a plain JS object */
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
 * Write (upsert) a document to Firestore via REST (PATCH = upsert).
 * docId: the document ID inside the 'notifications' collection
 * data: plain JS object
 */
async function firestoreWrite(docId, data, apiKey) {
  const url = `${FIRESTORE_BASE}/notifications/${encodeURIComponent(docId)}?key=${apiKey}`;
  const body = JSON.stringify({ fields: toFirestoreFields(data) });
  const res = await fetchWithTimeout(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  }, 10000);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore write failed (${res.status}): ${errText}`);
  }
  return await res.json();
}

/**
 * Read a Firestore document.
 * Returns plain JS object or null if not found.
 */
async function firestoreRead(docId, apiKey) {
  const url = `${FIRESTORE_BASE}/notifications/${encodeURIComponent(docId)}?key=${apiKey}`;
  const res = await fetchWithTimeout(url, { method: 'GET' }, 10000);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore read failed (${res.status})`);
  const doc = await res.json();
  return fromFirestoreFields(doc.fields || {});
}

/**
 * Append a timeline entry to an order's timeline array.
 * Uses a separate smaller write for resilience.
 */
async function appendTimeline(orderId, entry, apiKey) {
  try {
    const existing = await firestoreRead(orderId, apiKey);
    const timeline = (existing && Array.isArray(existing.timeline)) ? existing.timeline : [];
    timeline.push({ ...entry, ts: new Date().toISOString() });
    await firestoreWrite(orderId, { ...existing, timeline }, apiKey);
  } catch (e) {
    console.error('Timeline append error:', e);
    // Non-fatal — continue execution
  }
}

/* ─────────────────────────────────────────────────────────────────
   CJ DROPSHIPPING API
─────────────────────────────────────────────────────────────────── */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Get a fresh CJ Dropshipping access token.
 * POST /authentication/getAccessToken
 */
async function getCjAccessToken(env) {
  const res = await fetchWithTimeout(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.CJ_EMAIL, password: env.CJ_API_KEY }),
  }, 12000);
  if (!res.ok) throw new Error(`CJ auth failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.data?.accessToken) {
    throw new Error(`CJ auth error: ${data.message || JSON.stringify(data)}`);
  }
  return data.data.accessToken;
}

/**
 * Place a supplier order on CJ Dropshipping.
 * Returns the CJ order ID string.
 *
 * orderPayload fields:
 *   orderId    — our internal order ID (used as CJ's shopOrderId)
 *   products   — [{ vid: variantId, quantity }]
 *   shippingTo — { country, city, address, name, phone, zip }
 */
async function placeCjOrder(orderPayload, env) {
  const token = await getCjAccessToken(env);

  const body = {
    shopOrderId: orderPayload.orderId,
    shippingCountry: orderPayload.shippingTo?.country || 'SA',
    shippingZip: orderPayload.shippingTo?.zip || '',
    shippingCity: orderPayload.shippingTo?.city || '',
    shippingAddress: orderPayload.shippingTo?.address || '',
    shippingCustomerName: orderPayload.shippingTo?.name || '',
    shippingPhone: orderPayload.shippingTo?.phone || '',
    products: (orderPayload.products || []).map(p => ({
      vid: p.vid || p.variantId || '',
      quantity: p.quantity || 1,
      shippingName: p.shippingMethod || 'CJPacket Ordinary',
    })),
    remark: `EX GLOBAL order ${orderPayload.orderId}`,
  };

  const res = await fetchWithTimeout(`${CJ_BASE}/shopping/order/createOrderV2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: JSON.stringify(body),
  }, 15000);

  if (!res.ok) throw new Error(`CJ order create failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.data?.orderId) {
    throw new Error(`CJ order error: ${data.message || JSON.stringify(data)}`);
  }
  return data.data.orderId;
}

/* ─────────────────────────────────────────────────────────────────
   ARAMEX API
   Sender is always EX GLOBAL, Riyadh, Saudi Arabia
─────────────────────────────────────────────────────────────────── */

const ARAMEX_SHIPPING_URL = 'https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments';
const ARAMEX_TRACKING_URL = 'https://ws.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments';

/** Build Aramex client info block from env */
function aramexClientInfo(env) {
  return {
    UserName: env.ARAMEX_USERNAME || '',
    Password: env.ARAMEX_PASSWORD || '',
    Version: 'v1.0',
    AccountNumber: env.ARAMEX_ACCOUNT_NUMBER || '',
    AccountPin: env.ARAMEX_PASSWORD || '',
    AccountEntity: env.ARAMEX_ACCOUNT_ENTITY || 'RUH',
    AccountCountryCode: env.ARAMEX_ACCOUNT_COUNTRY_CODE || 'SA',
    Source: 24,
  };
}

/**
 * Create an Aramex shipment and return the AWB (tracking number).
 *
 * deliveryInfo: { name, phone, city, address, country, zip }
 * packageInfo: { weight (kg), description, value (SAR) }
 */
async function createAramexShipment(orderId, deliveryInfo, packageInfo, env) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

  const payload = {
    ClientInfo: aramexClientInfo(env),
    LabelInfo: { ReportID: 9729, ReportType: 'URL' },
    Shipments: [
      {
        Reference1: orderId,
        Reference2: 'EX GLOBAL',
        Shipper: {
          Reference1: orderId,
          AccountNumber: env.ARAMEX_ACCOUNT_NUMBER || '',
          PartyAddress: {
            Line1: 'Prince Mohammed Bin Abdulaziz Road',
            Line2: 'Al Olaya District',
            Line3: '',
            City: 'Riyadh',
            StateOrProvinceCode: '',
            PostCode: '11564',
            CountryCode: 'SA',
          },
          Contact: {
            Department: '',
            PersonName: 'EX GLOBAL Store',
            Title: '',
            CompanyName: 'EX GLOBAL',
            PhoneNumber1: '00966546224029',
            PhoneNumber1Ext: '',
            PhoneNumber2: '',
            PhoneNumber2Ext: '',
            FaxNumber: '',
            CellPhone: '00966546224029',
            EmailAddress: 'orders@exglobal.online',
            Type: '',
          },
        },
        Consignee: {
          Reference1: orderId,
          AccountNumber: '',
          PartyAddress: {
            Line1: deliveryInfo.address || '',
            Line2: deliveryInfo.district || '',
            Line3: '',
            City: deliveryInfo.city || 'Riyadh',
            StateOrProvinceCode: '',
            PostCode: deliveryInfo.zip || '',
            CountryCode: deliveryInfo.country || 'SA',
          },
          Contact: {
            Department: '',
            PersonName: deliveryInfo.name || '',
            Title: '',
            CompanyName: '',
            PhoneNumber1: deliveryInfo.phone || '',
            PhoneNumber1Ext: '',
            PhoneNumber2: '',
            PhoneNumber2Ext: '',
            FaxNumber: '',
            CellPhone: deliveryInfo.phone || '',
            EmailAddress: deliveryInfo.email || '',
            Type: '',
          },
        },
        TransportType: 0,
        ShippingDateTime: `/Date(${Date.now()})/`,
        DueDate: `/Date(${Date.now() + 86400000 * 3})/`,
        PickupLocation: 'Front Desk',
        PickupGUID: '',
        Comments: `EX GLOBAL Order ${orderId}`,
        AccountingInstruction: '',
        ServiceType: 'CDS',  // Country Domestic Standard
        Products: [],
        Details: {
          Dimensions: { Length: 30, Width: 20, Height: 10, Unit: 'CM' },
          ActualWeight: { Value: packageInfo.weight || 1, Unit: 'KG' },
          ChargeableWeight: null,
          DescriptionOfGoods: packageInfo.description || 'Fashion / Clothing',
          GoodsOriginCountry: 'SA',
          NumberOfPieces: 1,
          ProductGroup: 'EXP',
          ProductType: 'CDS',
          PaymentType: 'P',  // Prepaid
          PaymentOptions: '',
          CustomsValueAmount: { Value: packageInfo.value || 50, CurrencyCode: 'SAR' },
          CashOnDeliveryAmount: { Value: 0, CurrencyCode: 'SAR' },
          InsuranceAmount: { Value: 0, CurrencyCode: 'SAR' },
          CashAdditionalAmount: { Value: 0, CurrencyCode: 'SAR' },
          CashAdditionalAmountDescription: '',
          CollectAmount: { Value: 0, CurrencyCode: 'SAR' },
          Services: '',
          Items: [],
        },
      },
    ],
  };

  const res = await fetchWithTimeout(ARAMEX_SHIPPING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 20000);

  if (!res.ok) throw new Error(`Aramex create shipment failed: HTTP ${res.status}`);
  const data = await res.json();

  // Aramex returns Shipments array with AWBNumber
  const shipment = data?.Shipments?.[0];
  const awb = shipment?.ID?.AWBNumber || shipment?.AWBNumber;
  if (!awb) {
    const errMsg = data?.Notifications?.map(n => n.Message)?.join('; ') || JSON.stringify(data);
    throw new Error(`Aramex no AWB returned: ${errMsg}`);
  }

  const labelUrl = data?.ProcessedShipment?.ShipmentLabel?.LabelURL
    || data?.Shipments?.[0]?.ShipmentLabel?.LabelURL
    || null;

  return { awb, labelUrl };
}

/**
 * Track an Aramex shipment by AWB number.
 * Returns array of tracking events.
 */
async function trackAramexShipment(awb, env) {
  const payload = {
    ClientInfo: aramexClientInfo(env),
    Shipments: [awb],
    GetLastTrackingUpdateOnly: false,
  };

  const res = await fetchWithTimeout(ARAMEX_TRACKING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 15000);

  if (!res.ok) throw new Error(`Aramex tracking failed: HTTP ${res.status}`);
  const data = await res.json();

  const trackResult = data?.TrackingResults?.[0]?.Value || [];
  const events = trackResult.map(e => ({
    date: e.UpdateDateTime,
    status: e.UpdateDescription || e.UpdateCode,
    location: e.UpdateLocation,
  }));

  return {
    awb,
    status: trackResult?.[0]?.UpdateDescription || 'Unknown',
    events,
    raw: data,
  };
}

/* ─────────────────────────────────────────────────────────────────
   CORE ORDER PROCESSING PIPELINE
─────────────────────────────────────────────────────────────────── */

/**
 * Main pipeline: called after payment is confirmed.
 * Steps run in parallel where possible; failures are logged but don't stop the pipeline.
 *
 * order shape:
 * {
 *   id, date, totalSAR,
 *   customer: { name, email, phone },
 *   address: { name, phone, city, district, address, country, zip },
 *   items: [{ id, name, price, qty, size, color, cjVariantId? }],
 *   paymentId, paymentMethod, status
 * }
 */
async function processOrder(order, env) {
  const orderId = order.id;
  console.log(`[processOrder] Starting pipeline for ${orderId}`);

  // ─── Step 1: Save order to Firestore with status 'confirmed' ───
  try {
    await firestoreWrite(orderId, {
      ...order,
      docType: 'order',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      timeline: [{ event: 'payment_confirmed', ts: new Date().toISOString(), details: `Payment ${order.paymentId} confirmed` }],
    }, env.FIREBASE_API_KEY);
    console.log(`[processOrder] ${orderId}: Saved to Firestore`);
  } catch (e) {
    console.error(`[processOrder] ${orderId}: Firestore initial save failed:`, e.message);
    // Even if save fails, continue — we'll try to update later
  }

  // ─── Steps 2 & 3: Place supplier order + book courier (parallel) ───
  let supplierOrderId = null;
  let supplierError = null;
  let trackingNumber = null;
  let labelUrl = null;
  let courierError = null;

  // Build shipping address for both APIs
  const shippingTo = {
    name: order.address?.name || order.customer?.name || '',
    phone: order.address?.phone || order.customer?.phone || '',
    city: order.address?.city || 'Riyadh',
    district: order.address?.district || '',
    address: order.address?.address || order.address?.street || '',
    country: order.address?.country || 'SA',
    zip: order.address?.zip || '',
    email: order.customer?.email || '',
  };

  // CJ Dropshipping products list (only items with a cjVariantId)
  const cjProducts = (order.items || [])
    .filter(i => i.cjVariantId)
    .map(i => ({ vid: i.cjVariantId, quantity: i.qty || 1 }));

  // Package info for Aramex
  const packageInfo = {
    weight: Math.max(0.5, (order.items || []).reduce((s, i) => s + (i.weight || 0.2) * (i.qty || 1), 0)),
    description: (order.items || []).map(i => i.name).join(', ').slice(0, 100) || 'Fashion items',
    value: order.totalSAR || 50,
  };

  // Run supplier and courier in parallel
  const [supplierResult, courierResult] = await Promise.allSettled([
    // CJ Dropshipping — only if we have CJ credentials and variant IDs
    (env.CJ_API_KEY && env.CJ_EMAIL && cjProducts.length > 0)
      ? placeCjOrder({ orderId, products: cjProducts, shippingTo }, env)
          .then(id => ({ success: true, supplierOrderId: id }))
          .catch(e => ({ success: false, error: e.message }))
      : Promise.resolve({ success: false, error: 'CJ not configured or no CJ variant IDs' }),

    // Aramex — only if credentials are configured
    (env.ARAMEX_USERNAME && env.ARAMEX_PASSWORD && env.ARAMEX_ACCOUNT_NUMBER)
      ? createAramexShipment(orderId, shippingTo, packageInfo, env)
          .then(r => ({ success: true, ...r }))
          .catch(e => ({ success: false, error: e.message }))
      : Promise.resolve({ success: false, error: 'Aramex not configured' }),
  ]);

  // Extract supplier result
  if (supplierResult.status === 'fulfilled' && supplierResult.value?.success) {
    supplierOrderId = supplierResult.value.supplierOrderId;
    console.log(`[processOrder] ${orderId}: CJ order placed: ${supplierOrderId}`);
  } else {
    supplierError = supplierResult.value?.error || supplierResult.reason?.message || 'Unknown error';
    console.warn(`[processOrder] ${orderId}: CJ failed: ${supplierError}`);
  }

  // Extract courier result
  if (courierResult.status === 'fulfilled' && courierResult.value?.success) {
    trackingNumber = courierResult.value.awb;
    labelUrl = courierResult.value.labelUrl || null;
    console.log(`[processOrder] ${orderId}: Aramex AWB: ${trackingNumber}`);
  } else {
    courierError = courierResult.value?.error || courierResult.reason?.message || 'Unknown error';
    console.warn(`[processOrder] ${orderId}: Aramex failed: ${courierError}`);
  }

  // ─── Step 4: Update Firestore with results ───
  const finalStatus = trackingNumber ? 'shipped' : (supplierOrderId ? 'processing' : 'confirmed');

  const updateData = {
    status: finalStatus,
    updatedAt: new Date().toISOString(),
    ...(supplierOrderId ? { supplierOrderId } : {}),
    ...(supplierError ? { supplierError } : {}),
    ...(trackingNumber ? { trackingNumber } : {}),
    ...(labelUrl ? { labelUrl } : {}),
    ...(courierError ? { courierError } : {}),
  };

  // Build timeline entries for each step
  const timelineEntries = [];
  if (supplierOrderId) {
    timelineEntries.push({ event: 'supplier_ordered', details: `CJ order: ${supplierOrderId}`, ts: new Date().toISOString() });
  } else if (supplierError) {
    timelineEntries.push({ event: 'supplier_failed', details: supplierError, ts: new Date().toISOString() });
  }
  if (trackingNumber) {
    timelineEntries.push({ event: 'shipment_created', details: `Aramex AWB: ${trackingNumber}`, ts: new Date().toISOString() });
  } else if (courierError) {
    timelineEntries.push({ event: 'courier_failed', details: courierError, ts: new Date().toISOString() });
  }
  timelineEntries.push({ event: 'pipeline_complete', details: `Final status: ${finalStatus}`, ts: new Date().toISOString() });

  try {
    // Read current doc to merge timeline
    const existing = await firestoreRead(orderId, env.FIREBASE_API_KEY);
    const prevTimeline = (existing && Array.isArray(existing.timeline)) ? existing.timeline : [];
    await firestoreWrite(orderId, {
      ...(existing || {}),
      ...order,
      docType: 'order',
      ...updateData,
      timeline: [...prevTimeline, ...timelineEntries],
    }, env.FIREBASE_API_KEY);
    console.log(`[processOrder] ${orderId}: Firestore updated, status=${finalStatus}`);
  } catch (e) {
    console.error(`[processOrder] ${orderId}: Firestore update failed:`, e.message);
  }

  return { orderId, status: finalStatus, supplierOrderId, trackingNumber, supplierError, courierError };
}

/* ─────────────────────────────────────────────────────────────────
   WEBHOOK HANDLERS
─────────────────────────────────────────────────────────────────── */

/**
 * POST /webhook/moyasar
 * Moyasar sends payment events with x-moyasar-signature header.
 * Payload: { type: 'payment.paid'|'payment.failed', data: { id, amount, currency, status, metadata: {...} } }
 */
async function handleMoyasarWebhook(request, env) {
  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-moyasar-signature') || '';

  // Verify signature (only if secret is configured)
  if (env.MOYASAR_SECRET_KEY) {
    const valid = await verifyMoyasarSignature(rawBody, signature, env.MOYASAR_SECRET_KEY);
    if (!valid) {
      console.warn('[Moyasar] Invalid signature');
      return json({ error: 'Invalid signature' }, 401);
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { type, data: paymentData } = payload;

  // Only handle successful payments
  if (type !== 'payment.paid') {
    console.log(`[Moyasar] Ignoring event type: ${type}`);
    return json({ received: true, action: 'ignored', reason: `event type ${type}` });
  }

  if (!paymentData) {
    return json({ error: 'Missing payment data' }, 400);
  }

  // Extract order data from Moyasar payment metadata
  // The metadata should be populated when the payment is created from script.js
  const meta = paymentData.metadata || {};
  const orderId = meta.orderId || `ORD-MOYASAR-${paymentData.id}`;

  const order = {
    id: orderId,
    date: new Date().toISOString(),
    paymentId: paymentData.id,
    paymentMethod: 'moyasar',
    paymentGateway: 'moyasar',
    totalSAR: Math.round((paymentData.amount || 0) / 100), // Moyasar uses halalas
    currency: paymentData.currency || 'SAR',
    customer: {
      name: meta.customerName || paymentData.source?.name || '',
      email: meta.customerEmail || paymentData.source?.email || '',
      phone: meta.customerPhone || '',
    },
    address: {
      name: meta.addressName || meta.customerName || '',
      phone: meta.addressPhone || meta.customerPhone || '',
      city: meta.city || '',
      district: meta.district || '',
      address: meta.address || meta.street || '',
      country: meta.country || 'SA',
      zip: meta.zip || '',
    },
    items: (() => {
      try { return JSON.parse(meta.items || '[]'); } catch { return []; }
    })(),
    status: 'confirmed',
  };

  console.log(`[Moyasar] Processing order ${orderId}, amount: ${order.totalSAR} SAR`);

  // Run the automation pipeline
  try {
    const result = await processOrder(order, env);
    return json({ received: true, orderId, result });
  } catch (e) {
    console.error('[Moyasar] processOrder error:', e);
    // Return 200 so Moyasar doesn't retry — we log the failure
    return json({ received: true, orderId, error: e.message });
  }
}

/**
 * POST /webhook/hyperpay
 * HyperPay sends a resourcePath query param; we fetch the payment result.
 * Body: { type: 'PAYMENT', payload: { id, ... } }
 */
async function handleHyperPayWebhook(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // HyperPay webhook delivers resourcePath — fetch the actual transaction
  const resourcePath = body.payload?.resourcePath || body.resourcePath;
  if (!resourcePath) {
    return json({ error: 'No resourcePath in webhook' }, 400);
  }

  // Fetch the payment status from HyperPay
  let payment;
  try {
    const hpUrl = `https://eu-test.oppwa.com${resourcePath}?entityId=${env.HYPERPAY_ENTITY_ID}`;
    const hpRes = await fetchWithTimeout(hpUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${env.HYPERPAY_TOKEN}` },
    }, 12000);
    payment = await hpRes.json();
  } catch (e) {
    return json({ error: `HyperPay fetch failed: ${e.message}` }, 500);
  }

  // Check result codes — successful payment codes start with 000.000.xxx
  const resultCode = payment.result?.code || '';
  const isSuccess = /^000\.000\.|^000\.100\.1|^000\.[36]/.test(resultCode);
  if (!isSuccess) {
    console.log(`[HyperPay] Payment not successful: ${resultCode}`);
    return json({ received: true, action: 'ignored', code: resultCode });
  }

  const customParams = payment.customParameters || {};
  const orderId = customParams.orderId || `ORD-HP-${payment.id}`;

  const order = {
    id: orderId,
    date: new Date().toISOString(),
    paymentId: payment.id,
    paymentMethod: 'card',
    paymentGateway: 'hyperpay',
    totalSAR: Math.round(parseFloat(payment.amount || 0)),
    currency: payment.currency || 'SAR',
    customer: {
      name: customParams.customerName || payment.customer?.givenName || '',
      email: customParams.customerEmail || payment.customer?.email || '',
      phone: customParams.customerPhone || '',
    },
    address: {
      name: customParams.addressName || '',
      phone: customParams.addressPhone || '',
      city: customParams.city || '',
      address: customParams.address || '',
      country: customParams.country || 'SA',
      zip: customParams.zip || '',
    },
    items: (() => {
      try { return JSON.parse(customParams.items || '[]'); } catch { return []; }
    })(),
    status: 'confirmed',
  };

  try {
    const result = await processOrder(order, env);
    return json({ received: true, orderId, result });
  } catch (e) {
    return json({ received: true, orderId, error: e.message });
  }
}

/* ─────────────────────────────────────────────────────────────────
   API ENDPOINTS
─────────────────────────────────────────────────────────────────── */

/**
 * POST /api/order/create
 * Manually create and process an order (admin use).
 * Requires header: Authorization: Bearer <WORKER_SECRET>
 * Body: order object (same shape as processOrder expects)
 */
async function handleCreateOrder(request, env) {
  // Auth check
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!env.WORKER_SECRET || token !== env.WORKER_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let order;
  try {
    order = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!order.id) order.id = genId();
  if (!order.date) order.date = new Date().toISOString();
  if (!order.status) order.status = 'confirmed';

  try {
    const result = await processOrder(order, env);
    return json({ success: true, result });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/**
 * POST /api/order/:id/fulfill
 * Re-trigger the supplier+courier pipeline for an existing order.
 * Requires Authorization: Bearer <WORKER_SECRET>
 */
async function handleFulfillOrder(orderId, request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!env.WORKER_SECRET || token !== env.WORKER_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Read existing order from Firestore
  let existingOrder;
  try {
    existingOrder = await firestoreRead(orderId, env.FIREBASE_API_KEY);
  } catch (e) {
    return json({ error: `Could not read order: ${e.message}` }, 500);
  }

  if (!existingOrder) {
    return json({ error: `Order ${orderId} not found` }, 404);
  }

  // Allow overrides from request body
  let overrides = {};
  try {
    overrides = await request.json();
  } catch { /* no body, fine */ }

  const order = { ...existingOrder, ...overrides, id: orderId };

  try {
    const result = await processOrder(order, env);
    return json({ success: true, result });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/**
 * GET /api/track/:trackingNumber
 * Get Aramex tracking status for an AWB.
 */
async function handleTrackShipment(trackingNumber, env) {
  if (!env.ARAMEX_USERNAME) {
    return json({ error: 'Aramex not configured' }, 503);
  }
  try {
    const result = await trackAramexShipment(trackingNumber, env);
    return json({ success: true, ...result });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
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

    // ── GET /health
    if (request.method === 'GET' && path === '/health') {
      return json({
        status: 'ok',
        service: 'EX GLOBAL Automation Worker',
        timestamp: new Date().toISOString(),
        configured: {
          moyasar: !!env.MOYASAR_SECRET_KEY,
          hyperpay: !!(env.HYPERPAY_TOKEN && env.HYPERPAY_ENTITY_ID),
          cj: !!(env.CJ_API_KEY && env.CJ_EMAIL),
          aramex: !!(env.ARAMEX_USERNAME && env.ARAMEX_PASSWORD && env.ARAMEX_ACCOUNT_NUMBER),
          firebase: !!env.FIREBASE_API_KEY,
        },
      });
    }

    // ── POST /webhook/moyasar
    if (request.method === 'POST' && path === '/webhook/moyasar') {
      return handleMoyasarWebhook(request, env);
    }

    // ── POST /webhook/hyperpay
    if (request.method === 'POST' && path === '/webhook/hyperpay') {
      return handleHyperPayWebhook(request, env);
    }

    // ── POST /api/order/create
    if (request.method === 'POST' && path === '/api/order/create') {
      return handleCreateOrder(request, env);
    }

    // ── POST /api/order/:id/fulfill
    const fulfillMatch = path.match(/^\/api\/order\/([^/]+)\/fulfill$/);
    if (request.method === 'POST' && fulfillMatch) {
      return handleFulfillOrder(fulfillMatch[1], request, env);
    }

    // ── GET /api/track/:trackingNumber
    const trackMatch = path.match(/^\/api\/track\/([^/]+)$/);
    if (request.method === 'GET' && trackMatch) {
      return handleTrackShipment(decodeURIComponent(trackMatch[1]), env);
    }

    // 404 fallback
    return json({ error: 'Not found', path }, 404);
  },
};
