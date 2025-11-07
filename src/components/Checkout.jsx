import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

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

  // Fetch saved address for logged-in user from Firestore
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
        // Ignore errors
      }
    };
    fetchSavedAddress();
  }, []);

  const navigate = useNavigate();

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

    // Create payment preference through proxy
    try {
      const prefRes = await fetch('http://localhost:3000/api/razorpay/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: "rzp_test_placeholder", // This will be replaced by the proxy
          amount: total * 100, // amount in paise
          currency: "INR",
          notes: {
            description: "Bold & Brew Coffee Order"
          }
        })
      });
      
      if (!prefRes.ok) {
        const error = await prefRes.json();
        throw new Error(error.error?.message || 'Failed to create payment preference');
      }
      
      const preference = await prefRes.json();
      
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please check your internet connection.');
      }

      // Create Razorpay instance with preferences
      const options = {
        ...preference, // Use all settings from preference response
        name: "Bold & Brew",
        description: "Coffee Order Payment",
        prefill: {
          name: form.fullName,
          email: form.email
        },
        theme: {
          color: "#b9805a"
        },
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
              await setDoc(doc(db, 'users', user.uid), { 
                address: form 
              }, { merge: true });
            }

            navigate('/order-confirmation');
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
          Save & Continue <span style={{fontSize:'1.3em',marginLeft:6}}>&#8594;</span>
        </button>
      </form>
    </div>
  );
};

export default Checkout;
