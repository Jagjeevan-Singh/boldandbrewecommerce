import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { getProductImageUrl } from "../utils/imageUtils.js";
import './OrderDetails.css';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

  let mounted = true;

    const fetchOrder = async () => {
      try {
  const orderRef = doc(db, "orders", id);
        const snapshot = await getDoc(orderRef);
        if (!mounted) return;

        if (!snapshot.exists()) {
          setError("Order not found");
          setOrder(null);
        } else {
          const data = snapshot.data();
          console.debug('OrderDetails: loaded order document', { id: snapshot.id, ...data });
          setOrder({ id: snapshot.id, ...data });
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load order");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [id]);

  const formatAmount = (raw) => {
    if (raw == null) return "N/A";
    if (typeof raw === "number") {
      // If large, assume in paise
      if (raw > 1000) return `₹${(raw / 100).toFixed(2)}`;
      return `₹${raw.toFixed ? raw.toFixed(2) : raw}`;
    }
    return `₹${raw}`;
  };

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  };

  if (loading) return <div className="od-loading">Loading order...</div>;
  if (error)
    return (
      <div className="od-container od-error">
        <div className="od-error-text">Error: {error}</div>
        <button className="od-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    );

  if (!order) return <div className="od-container">Order not found.</div>;

  // Normalize fields for display
  const paymentId = order.razorpayPaymentId || order.razorpay_payment_id || order.paymentId || order.payment_id || 'N/A';
  const paymentMode = order.paymentMode || order.payment_method || (paymentId !== 'N/A' ? 'Razorpay' : 'N/A');
  const paymentStatus = paymentId !== 'N/A' ? 'Success' : 'Failed';
  const amountVal = order.total ?? order.amount ?? order.totalAmount ?? order.orderAmount ?? 0;
  const rawPhone = (
    order.shipping?.phone || order.shipping?.phoneNumber || order.shipping?.phone_number ||
    order.phone || order.contact?.phone || order.contact?.phoneNumber ||
    order.customerPhone || order.customer?.phone || order.mobile ||
    order.billing?.phone || order.shippingPhone || order.shipping_phone || 'N/A'
  );
  // detect phone source for debugging
  let phoneSource = null;
  if (order) {
    if (order.shipping?.phone) phoneSource = 'shipping.phone';
    else if (order.shipping?.phoneNumber) phoneSource = 'shipping.phoneNumber';
    else if (order.shipping?.phone_number) phoneSource = 'shipping.phone_number';
    else if (order.phone) phoneSource = 'phone';
    else if (order.contact?.phone) phoneSource = 'contact.phone';
    else if (order.customerPhone) phoneSource = 'customerPhone';
    else if (order.mobile) phoneSource = 'mobile';
    else if (order.billing?.phone) phoneSource = 'billing.phone';
    else if (order.shippingPhone) phoneSource = 'shippingPhone';
    else if (order.shipping_phone) phoneSource = 'shipping_phone';
  }
  // Status: never show 'Completed' — default to 'In Process' unless another explicit status exists
  const statusRaw = order.status || order.paymentStatus || '';
  const displayStatus = (statusRaw && String(statusRaw).toLowerCase() !== 'completed') ? statusRaw : 'In Process';

  return (
    <div className="od-container">
      <div className="od-card">
        <header className="od-header">
          <h2 className="od-title">Order Details</h2>
          <div className="od-meta">
            <div className="od-meta-item"><span>Order ID</span><strong>{order.id}</strong></div>
              <div className="od-meta-item"><span>Payment ID</span><strong>{paymentId}</strong></div>
              <div className="od-meta-item"><span>Payment Mode</span><strong>{paymentMode}</strong></div>
              <div className="od-meta-item"><span>Payment Status</span><strong className={`payment-status-${paymentStatus.toLowerCase()}`}>{paymentStatus}</strong></div>
              <div className="od-meta-item"><span>Amount</span><strong>{formatAmount(amountVal)}</strong></div>
              <div className="od-meta-item"><span>Status</span><strong>{displayStatus}</strong></div>
          </div>
        </header>

        <section className="od-body">
          <div className="od-section">
            <h3>Shipping</h3>
            <div className="od-row"><span className="od-label">Name</span><span className="od-value">{order.shipping?.fullName || order.name || order.shipping?.name || 'N/A'}</span></div>
            <div className="od-row"><span className="od-label">Address</span><div className="od-value od-address">{order.address || order.shipping?.address || (order.shipping?.street ? `${order.shipping.street}\n${order.shipping.city || ''} ${order.shipping.pincode || ''}` : 'N/A')}</div></div>
            <div className="od-row"><span className="od-label">Phone</span><span className="od-value">{rawPhone}</span></div>
            <div className="od-row"><span className="od-label">Email</span><span className="od-value">{order.shipping?.email || order.email || order.contact?.email || 'N/A'}</span></div>
            {typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV && (
              <div style={{marginTop:8,fontSize:12,color:'#6b5a4a'}}>Phone source: <strong>{phoneSource || 'none'}</strong></div>
            )}
          </div>

          {/* Only render Delivery section if any meaningful delivery info exists */}
          {(order.deliveryOption || order.deliveryDate || order.deliveryInstructions) && (
            <div className="od-section">
              <h3>Delivery</h3>
              {order.deliveryOption && <div className="od-row"><span className="od-label">Option</span><span className="od-value">{order.deliveryOption}</span></div>}
              {order.deliveryDate && <div className="od-row"><span className="od-label">Date</span><span className="od-value">{order.deliveryDate}</span></div>}
              {order.deliveryInstructions && <div className="od-row"><span className="od-label">Instructions</span><span className="od-value">{order.deliveryInstructions}</span></div>}
            </div>
          )}

          <div className="od-section od-items">
            <h3>Items</h3>
            {order.items && order.items.length ? (
              <table className="od-items-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => {
                    const name = it.name || it.productName || it.title || (it.product && it.product.name) || 'Item';
                    const qty = it.quantity || it.qty || 1;
                    const price = it.price ?? it.unitPrice ?? it.product?.price ?? 0;
                    const subtotal = (Number(price) || 0) * (Number(qty) || 0);
                    const imageUrl = getProductImageUrl(it);
                    return (
                      <tr key={idx}>
                        <td><img src={imageUrl} alt={name} style={{width: 50, height: 50, objectFit: 'cover', borderRadius: 4}} /></td>
                        <td>{name}</td>
                        <td className="od-center">{qty}</td>
                        <td className="od-right">{formatAmount(price)}</td>
                        <td className="od-right">{formatAmount(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
                    <td className="od-right" style={{ fontWeight: 700 }}>{formatAmount(order.total ?? order.amount ?? order.totalAmount ?? 0)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="od-value">No items listed on this order.</div>
            )}
          </div>

          <div className="od-section">
            <h3>Order Date & Time</h3>
            <div className="od-row"><span className="od-label">Date</span><span className="od-value">{formatDate(order.date || order.createdAt)}</span></div>
          </div>
        </section>

        <footer className="od-footer">
          <div className="od-actions">
            <button className="od-btn" onClick={() => navigate(-1)}>Back</button>
            <button className="od-btn od-primary" onClick={() => navigate('/orders-list')}>View All Orders</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

