const functions = require('firebase-functions');
const Razorpay = require('razorpay');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
const axios = require('axios');
// Initialize the Firebase Admin SDK for server-side Firestore access
const admin = require('firebase-admin');

// 1. Initialize Admin SDK (for Firestore access)
admin.initializeApp();
const db = admin.firestore();

// 2. Lazy Razorpay initializer: avoid reading functions.config() at module load time
// because missing config values will throw and cause the function to crash before
// it can respond to preflight requests. We read the keys inside handlers.
function getRazorpayInstance() {
  try {
    const cfg = functions.config && functions.config().razorpay ? functions.config().razorpay : null;
    if (!cfg || !cfg.key_id || !cfg.key_secret) return null;
    return new Razorpay({ key_id: cfg.key_id, key_secret: cfg.key_secret });
  } catch (e) {
    // If functions.config() throws, return null so handlers can reply gracefully.
    console.warn('Failed to read functions.config for razorpay:', e && e.message);
    return null;
  }
}

// --------------------------------------------------------------------------------
// FUNCTION 1: CREATE ORDER (Called by Frontend to initiate payment)
// --------------------------------------------------------------------------------
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    
    const { amount, currency = 'INR' } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    try {
      const razorpay = getRazorpayInstance();
      if (!razorpay) {
        console.error('Razorpay keys are not configured (createRazorpayOrder)');
        return res.status(500).json({ error: 'Razorpay keys not configured' });
      }

      const order = await razorpay.orders.create({
        amount: amount * 100, // amount in paise
        currency,
        receipt: `receipt_${Date.now()}`
      });
      return res.status(200).json(order);
    } catch (err) {
      console.error("Razorpay Order Creation Error:", err);
      return res.status(500).json({ error: 'Failed to create order on payment gateway.' });
    }
  });
});

// --------------------------------------------------------------------------------
// FUNCTION 2: VERIFY PAYMENT (Called by Frontend AFTER successful payment)
// --------------------------------------------------------------------------------
exports.verifyRazorpayPayment = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    // Data includes verification details + all order data sent from Checkout.jsx
    const { 
        orderId, paymentId, signature, 
        cartItems, total, shippingForm, userId, saveForFuture 
    } = req.body;
    
  // Get the SECRET key from the secure functions config (safely)
  const cfg = functions.config && functions.config().razorpay ? functions.config().razorpay : null;
  const key_secret = cfg ? cfg.key_secret : null;

  if (!orderId || !paymentId || !signature || !key_secret || !userId) {
        return res.status(400).json({ status: 'failure', message: 'Missing required details.' });
    }

    try {
        // Step 1: Signature Verification (CRITICAL SECURITY CHECK)
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto.createHmac('sha256', key_secret)
                                      .update(body.toString())
                                      .digest('hex');

        const isAuthentic = expectedSignature === signature;

        if (!isAuthentic) {
            return res.status(400).json({ status: 'failure', message: 'Payment verification failed (Signature Mismatch).' });
        }

        // Step 2: Verification SUCCESS! Save Order to Firestore (using Admin SDK)
    await db.collection('orders').add({
            userId: userId,
            items: cartItems,
            date: admin.firestore.FieldValue.serverTimestamp(),
            total: total,
      // mark newly verified payments as 'In Process' so admin can manage fulfillment
      status: 'In Process',
            shipping: shippingForm,
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            razorpaySignature: signature
        });
        
        // Save address for future
        if (saveForFuture) {
            await db.collection('users').doc(userId).set({ 
                address: shippingForm 
            }, { merge: true });
        }
    // All done
    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ status: 'failure', message: 'Internal server error.' });
  }
  });
});

// --------------------------------------------------------------------------------
// FUNCTION 3: CREATE STANDARD CHECKOUT PREFERENCE (proxy)
// Frontend should NOT call api.razorpay.com directly; this forwards the request
// server-side using the secret key stored in functions.config().razorpay
// --------------------------------------------------------------------------------
exports.createRazorpayPreference = functions.https.onRequest((req, res) => {
  // Ensure CORS headers are always present
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const key_id = functions.config().razorpay.key_id;
    const key_secret = functions.config().razorpay.key_secret;
    if (!key_id || !key_secret) {
      return res.status(500).json({ error: 'Razorpay keys not configured' });
    }

    try {
      const payload = req.body || {};
      // Build Basic Auth header
      const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

      // Call Razorpay Standard Checkout Preferences API
      const rr = await fetch('https://api.razorpay.com/v1/standard_checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await rr.json().catch(() => ({}));
      if (!rr.ok) {
        return res.status(rr.status).json({ error: data });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Error forwarding preference to Razorpay:', err);
      return res.status(500).json({ error: 'internal_server_error' });
    }
  });
});

