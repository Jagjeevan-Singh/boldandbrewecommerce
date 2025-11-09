import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';
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

    // Create payment preference via server proxy (server handles Razorpay auth)
    let preference;
    try {
      const res = await fetch('/api/razorpay/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total * 100, // paise
          currency: 'INR',
          notes: { description: 'Bold & Brew Coffee Order' }
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || 'Failed to create payment preference');
      }

      preference = await res.json();
    } catch (err) {
      console.error('Payment preference creation failed:', err);
      alert('Failed to initiate payment. Please try again.');
      return;
    }

    try {
      // Build options using preference response and extra UI data
      const options = {
        ...preference,
        name: 'Bold & Brew',
        description: 'Coffee Order Payment',
        prefill: {
          name: form.fullName,
          email: form.email
        },
        theme: { color: '#b9805a' },
        handler: async function (response) {
          try {
            // Save order to Firestore on payment success
            await addDoc(collection(db, 'orders'), {
              userId: user.uid,
              items: cartItems,
              date: serverTimestamp(),
              total,
              status: 'completed',
              shipping: form,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id
            });

            // Save address if user opted to
            if (form.saveForFuture) {
              await setDoc(doc(db, 'users', user.uid), { address: form }, { merge: true });
            }

            navigate('/order-confirmed');
          } catch (err) {
            console.error('Failed to save order:', err);
            alert('Payment successful but order failed to save. Please contact support with your Razorpay payment ID: ' + response.razorpay_payment_id);
          }
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