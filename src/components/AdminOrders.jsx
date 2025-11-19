import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getProductImageUrl } from '../utils/imageUtils.js';
import './AdminOrders.css';

const STATUS_OPTIONS = ['In Process', 'Shipped', 'Completed', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    const fetchOrdersAndUsers = async () => {
      setLoading(true);
      try {
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('date', 'desc')));
        const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch user details for each order
        const userIds = [...new Set(ordersList.map(o => o.userId).filter(Boolean))];
        const usersMap = {};
        for (const uid of userIds) {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            usersMap[uid] = userDoc.exists() ? userDoc.data() : { email: 'Unknown', displayName: 'Unknown' };
          } catch (e) {
            usersMap[uid] = { email: 'Unknown', displayName: 'Unknown' };
          }
        }

        setOrders(ordersList);
        setUsers(usersMap);
      } catch (err) {
        console.error('Failed to load admin orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersAndUsers();
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    // Store the pending change locally
    setPendingChanges(prev => ({ ...prev, [orderId]: newStatus }));
  };

  const saveStatus = async (orderId) => {
    const newStatus = pendingChanges[orderId];
    if (!newStatus) return;

    setSavingId(orderId);
    try {
      const ref = doc(db, 'orders', orderId);
      await updateDoc(ref, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      alert('Status updated successfully!');
    } catch (err) {
      alert('Failed to update status: ' + (err.message || err));
    } finally {
      setSavingId(null);
    }
  };

  // Shiprocket booking handler (optional integration)
  // Shiprocket integration temporarily disabled. To re-enable, implement server-side
  // Shiprocket endpoint and uncomment this handler.
  /*
  const bookShiprocketOrder = async (order) => {
    // Shiprocket integration removed temporarily for debugging.
  };
  */

  if (loading) return <div className="admin-orders-loading">Loading orders...</div>;

  return (
    <div className="admin-orders-container">
      <h2 className="admin-orders-title">All Orders</h2>
      {orders.length === 0 ? (
        <div className="admin-orders-empty">No orders found.</div>
      ) : (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div className="admin-order-card" key={order.id}>
              <div className="admin-order-header">
                <span className="admin-order-id">Order ID: {order.id}</span>
                <span className="admin-order-date">{order.date && order.date.toDate ? order.date.toDate().toLocaleString() : (order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : '')}</span>
              </div>

              {(() => {
                const userData = users[order.userId] || {};
                const shipping = order.shipping || order.checkout || {};
                const customerName = shipping.fullName || userData.displayName || order.customerName || order.name || userData.email || 'Unknown';
                const email = shipping.email || userData.email || order.email || order.customerEmail || 'Unknown';
                // phone extraction similar to OrderConfirmed component
                const phone = (
                  shipping.phone || shipping.phoneNumber || shipping.phone_number ||
                  order.phone || order.contact?.phone || order.customerPhone || order.mobile ||
                  userData.phone || 'N/A'
                );
                const addressParts = [
                  shipping.address,
                  shipping.city,
                  shipping.state,
                  shipping.pincode || shipping.zip,
                  shipping.country
                ].filter(p => p && String(p).trim().length > 0);
                const address = addressParts.length ? addressParts.join(', ') : 'N/A';
                const paymentStatus = (
                  order.paymentStatus || order.payment?.status || (order.payment?.paid ? 'Paid' : null) ||
                  (order.razorpayPaymentId || order.razorpay_payment_id || order.paymentId || order.payment_id ? 'Paid' : null) ||
                  'Pending'
                );
                return (
                  <div className="admin-order-customer">
                    <div className="customer-row"><span className="label">Customer:</span><span>{customerName}</span></div>
                    <div className="customer-row"><span className="label">Email:</span><span>{email}</span></div>
                    <div className="customer-row"><span className="label">Phone:</span><span>{phone || 'N/A'}</span></div>
                    <div className="customer-row"><span className="label">Address:</span><span className="address-value">{address}</span></div>
                    <div className="customer-row"><span className="label">Payment:</span><span className={"payment-status " + paymentStatus.toLowerCase()}> {paymentStatus}</span></div>
                  </div>
                );
              })()}

              <div className="admin-order-items">
                {order.items && order.items.map((item, idx) => {
                  const imageUrl = getProductImageUrl(item);
                  return (
                    <div className="admin-order-item" key={idx}>
                      <img src={imageUrl} alt={item.name || item.productName || 'Product'} style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 8}} />
                      <span className="admin-item-name">{item.name || item.productName || 'Item'}</span>
                      <span className="admin-item-qty">x{item.quantity || item.qty || 1}</span>
                      <span className="admin-item-price">₹{item.price || item.unitPrice || 0}</span>
                    </div>
                  );
                })}
              </div>

              <div className="admin-order-bottom">
                <div className="admin-order-total">Total: ₹{order.total ?? order.amount ?? 0}</div>
                <div className="admin-order-status">
                  <label>Status:</label>
                  <select 
                    value={pendingChanges[order.id] ?? order.status ?? 'In Process'} 
                    onChange={e => handleStatusChange(order.id, e.target.value)} 
                    disabled={savingId === order.id}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {pendingChanges[order.id] && (
                    <button 
                      className="admin-save-btn" 
                      onClick={() => saveStatus(order.id)}
                      disabled={savingId === order.id}
                    >
                      {savingId === order.id ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
                {/* Shiprocket disabled */}
                <button className="admin-ship-btn" onClick={() => {}} disabled style={{opacity:0.6,cursor:'not-allowed'}}>Shiprocket (disabled)</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
