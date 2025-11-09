const functions = require('firebase-functions');
const Razorpay = require('razorpay');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
// Initialize the Firebase Admin SDK for server-side Firestore access
const admin = require('firebase-admin');

// 1. Initialize Admin SDK (for Firestore access)
admin.initializeApp();
const db = admin.firestore();

// 2. Initialize Razorpay (Reading keys from secure config)
// NOTE: We use functions.config() because this is a Firebase Function environment.
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id, 
  key_secret: functions.config().razorpay.key_secret
});

// --------------------------------------------------------------------------------
// FUNCTION 1: CREATE ORDER (Called by Frontend to initiate payment)
// --------------------------------------------------------------------------------
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Handling CORS preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    
    const { amount, currency = 'INR' } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount.' });
    }

    try {
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
  cors(req, res, async () => {
    // Handling CORS preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    // Data includes verification details + all order data sent from Checkout.jsx
    const { 
        orderId, paymentId, signature, 
        cartItems, total, shippingForm, userId, saveForFuture 
    } = req.body;
    
    // Get the SECRET key from the secure functions config
    const key_secret = functions.config().razorpay.key_secret;

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
            status: 'completed',
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