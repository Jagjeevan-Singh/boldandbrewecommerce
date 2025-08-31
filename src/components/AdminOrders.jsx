import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
  // Shiprocket booking handler
  const bookShiprocketOrder = async (order) => {
    // Map your order data to Shiprocket's required format
    const shiprocketOrder = {
      order_id: order.id,
      order_date: order.date && order.date.toDate ? order.date.toDate().toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      pickup_location: "Primary", // Change as per your Shiprocket settings
      billing_customer_name: order.shipping?.fullName || 'Customer',
      billing_address: order.shipping?.address || '',
      billing_city: order.shipping?.city || '',
      billing_pincode: order.shipping?.pincode || '',
      billing_state: order.shipping?.state || '',
      billing_email: order.shipping?.email || '',
      billing_phone: order.shipping?.phone || '9999999999', // Add phone if available
      order_items: (order.items || []).map(item => ({
        name: item.name,
        sku: item.name,
        units: item.quantity,
        selling_price: item.price
      })),
      payment_method: "Prepaid", // or "COD"
      sub_total: order.total,
      length: 10, breadth: 10, height: 10, weight: 0.5 // update as per your product
    };
    try {
      const res = await fetch('http://localhost:5001/api/shiprocket/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiprocketOrder)
      });
      const data = await res.json();
      if (data.awb_code) {
        alert(`Order booked! AWB: ${data.awb_code}`);
        // Optionally update Firestore order with AWB/tracking info
        await updateDoc(doc(db, 'orders', order.id), {
          shiprocketAwb: data.awb_code,
          shiprocketOrderId: data.order_id,
          shiprocketTrackingUrl: data.shipment_track_url || '',
        });
      } else {
        alert(`Error: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Shiprocket booking failed: ' + err.message);
    }
  };
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchOrdersAndUsers = async () => {
      setLoading(true);
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Fetch user details for each order
      const userIds = [...new Set(ordersList.map(o => o.userId))];
      const usersMap = {};
      for (const uid of userIds) {
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          usersMap[uid] = userDoc.exists() ? userDoc.data() : { email: 'Unknown', displayName: 'Unknown' };
        }
      }
      setOrders(ordersList);
      setUsers(usersMap);
      setLoading(false);
    };
    fetchOrdersAndUsers();
  }, []);

  return (
    <div className="admin-orders-container">
      <h2 className="admin-orders-title">All Orders</h2>
      {loading ? (
        <div className="admin-orders-loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="admin-orders-empty">No orders found.</div>
      ) : (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div className="admin-order-card" key={order.id}>
              <div className="admin-order-header">
                <span className="admin-order-id">Order ID: {order.id}</span>
                <span className="admin-order-date">{order.date && order.date.toDate ? order.date.toDate().toLocaleString() : ''}</span>
              </div>
              <div className="admin-order-user">
                <span className="admin-order-user-label">User:</span>
                <span className="admin-order-user-name">{users[order.userId]?.displayName || users[order.userId]?.email || order.userId || 'Unknown'}</span>
                <span className="admin-order-user-email">{users[order.userId]?.email || ''}</span>
              </div>
              <div className="admin-order-items">
                {order.items && order.items.map((item, idx) => (
                  <div className="admin-order-item" key={idx}>
                    <span className="admin-item-name">{item.name}</span>
                    <span className="admin-item-qty">x{item.quantity}</span>
                    <span className="admin-item-price">₹{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="admin-order-total">Total: ₹{order.total}</div>
              <div className="admin-order-status">Status: {order.status}</div>
              <button style={{marginTop:12,background:'#388e3c',color:'#fff',padding:'8px 18px',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'}} onClick={() => bookShiprocketOrder(order)}>
                Book via Shiprocket
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;