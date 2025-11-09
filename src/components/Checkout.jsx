import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

// Ensure Razorpay SDK is loaded in public/index.html:
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

const Checkout = ({ cartItems = [], total = 0 }) => {
  const [form, setForm] = useState({
    fullName: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    email: '',
    saveForFuture: false
  });

  const navigate = useNavigate();

  // Fetch saved address on mount
  useEffect(() => {
    const fetchSavedAddress = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().address) {
          setForm(f => ({ ...f, ...userDoc.data().address }));
        }
      } catch (err) {
        console.error('Error fetching saved address:', err);
      }
    };
    fetchSavedAddress();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to place an order.');
      navigate('/login');
      return;
    }

    if (!window.Razorpay) {
      alert('Razorpay SDK not loaded. Please ensure the script tag is in your index.html.');
      return;
    }

    // Create a server-side order via Firebase Function and then open Razorpay checkout.
    // Build functions base URL (emulator support)
    const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
    const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    const FUNCTIONS_BASE = USE_EMULATOR
      ? `http://localhost:5001/${PROJECT_ID}/${REGION}`
      : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

    let order;
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/createRazorpayOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total) /* rupees */ , currency: 'INR' })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create order');
      }

      order = await res.json();
    } catch (err) {
      console.error('Failed creating order on backend:', err);
      alert('Could not initiate payment. Please try again.');
      return;
    }

    try {
      // Prepare Razorpay options using the server-created order
      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RD3vXSAsbG6VGZ';
      const options = {
        key: rzpKey,
        amount: order.amount, // amount in paise
        currency: order.currency,
        name: 'Bold & Brew',
        description: 'Coffee Order Payment',
        order_id: order.id,
        prefill: { name: form.fullName, email: form.email },
        theme: { color: '#b9805a' }
      };

      options.handler = async function (response) {
        try {
          // Call server-side verification function which will verify signature and write order to Firestore
          const verifyRes = await fetch(`${FUNCTIONS_BASE}/verifyRazorpayPayment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              cartItems,
              total,
              shippingForm: form,
              userId: user.uid,
              saveForFuture: form.saveForFuture
            })
          });

          const verifyBody = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || verifyBody.status === 'failure') {
            console.error('Verification failed:', verifyBody);
            alert('Payment succeeded but verification failed. Contact support with payment id: ' + response.razorpay_payment_id);
            return;
          }

          navigate('/order-confirmed');
        } catch (err) {
          console.error('Verification or saving order failed:', err);
          alert('Payment succeeded but we could not confirm the order. Please contact support with your payment id.');
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment initialization failed:', err);
      alert(err.message || 'Failed to initialize payment. Please try again.');
    }
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Shipping Address</h1>
      <form className="checkout-form" onSubmit={handleSubmit} autoComplete="on">
        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          required
        />
        <textarea
          name="address"
          placeholder="Full Address"
          value={form.address}
          onChange={handleChange}
          required
          rows={2}
        />
        <div className="row">
          <input
            name="pincode"
            placeholder="Pincode"
            value={form.pincode}
            onChange={handleChange}
            required
            pattern="[0-9]{6}"
          />
          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />
        </div>
        <input
          name="state"
          placeholder="State"
          value={form.state}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          type="email"
        />
        <div className="save-future-row">
          <input
            type="checkbox"
            name="saveForFuture"
            checked={form.saveForFuture}
            onChange={handleChange}
          />
          <span>Save this address for future checkout</span>
        </div>
        <button type="submit">
          Save & Continue <span style={{ fontSize: '1.3em', marginLeft: 6 }}>&#8594;</span>
        </button>
      </form>
    </div>
  );
};

export default Checkout;