// ================================================================================
// SHIPROCKET INTEGRATION
// ================================================================================

// Firestore collection path for storing Shiprocket token
const SHIPROCKET_TOKEN_COLLECTION = 'apiTokens';
const SHIPROCKET_TOKEN_DOC = 'shiprocket';

// Token validity period (240 hours = 10 days)
const TOKEN_VALIDITY_HOURS = 240;
const TOKEN_REFRESH_THRESHOLD_HOURS = 230; // Refresh if less than 230 hours remaining

/**
 * Helper Function: Get valid Shiprocket Bearer Token
 * - Checks Firestore for existing token and expiration
 * - Returns cached token if valid
 * - Generates new token if expired/missing and updates Firestore
 */
async function getShiprocketToken() {
  try {
    // Step 1: Check Firestore for existing token
    const tokenDoc = await db.collection(SHIPROCKET_TOKEN_COLLECTION).doc(SHIPROCKET_TOKEN_DOC).get();
    
    if (tokenDoc.exists) {
      const data = tokenDoc.data();
      const { token, expiresAt } = data;
      
      // Check if token is still valid (not expired or near expiry)
      if (token && expiresAt && expiresAt.toMillis() > Date.now()) {
        const hoursRemaining = (expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60);
        
        if (hoursRemaining > TOKEN_REFRESH_THRESHOLD_HOURS) {
          console.log(`Using cached Shiprocket token (valid for ${hoursRemaining.toFixed(1)} more hours)`);
          return token;
        }
      }
    }
    
    // Step 2: Token missing or expired - get new token from Shiprocket
    console.log('Fetching new Shiprocket token...');
    
    // Get credentials from Firebase config (set via CLI)
    const shiprocketConfig = functions.config().shiprocket || {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    };

    if (!shiprocketConfig || !shiprocketConfig.email || !shiprocketConfig.password) {
      throw new Error('Shiprocket credentials not configured. Set firebase functions config or env SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD');
    }
    
    // Call Shiprocket Auth API
    const authResponse = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: shiprocketConfig.email,
      password: shiprocketConfig.password
    });
    
    if (!authResponse.data || !authResponse.data.token) {
      throw new Error('Failed to get token from Shiprocket API');
    }
    
    const newToken = authResponse.data.token;
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + (TOKEN_VALIDITY_HOURS * 60 * 60 * 1000));
    
    // Step 3: Update Firestore with new token and expiration
    await db.collection(SHIPROCKET_TOKEN_COLLECTION).doc(SHIPROCKET_TOKEN_DOC).set({
      token: newToken,
      expiresAt: expiresAt,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('New Shiprocket token stored successfully');
    return newToken;
    
  } catch (error) {
    console.error('Error getting Shiprocket token:', error.message);
    throw error;
  }
}

/**
 * Cloud Function: Create Shiprocket Order
 * - Callable function (requires Firebase Auth)
 * - Gets valid Bearer token via getShiprocketToken()
 * - Calls Shiprocket Order Creation API
 * - Returns order_id and shipment_id to client
 */
