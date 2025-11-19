import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { getProductImageUrl } from "../utils/imageUtils.js";
import './OrderConfirmed.css';

export default function OrderConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();
  const payment = location.state?.payment;
  const checkout = location.state?.checkout;
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (!payment && !checkout) {
      navigate("/", { replace: true });
      return;
    }

    const saveOrder = async () => {
      try {
        const razorpayPid = payment?.razorpay_payment_id || payment?.id;
        if (!razorpayPid) return;

        // Check for an existing order saved by server (or previous client save)
        const existingQ = query(collection(db, 'orders'), where('razorpayPaymentId', '==', razorpayPid), limit(1));
        const existingSnap = await getDocs(existingQ);
        if (!existingSnap.empty) {
          // already saved by server; use it
          const d = { id: existingSnap.docs[0].id, ...existingSnap.docs[0].data() };
          console.debug('OrderConfirmed: found existing order document', d);
          setOrderData(d);
          return;
        }

        // Not found — save a lightweight client-side order document (use same field names as server)
        const docRef = await addDoc(collection(db, "orders"), {
          items: checkout?.cartItems || checkout?.items || [],
          date: serverTimestamp(),
          total: payment?.amount ? payment.amount / 100 : checkout?.total || 0,
          status: 'In Process',
          shipping: {
            fullName: checkout?.name || checkout?.shipping?.fullName || null,
            phone: checkout?.phone || checkout?.shipping?.phone || null,
            email: checkout?.email || checkout?.shipping?.email || null,
            address: checkout?.address || checkout?.shipping?.address || null,
          },
          razorpayPaymentId: razorpayPid,
          razorpayOrderId: payment?.razorpay_order_id || payment?.order_id || null,
        });

  // Read back the saved doc and set state
  // Note: avoid orderBy combined with where on a different field to prevent needing a composite index
  const saved = await getDocs(query(collection(db, 'orders'), where('razorpayPaymentId', '==', razorpayPid), limit(1)));
        if (!saved.empty) {
          const d2 = { id: saved.docs[0].id, ...saved.docs[0].data() };
          console.debug('OrderConfirmed: saved client fallback order', d2);
          setOrderData(d2);
        }
        console.log("✅ Order saved to Firestore (client fallback)");
      } catch (err) {
        console.error("❌ Failed to save order:", err);
      }
    };

    saveOrder();
    // After saving (or even if saving fails), try to fetch the saved order by payment id so we can show items and exact timestamp
    const fetchSaved = async () => {
      try {
        const pId = payment?.razorpay_payment_id || payment?.id;
        if (!pId) return;
  // Avoid ordering in this query to prevent requiring a composite index
  const q = query(collection(db, 'orders'), where('razorpayPaymentId', '==', pId), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d3 = { id: snap.docs[0].id, ...snap.docs[0].data() };
          console.debug('OrderConfirmed: fetched saved order', d3);
          setOrderData(d3);
          return;
        }
        // fallback try other field name
  const q2 = query(collection(db, 'orders'), where('paymentId', '==', pId), limit(1));
  const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const d4 = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
          console.debug('OrderConfirmed: fetched fallback paymentId order', d4);
          setOrderData(d4);
        }
      } catch (err) {
        console.warn('Could not fetch saved order for confirmation:', err);
      }
    };
    fetchSaved();
  }, [payment, checkout, navigate]);

  if (!payment && !checkout) return null;

  // display helpers
  const displayPhone = (
    orderData?.shipping?.phone || orderData?.shipping?.phoneNumber || orderData?.shipping?.phone_number ||
    checkout?.phone || orderData?.phone || orderData?.contact?.phone || orderData?.customerPhone || orderData?.mobile ||
    orderData?.billing?.phone || orderData?.shippingPhone || orderData?.shipping_phone || 'N/A'
  );
  // detect which field provided the phone (for debugging)
  let phoneSource = null;
  if (orderData) {
    if (orderData.shipping?.phone) phoneSource = 'orderData.shipping.phone';
    else if (orderData.shipping?.phoneNumber) phoneSource = 'orderData.shipping.phoneNumber';
    else if (orderData.shipping?.phone_number) phoneSource = 'orderData.shipping.phone_number';
    else if (checkout?.phone) phoneSource = 'checkout.phone';
    else if (orderData.phone) phoneSource = 'orderData.phone';
    else if (orderData.contact?.phone) phoneSource = 'orderData.contact.phone';
    else if (orderData.customerPhone) phoneSource = 'orderData.customerPhone';
    else if (orderData.mobile) phoneSource = 'orderData.mobile';
    else if (orderData.billing?.phone) phoneSource = 'orderData.billing.phone';
    else if (orderData.shippingPhone) phoneSource = 'orderData.shippingPhone';
    else if (orderData.shipping_phone) phoneSource = 'orderData.shipping_phone';
  } else if (checkout?.phone) {
    phoneSource = 'checkout.phone';
  }
  const displayAmountVal = orderData?.total ?? (payment?.amount ? payment.amount / 100 : (checkout?.total ?? null));
  const amountStr = displayAmountVal != null ? `₹${Number(displayAmountVal).toFixed(2)}` : 'N/A';
  const paymentMode = payment?.razorpay_payment_id || payment?.id ? 'Razorpay' : (checkout?.paymentMode || 'N/A');

  function formatPriceString(item) {
    const price = item.price ?? item.unitPrice ?? item.product?.price ?? 0;
    if (typeof price === 'number') return `₹${price.toFixed(2)}`;
    return `₹${price}`;
  }

  return (
    <div className="oc-container">
      <div className="oc-card">
        <div className="oc-top">
          <div className="oc-left">
            <div className="oc-badge">Order Confirmed</div>
            <h2 className="oc-amount">{amountStr}</h2>
            <div className="oc-small">Payment: <strong>{paymentMode}</strong></div>
          </div>
          <div className="oc-right">
            <h2 className="oc-title">Thank you — your order is confirmed!</h2>

            <div className="oc-details">
              <div className="oc-row"><span>Payment ID</span><strong>{payment?.razorpay_payment_id || payment?.id || 'N/A'}</strong></div>
              <div className="oc-row"><span>Order ID</span><strong>{payment?.razorpay_order_id || payment?.order_id || orderData?.razorpayOrderId || 'N/A'}</strong></div>
              <div className="oc-row"><span>Date</span><strong>{(orderData?.date && orderData.date.toDate) ? orderData.date.toDate().toLocaleString() : (orderData?.createdAt && orderData.createdAt.toDate ? orderData.createdAt.toDate().toLocaleString() : 'N/A')}</strong></div>
              <div className="oc-row"><span>Phone</span><strong>{displayPhone}</strong></div>
                  </div>
                  {typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV && (
                    <div style={{marginTop:8,fontSize:12,color:'#6b5a4a'}}>Phone source: <strong>{phoneSource || 'none'}</strong></div>
                  )}
          </div>
        </div>

        <hr />

        <div className="oc-ship">
          <h3>Customer</h3>
          <div className="oc-row"><span>Name</span><strong>{orderData?.shipping?.fullName || checkout?.name || orderData?.name || 'N/A'}</strong></div>
          <div className="oc-row"><span>Phone</span><strong>{displayPhone}</strong></div>
          <div className="oc-row"><span>Email</span><strong>{orderData?.shipping?.email || checkout?.email || orderData?.email || 'N/A'}</strong></div>
          <div className="oc-row"><span>Address</span><div className="oc-address">{orderData?.address || orderData?.shipping?.address || checkout?.address || 'N/A'}</div></div>
        </div>

        {orderData?.items && orderData.items.length > 0 && (
          <div className="oc-items">
            <h4>Items</h4>
            <ul>
              {orderData.items.map((it, idx) => {
                const imageUrl = getProductImageUrl(it);
                return (
                  <li key={idx} style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                    <img src={imageUrl} alt={it.name || it.productName || 'Product'} style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}} />
                    <span>{(it.name || it.productName || it.title || it.product?.name) + ' × ' + (it.quantity || it.qty || 1) + ' — ' + (it.price ? `₹${(it.price).toFixed ? it.price.toFixed(2) : it.price}` : formatPriceString(it))}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="oc-actions">
          <button className="oc-btn" onClick={() => navigate('/')}>Back to Home</button>
          <button className="oc-btn oc-primary" onClick={() => navigate('/orders-list')}>View All Orders</button>
        </div>
      </div>
    </div>
  );
}
