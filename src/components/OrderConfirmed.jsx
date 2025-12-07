import React, { useEffect, useState } from "react";
import emailjs from '@emailjs/browser';
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
  const [emailSent, setEmailSent] = useState(false);

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
          total: payment?.amount ? payment.amount / 100 : (checkout?.total ?? checkout?.cartTotal ?? 0),
          status: 'In Process',
          shipping: {
            fullName: checkout?.fullName || checkout?.name || checkout?.shipping?.fullName || null,
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

  // Send order confirmation email once orderData is available
  useEffect(() => {
    const sendEmail = async () => {
      if (!orderData || emailSent) {
        console.log('📧 Email send skipped:', { 
          hasOrderData: !!orderData, 
          alreadySent: emailSent 
        });
        return;
      }
      const recipient = orderData?.shipping?.email || checkout?.email || null;
      if (!recipient) {
        console.warn('⚠️ No recipient email found for order confirmation');
        console.warn('Available data:', { 
          orderDataShipping: orderData?.shipping, 
          checkoutEmail: checkout?.email 
        });
        return;
      }
      
      try {
        console.log('📧 Preparing to send order confirmation email to:', recipient);
        
        const orders = (orderData.items || []).map((it) => ({
          name: it.name || it.productName || it.title || it.product?.name || 'Item',
          units: it.quantity || it.qty || 1,
          price: it.price ?? it.unitPrice ?? it.product?.price ?? 0,
          image_url: getProductImageUrl(it),
        }));
        
        const cost = {
          shipping: orderData?.shippingCost ?? checkout?.shippingCost ?? 0,
          total: orderData?.total ?? (payment?.amount ? payment.amount / 100 : checkout?.total ?? checkout?.cartTotal ?? 0),
        };
 
        const orderId = orderData?.razorpayOrderId || payment?.razorpay_order_id || payment?.order_id || orderData?.id || checkout?.orderId || `${Date.now()}`;
        const websiteUrl = window?.location?.origin;
        const customerName = orderData?.shipping?.fullName || orderData?.shipping?.name || checkout?.fullName || checkout?.name || orderData?.name || 'Customer';
        const address = orderData?.address || orderData?.shipping?.address || checkout?.address || '';
        const paymentStatus = payment?.razorpay_payment_id || payment?.id ? 'Paid' : (checkout?.paymentStatus || 'Pending');        console.log('📧 Email details:', {
          recipient,
          customerName,
          orderId,
          itemCount: orders.length,
          total: cost.total,
          paymentStatus,
          address: address ? 'provided' : 'missing'
        });
        
        console.log('📧 Full EmailJS params:', {
          to_email: recipient,
          to_name: customerName,
          order_id: orderId,
          total_amount: cost.total,
          shipping_amount: cost.shipping,
          payment_status: paymentStatus
        });
        
        const html = buildEmailHtml({ email: recipient, orderId, orders, cost, websiteUrl, customerName, address, paymentStatus });
        const SERVICE_ID = import.meta.env?.VITE_EMAILJS_SERVICE_ID || 'service_ugu0eah';
        const TEMPLATE_ID = import.meta.env?.VITE_EMAILJS_TEMPLATE_ID || 'template_zjf5zsm';
        const PUBLIC_KEY = import.meta.env?.VITE_EMAILJS_PUBLIC_KEY || 'Y3m1ic5-mSSYUkTKX';
        
        console.log('📧 EmailJS Config:', {
          SERVICE_ID,
          TEMPLATE_ID,
          PUBLIC_KEY: PUBLIC_KEY ? 'present' : 'missing',
          recipientCount: 1
        });
        
        // Prepare detailed order items text
        const orderItemsText = orders.map((item, idx) => 
          `${idx + 1}. ${item.name} - Qty: ${item.units} - Price: ₹${item.price.toFixed(2)}`
        ).join('\n');
        
        console.log('📧 Attempting to send email via EmailJS...');
        
        const result = await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            to_email: recipient,
            reply_to: recipient,
            to_name: customerName,
            order_id: orderId,
            customer_name: customerName,
            customer_email: recipient,
            customer_address: address,
            payment_status: paymentStatus,
            order_items: orderItemsText,
            orders: orders,
            cost: cost,
            shipping_amount: cost.shipping,
            total_amount: cost.total,
            website_url: websiteUrl,
            html_content: html,
          },
          PUBLIC_KEY
        );
        
        console.log('📧 EmailJS raw response:', result);
        
        if (result?.status === 200) {
          setEmailSent(true);
          console.log('✅ Order confirmation email sent successfully to:', recipient);
          console.log('📧 EmailJS Response:', result);
        } else {
          console.warn('⚠️ EmailJS returned non-200 status:', result?.status, result);
        }
      } catch (err) {
        console.error('❌ Failed to send order confirmation email:', err);
        console.error('Error details:', {
          message: err.message,
          text: err.text,
          status: err.status,
          name: err.name,
          stack: err.stack
        });
      }
    };
    sendEmail();
  }, [orderData, emailSent, checkout?.email, payment?.amount]);

  function currency(amount) {
    const n = Number(amount || 0);
    return `₹${n.toFixed(2)}`;
  }

  function buildEmailHtml({ email, orderId, orders, cost, websiteUrl, customerName, address, paymentStatus }) {
      const brandColor = '#3e2723';
      const accent = '#bf360c';
      const border = '#e0d6cd';
      const bg = '#f8f6f4';
      const cardBg = '#ffffff';

      const itemsHtml = (orders || []).map(o => `
  <tr style="vertical-align: top;border-bottom:1px solid ${border}">
    <td style="padding: 14px 8px 14px 0; width: 72px;">
      <img style="width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border:1px solid ${border}" src="${o.image_url}" alt="${o.name}">
    </td>
    <td style="padding: 14px 8px;">
      <div style="font-weight:600;color:${brandColor}">${o.name}</div>
      <div style="font-size: 12px; color: #7a6a5f; margin-top: 4px;">QTY: ${o.units}</div>
    </td>
    <td style="padding: 14px 0; white-space: nowrap; text-align:right; font-weight:700; color:${brandColor}">${currency(o.price)}</td>
  </tr>`).join('');

      return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size: 14px; color: ${brandColor}; padding: 0; background-color: ${bg};">
    <div style="max-width: 640px; margin: 0 auto; background-color: ${cardBg}; box-shadow: 0 2px 8px #0001; border:1px solid ${border}">
      <div style="padding: 16px 18px; border-bottom: 1px solid ${border}; display:flex; align-items:center; gap:10px">
        <a href="${websiteUrl || ''}" target="_blank" rel="noopener" style="text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
          <img style="height: 32px; border-radius:4px;" src="https://ik.imagekit.io/3xnjrgh8n/5uO9QxtwQIG4LvLM5Kpt3w%20(1)%20(1)%20(1).jpg?updatedAt=1765119379797" alt="Bold & Brew" height="32">
          <span style="font-size: 16px; border-left: 1px solid ${border}; padding-left: 8px; font-weight:700; color:${brandColor}">Thank You for Your Order</span>
        </a>
      </div>
      <div style="padding: 18px;">
        <p style="margin:0 0 10px 0; color:#6b5a4a">We'll send you tracking information when the order ships.</p>
        <div style="text-align: left; font-size: 14px; padding-bottom: 8px; border-bottom: 2px solid ${border};"><strong style="color:${accent}">Order # ${orderId}</strong></div>
        <table style="width:100%; border-collapse: collapse; margin: 10px 0 14px 0;">
          <tbody>
            <tr>
              <td style="width:50%; vertical-align:top; padding:6px 8px 6px 0;">
                <div style="font-weight:700; color:${brandColor}">Customer</div>
                <div style="font-size:13px; color:#6b5a4a">${customerName}</div>
                <div style="font-size:12px; color:#7a6a5f; margin-top:4px">${email}</div>
              </td>
              <td style="width:50%; vertical-align:top; padding:6px 0 6px 8px;">
                <div style="font-weight:700; color:${brandColor}">Payment</div>
                <div style="font-size:13px; color:${paymentStatus === 'Paid' ? accent : '#7a6a5f'}">${paymentStatus}</div>
                ${address ? `<div style="font-weight:700; color:${brandColor}; margin-top:8px">Address</div><div style="font-size:12px; color:#7a6a5f; white-space:pre-line">${address}</div>` : ''}
              </td>
            </tr>
          </tbody>
        </table>
        <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div style="margin: 16px 0; border-top: 1px solid ${border}">&nbsp;</div>
        <table style="border-collapse: collapse; width: 100%; text-align: right;">
          <tbody>
            <tr>
              <td style="width: 60%;">&nbsp;</td>
              <td style="color:#7a6a5f">Shipping</td>
              <td style="padding: 6px 8px; white-space: nowrap; font-weight:600; color:${brandColor}">${currency(cost.shipping)}</td>
            </tr>
            <tr>
              <td style="width: 60%;">&nbsp;</td>
              <td style="border-top: 2px solid ${border}; padding-top:8px"><strong style="white-space: nowrap; color:${brandColor}">Order Total</strong></td>
              <td style="padding: 10px 8px; border-top: 2px solid ${border}; white-space: nowrap; font-size:15px"><strong style="color:${accent}">${currency(cost.total)}</strong></td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:18px; padding:10px; background:#faf7f5; border:1px solid ${border}; border-radius:8px; color:#6b5a4a">
          If you have any questions, reply to this email and our team will assist you.
        </div>
      </div>
    </div>
    <div style="max-width: 640px; margin: 8px auto 0; text-align:center; color: #8b7a6d; font-size: 12px;">
      The email was sent to ${email}<br>You received this email because you placed the order on <a href="${websiteUrl || ''}" style="color:${accent}; text-decoration:none">Bold & Brew</a>
    </div>
  </div>`;
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
              <div className="oc-row"><span>Payment ID</span><strong>{payment?.razorpay_payment_id || payment?.id || 'N/A'}</strong></div>
              <div className="oc-row"><span>Order ID</span><strong>{payment?.razorpay_order_id || payment?.order_id || orderData?.razorpayOrderId || 'N/A'}</strong></div>
              <div className="oc-row"><span>Date</span><strong>{(orderData?.date && orderData.date.toDate) ? orderData.date.toDate().toLocaleString() : (orderData?.createdAt && orderData.createdAt.toDate ? orderData.createdAt.toDate().toLocaleString() : 'N/A')}</strong></div>
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
