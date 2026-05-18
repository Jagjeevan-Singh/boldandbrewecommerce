// Firebase Functions entry point
const functions = require('firebase-functions');
const Razorpay = require('razorpay');
const cors = require('cors')({ origin: true });

const razorpay = new Razorpay({
  key_id: 'rzp_test_RD3vXSAsbG6VGZ',
  key_secret: 'VURLQzr82U9ENzoDFGgCTdh9'
});

exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    const { amount, currency = 'INR' } = req.body;
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // amount in paise
        currency,
        receipt: `receipt_${Date.now()}`
      });
      res.status(200).json(order);
    } catch (err) {
      res.status(500).send(err);
    }
  });
});