exports.createShiprocketOrder = functions.region('asia-south1').https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create orders');
  }
  
  try {
    // Step 1: Get valid Shiprocket token
    const token = await getShiprocketToken();
    
    // Step 2: Validate order data
      const incoming = data.orderData;
      if (!incoming || typeof incoming !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'orderData is required');
      }

      // Server-side robust defaults (mirror frontend fallbacks)
      const DEFAULTS = {
        name: 'Customer',
        address: 'Sansad Marg',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
        email: 'no-reply@boldandbrew.in',
        phone: '9999999999',
        pickup_location: 'Primary'
      };

      const sanitize = (val, fallback) => {
        const v = (val === undefined || val === null ? '' : String(val)).trim();
        return v.length ? v : fallback;
      };

      // Extract and sanitize billing
      const billing_customer_name = sanitize(incoming.billing_customer_name, DEFAULTS.name);
      const billing_address       = sanitize(incoming.billing_address, DEFAULTS.address);
      const billing_address_2     = sanitize(incoming.billing_address_2, '');
      let billing_pincode         = sanitize(incoming.billing_pincode, DEFAULTS.pincode).replace(/\D/g,'');
      if (billing_pincode.length !== 6) billing_pincode = DEFAULTS.pincode;
      const billing_city          = sanitize(incoming.billing_city, DEFAULTS.city);
      const billing_state         = sanitize(incoming.billing_state, DEFAULTS.state);
      const billing_country       = sanitize(incoming.billing_country, DEFAULTS.country);
      const billing_email         = sanitize(incoming.billing_email, DEFAULTS.email);
      let billing_phone           = sanitize(incoming.billing_phone, DEFAULTS.phone).replace(/\D/g,'');
      if (billing_phone.length !== 10) billing_phone = DEFAULTS.phone;

      // Shipping (even if shipping_is_billing true ensure values present)
      const shipping_is_billing   = !!incoming.shipping_is_billing;
      const shipping_customer_name= sanitize(incoming.shipping_customer_name, billing_customer_name);
      const shipping_address      = sanitize(incoming.shipping_address, billing_address);
      const shipping_address_2    = sanitize(incoming.shipping_address_2, '');
      let shipping_pincode        = sanitize(incoming.shipping_pincode, billing_pincode).replace(/\D/g,'');
      if (shipping_pincode.length !== 6) shipping_pincode = billing_pincode;
      const shipping_city         = sanitize(incoming.shipping_city, billing_city);
      const shipping_state        = sanitize(incoming.shipping_state, billing_state);
      const shipping_country      = sanitize(incoming.shipping_country, billing_country);
      const shipping_email        = sanitize(incoming.shipping_email, billing_email);
      let shipping_phone          = sanitize(incoming.shipping_phone, billing_phone).replace(/\D/g,'');
      if (shipping_phone.length !== 10) shipping_phone = billing_phone;

      const pickup_location       = sanitize(incoming.pickup_location, DEFAULTS.pickup_location);
      const order_id              = sanitize(incoming.order_id, String(Date.now()));
      const order_date            = sanitize(incoming.order_date, new Date().toISOString().split('T')[0] + ' 12:00');
      const payment_method        = sanitize(incoming.payment_method, 'Prepaid');

      // Sanitize items
      const order_items = Array.isArray(incoming.order_items) ? incoming.order_items.map(it => {
        const name = sanitize(it.name, 'Product').substring(0,50);
        const sku  = sanitize(it.sku || it.id, 'SKU' + Date.now());
        const units = parseInt(it.units || it.quantity || 1, 10);
        let selling_price = it.selling_price;
        if (selling_price === undefined || selling_price === null || selling_price === '') selling_price = 0;
        selling_price = Math.round(parseFloat(selling_price) || 0);
        return {
          name,
          sku,
          units: units > 0 ? units : 1,
          selling_price,
          discount: sanitize(it.discount, ''),
          tax: sanitize(it.tax, ''),
          hsn: it.hsn || 446
        };
      }) : [];
      if (!order_items.length) {
        throw new functions.https.HttpsError('invalid-argument','order_items required');
      }

      const numeric = (val, fallback=0) => {
        if (val === undefined || val === null || val === '') return fallback;
        const n = parseFloat(val);
        return isNaN(n) ? fallback : n;
      };

      const length = numeric(incoming.length,15);
      const breadth= numeric(incoming.breadth,15);
      const height = numeric(incoming.height,15);
      const weight = numeric(incoming.weight,0.5);
      const sub_total = numeric(incoming.sub_total, order_items.reduce((s,i)=> s + i.selling_price * i.units,0));
      const shipping_charges = numeric(incoming.shipping_charges,0);
      const total_discount   = numeric(incoming.total_discount,0);

      const sanitizedOrder = {
        order_id,
        order_date,
        pickup_location,
        channel_id: sanitize(incoming.channel_id,'') ,
        comment: sanitize(incoming.comment,'Order from Bold & Brew'),
        billing_customer_name,
        billing_last_name: sanitize(incoming.billing_last_name,'') ,
        billing_address,
        billing_address_2,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        shipping_customer_name,
        shipping_last_name: sanitize(incoming.shipping_last_name,'') ,
        shipping_address,
        shipping_address_2,
        shipping_city,
        shipping_pincode,
        shipping_country,
        shipping_state,
        shipping_email,
        shipping_phone,
        order_items,
        payment_method,
        shipping_charges,
        giftwrap_charges: numeric(incoming.giftwrap_charges,0),
        transaction_charges: numeric(incoming.transaction_charges,0),
        total_discount,
        sub_total,
        length,
        breadth,
        height,
        weight
      };

      // Log original vs sanitized for diagnostics
      console.log('Original incoming payload (truncated):', JSON.stringify(incoming, null, 2).substring(0,2000));
      console.log('Sanitized payload sent to Shiprocket:', JSON.stringify(sanitizedOrder, null, 2));

      // Enforce configured pickup location from functions config if present
      try {
        const configuredPickup = functions.config && functions.config().shiprocket && functions.config().shiprocket.pickup_name
          ? String(functions.config().shiprocket.pickup_name).trim()
          : null;
        if (configuredPickup) {
          sanitizedOrder.pickup_location = configuredPickup;
          console.log('Overriding pickup_location with configured value:', configuredPickup);
        } else {
          console.warn('No configured shiprocket.pickup_name found; using provided pickup_location:', sanitizedOrder.pickup_location);
        }
      } catch (cfgErr) {
        console.warn('Failed to read configured pickup_name; proceeding with existing pickup_location. Error:', cfgErr.message);
      }

      // Server-side required field validation before calling Shiprocket
      const requiredBilling = [
        'billing_customer_name','billing_address','billing_city','billing_state','billing_pincode','billing_country','billing_email','billing_phone'
      ];
      const requiredShipping = [
        'shipping_customer_name','shipping_address','shipping_city','shipping_state','shipping_pincode','shipping_country','shipping_email','shipping_phone'
      ];
      const missing = [];
      [...requiredBilling, ...requiredShipping, 'pickup_location','order_id','order_date'].forEach(f => {
        const val = sanitizedOrder[f];
        if (val === undefined || val === null || String(val).trim() === '') missing.push(f);
      });
      if (!sanitizedOrder.order_items || !sanitizedOrder.order_items.length) {
        missing.push('order_items');
      }
      if (missing.length) {
        console.error('Blocking Shiprocket call due to missing sanitized fields:', missing);
        throw new functions.https.HttpsError('invalid-argument', 'Missing required address fields', { missing });
      }

      const orderData = sanitizedOrder;
    
    // Step 3: Call Shiprocket Order Creation API
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Step 4: Return Shiprocket response to client
    console.log('Shiprocket order created successfully:', response.data);
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    // Log detailed error information
    console.error('Shiprocket order creation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Return detailed error to client
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create Shiprocket order';
    throw new functions.https.HttpsError(
      'internal',
      errorMessage,
      { 
        details: error.response?.data,
        status: error.response?.status
      }
    );
  }
});

