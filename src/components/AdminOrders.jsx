import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getProductImageUrl } from '../utils/imageUtils.js';
import './AdminOrders.css';

const STATUS_OPTIONS = ['In Process', 'Shipped', 'Completed'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

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

  const setStatus = async (orderId, newStatus) => {
    setSavingId(orderId);
    try {
      const ref = doc(db, 'orders', orderId);
      await updateDoc(ref, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
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

              <div className="admin-order-user">
                <span className="admin-order-user-label">User:</span>
                <span className="admin-order-user-name">{users[order.userId]?.displayName || users[order.userId]?.email || order.userId || 'Unknown'}</span>
                <span className="admin-order-user-email">{users[order.userId]?.email || ''}</span>
              </div>

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
                  <select value={order.status || 'In Process'} onChange={e => setStatus(order.id, e.target.value)} disabled={savingId===order.id}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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
