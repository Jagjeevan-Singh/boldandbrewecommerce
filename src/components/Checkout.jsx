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

    // Razorpay payment integration
    const options = {
      key: "RAZORPAY_KEY_ID", // TODO: Replace with your Razorpay key after deployment
      amount: total * 100, // Amount in paise
      currency: "INR",
      name: "Bold & Brew",
      description: "Order Payment",
      handler: async function (response) {
        // Save order to Firestore on payment success
        try {
          await addDoc(collection(db, 'orders'), {
            userId: user.uid,
            items: cartItems,
            date: serverTimestamp(),
            total,
            status: 'completed',
            shipping: form,
            razorpayPaymentId: response.razorpay_payment_id
          });
          // Save address for future if checked (to Firestore)
          if (form.saveForFuture) {
            await setDoc(doc(db, 'users', user.uid), { address: form }, { merge: true });
          }
          navigate('/order-confirmation');
        } catch (err) {
          alert('Order placed but failed to save in database. Please contact support.');
          console.error(err);
        }
      },
      prefill: {
        name: form.fullName,
        email: form.email
      },
      theme: {
        color: "#b9805a"
      }
    };

    if (!window.Razorpay) {
      alert('Razorpay SDK not loaded. Please check your internet connection.');
      return;
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
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