/**
 * Cloud Function: List Shiprocket Pickup Addresses
 * - Callable (requires auth)
 * - Returns array of configured pickup addresses (name, id, address, pincode, etc.)
 * - Helps determine the exact pickup name or ID to use in order creation.
 */
exports.listPickupAddresses = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) return { success: false, message: 'Auth required.' };
  try {
    const token = await getShiprocketToken();
    if (!token) return { success: false, message: 'Shiprocket token error.' };
    const url = 'https://apiv2.shiprocket.in/v1/external/settings/company/addresses/pickup';
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(url, { headers });
    const addresses = response.data?.data || [];
    const allowedPickups = ['Home'];
    const filtered = addresses.filter(a => allowedPickups.includes(a.name));
    const configuredPickup = filtered.length ? filtered[0].name : (addresses[0]?.name || 'Home');
    return { success: true, addresses: filtered.length ? filtered : addresses, configuredPickup };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to retrieve pickup addresses.' };
  }
});
// --- Create Shiprocket Order (Callable) ---
exports.createShiprocketOrder = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) return { success: false, message: 'Auth required.' };
  const order = data.orderData || {};
  const requiredFields = [
    'order_id', 'order_date', 'pickup_location',
    'billing_customer_name', 'billing_address', 'billing_city', 'billing_pincode',
    'billing_state', 'billing_country', 'billing_email', 'billing_phone',
    'order_items', 'payment_method', 'sub_total'
  ];
  for (const field of requiredFields) {
    if (!order[field] || (Array.isArray(order[field]) && !order[field].length)) {
      return { success: false, message: `Missing required field: ${field}` };
    }
  }
  for (const item of order.order_items) {
    if (!item.name || !item.sku || !item.units || !item.selling_price) {
      return { success: false, message: 'Each order item must have name, sku, units, selling_price' };
    }
  }
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(order.order_date)) {
    return { success: false, message: 'order_date must be in YYYY-MM-DD HH:MM format' };
  }
  const allowedPickups = ['Home'];
  if (!allowedPickups.includes(order.pickup_location)) {
    return { success: false, message: 'pickup_location must be a known nickname (e.g. "Home")' };
  }
  const payload = {
    order_id: order.order_id,
    order_date: order.order_date,
    pickup_location: order.pickup_location,
    channel_id: order.channel_id || '',
    comment: order.comment || 'Order from Bold & Brew',
    billing_customer_name: order.billing_customer_name,
    billing_last_name: order.billing_last_name || '',
    billing_address: order.billing_address,
    billing_address_2: order.billing_address_2 || '',
    billing_city: order.billing_city,
    billing_pincode: order.billing_pincode,
    billing_state: order.billing_state,
    billing_country: order.billing_country,
    billing_email: order.billing_email,
    billing_phone: order.billing_phone,
    shipping_is_billing: order.shipping_is_billing !== false,
    shipping_customer_name: order.shipping_customer_name || order.billing_customer_name,
    shipping_last_name: order.shipping_last_name || '',
    shipping_address: order.shipping_address || order.billing_address,
    shipping_address_2: order.shipping_address_2 || '',
    shipping_city: order.shipping_city || order.billing_city,
    shipping_pincode: order.shipping_pincode || order.billing_pincode,
    shipping_country: order.shipping_country || order.billing_country,
    shipping_state: order.shipping_state || order.billing_state,
    shipping_email: order.shipping_email || order.billing_email,
    shipping_phone: order.shipping_phone || order.billing_phone,
    order_items: order.order_items.map(item => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.selling_price,
      discount: item.discount || 0,
      tax: item.tax || 0,
      hsn: item.hsn || 0
    })),
    payment_method: order.payment_method,
    shipping_charges: order.shipping_charges || 0,
    giftwrap_charges: order.giftwrap_charges || 0,
    transaction_charges: order.transaction_charges || 0,
    total_discount: order.total_discount || 0,
    sub_total: order.sub_total,
    length: order.length || 15,
    breadth: order.breadth || 15,
    height: order.height || 15,
    weight: order.weight || 0.5
  };
  try {
    const token = await getShiprocketToken();
    if (!token) return { success: false, message: 'Shiprocket token error.' };
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const sr = response.data;
    return {
      success: true,
      order_id: sr.order_id,
      shipment_id: sr.shipment_id,
      status: sr.status,
      ...sr
    };
  } catch (err) {
    const sr = err.response?.data || {};
    return {
      success: false,
      message: sr.message || err.message || 'Failed to create Shiprocket order',
      ...sr
    };
  }
});

