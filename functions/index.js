const functions = require('firebase-functions');
const Razorpay = require('razorpay');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
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
  // Explicitly set CORS headers (helps when deployed) and handle preflight early
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    // Preflight request
    return res.status(204).send('');
  }
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    
    const { amount, currency = 'INR' } = req.body;
    // Temporary comment to force deployment update for createRazorpayOrder
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
      res.status(200).json(order);
    } catch (err) {
      console.error("Razorpay Order Creation Error:", err);
      res.status(500).json({ error: 'Failed to create order on payment gateway.' });
    }
  });
});

// --------------------------------------------------------------------------------
// FUNCTION 2: VERIFY PAYMENT (Called by Frontend AFTER successful payment)
// --------------------------------------------------------------------------------
exports.verifyRazorpayPayment = functions.https.onRequest((req, res) => {
  // Explicit CORS headers for deployed environments
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