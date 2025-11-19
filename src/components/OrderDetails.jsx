import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { getProductImageUrl } from "../utils/imageUtils.js";
import './OrderDetails.css';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
  const isCancelled = statusRaw && String(statusRaw).toLowerCase() === 'cancelled';
  const statusClass = displayStatus.toLowerCase().replace(/\s+/g, '-');

  const handleCancelOrder = async () => {
    if (!order?.id) return;
    
    setCancelling(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: 'Cancelled'
      });
      
      // Update local state
      setOrder(prev => ({ ...prev, status: 'Cancelled' }));
      setShowCancelModal(false);
      
      // Show success message
      alert('Order cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Failed to cancel order: ' + (err.message || 'Unknown error'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="od-container">
      <div className="od-card">
        <header className="od-header">
          <h2 className="od-title">Order Details</h2>
          <div className="od-meta">
            <div className="od-meta-item"><span>Order ID</span><strong>{order.id}</strong></div>
              <div className="od-meta-item"><span>Payment ID</span><strong>{paymentId}</strong></div>
              <div className="od-meta-item"><span>Payment Mode</span><strong>{paymentMode}</strong></div>
              <div className={`od-meta-item od-payment-status-item payment-status-${paymentStatus.toLowerCase()}`}>
                <span>Payment Status</span>
                <strong className="od-payment-badge">{paymentStatus}</strong>
              </div>
              <div className="od-meta-item"><span>Amount</span><strong>{formatAmount(amountVal)}</strong></div>
              <div className={`od-meta-item od-status-item od-status-${statusClass}`}>
                <span>Order Status</span>
                <strong className="od-status-badge">{displayStatus}</strong>
              </div>
          </div>
        </header>

        <section className="od-body">
          <div className="od-section od-items">
            <h3>Items</h3>
            {order.items && order.items.length ? (
              <>
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
                      const lineSubtotal = (Number(price) || 0) * (Number(qty) || 0);
                      const imageUrl = getProductImageUrl(it);
                      const productId = it.productId || it.id || (it.product && it.product.id);
                      
                      const handleProductClick = () => {
                        if (productId) {
                          navigate(`/product/${productId}`);
                        }
                      };

                      return (
                        <tr key={idx} className="od-item-row" onClick={handleProductClick} style={{ cursor: productId ? 'pointer' : 'default' }}>
                          <td className="od-image-cell">
                            <img src={imageUrl} alt={name} className="od-product-image" />
                          </td>
                          <td className="od-product-cell">
                            <span className="od-product-name-desktop">{name}</span>
                            <div className="od-mobile-product-details">
                              <div className="od-mobile-product-name">{name}</div>
                              <div className="od-mobile-line">
                                <span className="od-mobile-line-label">Discounted Price</span>
                                <span className="od-mobile-line-value">{formatAmount(price)}</span>
                              </div>
                              <div className="od-mobile-line">
                                <span className="od-mobile-line-label">Quantity</span>
                                <span className="od-mobile-line-value">{qty}</span>
                              </div>
                              {order.items.length === 1 && (
                                <div className="od-mobile-line od-mobile-line-subtotal">
                                  <span className="od-mobile-line-label">Subtotal</span>
                                  <span className="od-mobile-line-value">{formatAmount(lineSubtotal)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="od-qty-cell">{qty}</td>
                          <td className="od-price-cell">{formatAmount(price)}</td>
                          <td className="od-subtotal-cell">{formatAmount(lineSubtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {order.items.length > 1 && (
                      <tr className="od-total-row">
                        <td colSpan={4} className="od-total-label-cell">Subtotal</td>
                        <td className="od-total-amount-cell">{formatAmount(order.total ?? order.amount ?? order.totalAmount ?? 0)}</td>
                      </tr>
                    )}
                  </tfoot>
                </table>
                {order.items.length > 1 && (
                  <div className="od-mobile-total">
                    <span className="od-mobile-total-label">Subtotal</span>
                    <span className="od-mobile-total-amount">{formatAmount(order.total ?? order.amount ?? order.totalAmount ?? 0)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="od-value">No items listed on this order.</div>
            )}
          </div>

          <div className="od-section od-shipping">
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

          <div className="od-section">
            <h3>Order Date & Time</h3>
            <div className="od-row"><span className="od-label">Date</span><span className="od-value">{formatDate(order.date || order.createdAt)}</span></div>
          </div>
        </section>

        <footer className="od-footer">
          <div className="od-actions">
            <button className="od-btn" onClick={() => navigate(-1)}>Back</button>
            <button className="od-btn od-primary" onClick={() => navigate('/orders-list')}>View All Orders</button>
            {!isCancelled && (
              <button className="od-btn od-cancel" onClick={() => setShowCancelModal(true)}>Cancel Order</button>
            )}
          </div>
        </footer>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="od-modal-overlay" onClick={() => !cancelling && setShowCancelModal(false)}>
          <div className="od-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order?</h3>
            <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="od-modal-actions">
              <button 
                className="od-btn" 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                No, Keep Order
              </button>
              <button 
                className="od-btn od-cancel" 
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

