import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
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
    phone: '',
    saveForFuture: false
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');

  // Load draft from localStorage on first render (helps when user returns from Razorpay back button)
  useEffect(() => {
    try {
      const draft = localStorage.getItem('checkoutDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setForm((f) => ({ ...f, ...parsed }));
      }
    } catch (e) {
      console.warn('Could not load checkout draft', e);
    }
  }, []);

  const navigate = useNavigate();

  const applyAddressToForm = (addr) => {
    if (!addr) return;
    const { fullName, address, pincode, city, state, email, phone } = addr;
    setForm((f) => ({
      ...f,
      fullName: fullName || '',
      address: address || '',
      pincode: pincode || '',
      city: city || '',
      state: state || '',
      email: email || '',
      phone: phone || '',
      saveForFuture: false
    }));
  };

  // Fetch saved addresses when auth is ready
  useEffect(() => {
    const fetchSavedAddress = async (user) => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const legacyAddress = userDocSnap.exists() && userDocSnap.data().address
          ? { id: 'legacy', label: 'Default', ...userDocSnap.data().address }
          : null;

        const addressesSnap = await getDocs(collection(db, 'users', user.uid, 'addresses'));
        const list = addressesSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        const combined = list.length ? list : (legacyAddress ? [legacyAddress] : []);
        setSavedAddresses(combined);

        if (combined.length && !form.fullName) {
          applyAddressToForm(combined[0]);
          setSelectedAddressId(combined[0].id || '');
        } else if (legacyAddress && !form.fullName) {
          applyAddressToForm(legacyAddress);
          setSelectedAddressId('legacy');
        }
      } catch (err) {
        console.error('Error fetching saved address:', err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchSavedAddress(user);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Persist draft locally on every change so user keeps data if they navigate back from Razorpay
  useEffect(() => {
    try {
      localStorage.setItem('checkoutDraft', JSON.stringify(form));
    } catch (e) {
      console.warn('Could not save checkout draft', e);
    }
  }, [form]);

  const handleSelectSaved = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    const found = savedAddresses.find((a) => a.id === id);
    if (found) applyAddressToForm(found);
  };

  const effectiveLabel = () => {
    if (addressLabel === 'Other') return customLabel.trim() || 'Other';
    return addressLabel || 'Home';
  };

  const persistSavedAddress = async (userId, addressData) => {
    const label = effectiveLabel();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'saved';
    const payload = {
      ...addressData,
      label,
      updatedAt: serverTimestamp(),
    };
    try {
      const addrDocRef = doc(db, 'users', userId, 'addresses', slug);
      await setDoc(addrDocRef, payload, { merge: true });
      setSavedAddresses((prev) => {
        const others = prev.filter((a) => a.id !== slug);
        return [{ id: slug, ...payload }, ...others];
      });
      await setDoc(doc(db, 'users', userId), { address: addressData }, { merge: true });
    } catch (err) {
      console.error('Failed to save address for future:', err);
    }
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

    // Save address immediately if requested (so it appears even if payment flow is abandoned)
    if (form.saveForFuture) {
      try {
        await persistSavedAddress(user.uid, form);
      } catch (err) {
        console.error('Pre-save address failed (continuing to payment):', err);
      }
    }

    // Use Firebase HTTPS Functions (production or emulator depending on flags)
    const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
    const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    const FUNCTIONS_BASE = USE_EMULATOR
      ? `http://localhost:5001/${PROJECT_ID}/${REGION}`
      : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

    let order;
    try {
      // Call Firebase Functions backend to create the order
      const res = await fetch(`${FUNCTIONS_BASE}/createRazorpayOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: Math.round(total) /* rupees */, 
          currency: 'INR'
        })
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

    // If server-created order exists, use that. Otherwise fall back to a client-only checkout (dev fallback).
    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RkNAPvahAqOEKr';

    if (order && order.id) {
      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Bold & Brew',
        description: 'Coffee Order Payment',
        order_id: order.id,
        prefill: { name: form.fullName, email: form.email },
        theme: { color: '#b9805a' }
      };

      options.handler = function (response) {
        console.log('✅ Razorpay payment successful, navigating immediately...');
        
        // Navigate immediately to order confirmation page
        navigate('/order-confirmed', { 
          replace: true,
          state: { 
            payment: { ...response, amount: Math.round(total * 100) }, 
            checkout: { 
              ...form, 
              total: total
            },
            serverOrderId: order.id,
            needsVerification: true // flag for background verification
          } 
        });

        // Verify in background (non-blocking)
        fetch(`${FUNCTIONS_BASE}/verifyRazorpayPayment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            cartItems,
            total: total,
            shippingForm: form,
            userId: user.uid,
            saveForFuture: form.saveForFuture,
            paymentMode: 'Razorpay' // Payment mode determined by Razorpay (COD/UPI/NetBanking/Card)
          })
        }).then(verifyRes => verifyRes.json())
          .then(verifyBody => {
            if (verifyBody.status === 'failure') {
              console.error('Background verification failed:', verifyBody);
            } else {
              console.log('✅ Background verification completed');
            }
          })
          .catch(err => console.error('Background verification error:', err));
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.error('Payment initialization failed for server order:', err);
      }
    }

    // --- Fallback: client-only checkout (development fallback, less secure) ---
    try {
      const clientOptions = {
        key: rzpKey,
        amount: Math.round(total * 100), // paise
        currency: 'INR',
        name: 'Bold & Brew',
        description: 'Coffee Order Payment (client fallback)',
        prefill: { name: form.fullName, email: form.email },
        theme: { color: '#b9805a' }
      };

      clientOptions.handler = function (response) {
        console.log('✅ Client payment successful, navigating immediately...');
        
        // Navigate immediately to order confirmation page
        navigate('/order-confirmed', { 
          replace: true,
          state: { 
            payment: { 
              razorpay_payment_id: response.razorpay_payment_id, 
              razorpay_order_id: response.razorpay_order_id, 
              amount: Math.round(total * 100) 
            }, 
            checkout: { ...form, total } 
          } 
        });
        
        // Save order in background (non-blocking)
        addDoc(collection(db, 'orders'), {
          userId: user.uid,
          items: cartItems,
          date: serverTimestamp(),
          total,
          status: 'In Process',
          shipping: form,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id || null,
          note: 'Saved from client-only checkout (no server verification)'
        }).then(() => {
          console.log('✅ Background order save completed');
        }).catch(err => {
          console.error('Background order save failed:', err);
        });
      };

      const rzp = new window.Razorpay(clientOptions);
      rzp.open();
    } catch (err) {
      console.error('Client checkout initialization failed:', err);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Shipping Address</h1>
      {savedAddresses.length > 0 && (
        <div className="saved-address-picker">
          <label className="saved-label">Use saved address</label>
          <select value={selectedAddressId} onChange={handleSelectSaved}>
            <option value="">Select saved address</option>
            {savedAddresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {addr.label || 'Saved'} • {addr.fullName || addr.name || ''} • {addr.pincode || ''}
              </option>
            ))}
          </select>
        </div>
      )}
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
        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          required
          type="tel"
          pattern="[0-9]{10}"
          title="Please enter a 10-digit phone number"
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
        {form.saveForFuture && (
          <div className="save-label-row">
            <label>Label</label>
            <div className="label-options">
              <select value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)}>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
              {addressLabel === 'Other' && (
                <input
                  type="text"
                  placeholder="Custom label"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  maxLength={20}
                />
              )}
            </div>
          </div>
        )}

        <button type="submit">
          Save & Continue <span style={{ fontSize: '1.3em', marginLeft: 6 }}>&#8594;</span>
        </button>
      </form>
    </div>
  );
};

export default Checkout;