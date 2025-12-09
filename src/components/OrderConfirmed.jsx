import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase.js";
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
        if (!razorpayPid) {
          console.log('No payment ID found');
          return;
        }

        // ONLY fetch the order saved by server - do NOT create a duplicate
        const existingQ = query(collection(db, 'orders'), where('razorpayPaymentId', '==', razorpayPid), limit(1));
        const existingSnap = await getDocs(existingQ);
        
        if (!existingSnap.empty) {
          // Found the order saved by server
          const orderDoc = existingSnap.docs[0];
          const orderDataRaw = orderDoc.data();
          const d = { id: orderDoc.id, ...orderDataRaw };
          console.log('✅ Order found from server:', d);
          console.log('📦 Order items:', d.items);
          console.log('📅 Order date:', d.date, 'Type:', typeof d.date);
          setOrderData(d);
          return;
        }

        // If still not found, retry after longer delay
        console.warn('⚠️ Order not found in Firestore yet. Server may still be processing. Retrying...');
      } catch (err) {
        console.error("❌ Failed to fetch order:", err);
      }
    };

    // Initial fetch after 500ms, then retry after 2 seconds if not found
    const timeoutId1 = setTimeout(saveOrder, 500);
    const timeoutId2 = setTimeout(() => {
      // Check again in case first attempt didn't find it
      if (!orderData) {
        saveOrder();
      }
    }, 2000);

    // Cleanup timeouts on unmount
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [payment, checkout, navigate]);

  // Initialize state for email tracking
  useEffect(() => {
    if (!orderData) {
      return;
    }
    // Firebase Cloud Function will automatically send email when order is created with razorpayPaymentId
    console.log('✅ Order saved to Firestore. Firebase Cloud Function will send email automatically.');
  }, [orderData]);

  function currency(amount) {
    const n = Number(amount || 0);
    return `₹${n.toFixed(2)}`;
  }

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
  const displayAmountVal = orderData?.total ?? (payment?.amount ? payment.amount / 100 : (checkout?.total ?? checkout?.cartTotal ?? null));
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
              <div className="oc-row"><span>Order ID</span><strong>{orderData?.id || payment?.razorpay_order_id || payment?.order_id || 'N/A'}</strong></div>
              <div className="oc-row"><span>Payment ID</span><strong>{payment?.razorpay_payment_id || payment?.id || 'N/A'}</strong></div>
              <div className="oc-row"><span>Date</span><strong>{(() => {
                if (!orderData?.date) return 'N/A';
                try {
                  // Handle Firestore Timestamp objects
                  if (orderData.date.toDate && typeof orderData.date.toDate === 'function') {
                    return orderData.date.toDate().toLocaleDateString('en-IN') + ' ' + orderData.date.toDate().toLocaleTimeString('en-IN');
                  }
                  // Handle Date objects
                  if (orderData.date instanceof Date) {
                    return orderData.date.toLocaleDateString('en-IN') + ' ' + orderData.date.toLocaleTimeString('en-IN');
                  }
                  // Handle timestamp numbers
                  if (typeof orderData.date === 'number') {
                    return new Date(orderData.date).toLocaleDateString('en-IN') + ' ' + new Date(orderData.date).toLocaleTimeString('en-IN');
                  }
                  return 'N/A';
                } catch (e) {
                  console.error('Date parsing error:', e, orderData.date);
                  return 'N/A';
                }
              })()}</strong></div>
              <div className="oc-row"><span>Phone</span><strong>{displayPhone}</strong></div>
            </div>
          </div>
        </div>

        <hr />

        <div className="oc-ship">
          <h3>Customer</h3>
          <div className="oc-row"><span>Name</span><strong>{orderData?.shipping?.fullName || orderData?.shipping?.name || checkout?.fullName || checkout?.name || orderData?.name || 'N/A'}</strong></div>
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