/**
 * Cloud Function: Get Shipment Rates (Serviceability)
 * - Callable (requires auth)
 * - Accepts either shipment_id OR destination pincode + weight
 * - Returns list of available courier companies with rates
 */
exports.getShipmentRates = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
  }
  try {
    const token = await getShiprocketToken();
    const weight = parseFloat(data.weight || 0.5) || 0.5;
    const deliveryPincode = String(data.delivery_pincode || data.pincode || '').trim();
    const pickupPincode = String(data.pickup_pincode || '110019'); // default to your verified pickup
    const cod = data.cod ? 1 : 0;
    if (!deliveryPincode || deliveryPincode.length !== 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid delivery_pincode (6 digits) is required');
    }
    const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod}`;
    const resp = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const availableCourier = resp.data?.data?.available_courier_companies || [];
    return { success: true, pickup_postcode: pickupPincode, delivery_postcode: deliveryPincode, weight, cod, couriers: availableCourier };
  } catch (error) {
    console.error('Rate serviceability error:', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Failed to fetch rates', error.response?.data || { message: error.message });
  }
});

/**
 * Cloud Function: Assign AWB (Courier selection)
 * - Callable (requires auth)
 * - Requires shipment_id + courier_id (from getShipmentRates response)
 * - Returns assignment status
 */
exports.assignAWB = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
  }
  const shipmentId = data.shipment_id || data.shipmentId;
  const courierId = data.courier_id || data.courierId;
  if (!shipmentId || !courierId) {
    throw new functions.https.HttpsError('invalid-argument', 'shipment_id and courier_id are required');
  }
  try {
    const token = await getShiprocketToken();
    const resp = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      shipment_id: shipmentId,
      courier_id: courierId
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return { success: true, data: resp.data };
  } catch (error) {
    console.error('AWB assignment error:', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Failed to assign AWB', error.response?.data || { message: error.message });
  }
});

// REMOVE diagnostic listPickupAddresses (no longer needed)
// (Leaving existing export commented for clarity; will not be deployed.)
// exports.listPickupAddresses = functions.region('asia-south1').https.onCall(async () => { throw new functions.https.HttpsError('unavailable','Removed'); });