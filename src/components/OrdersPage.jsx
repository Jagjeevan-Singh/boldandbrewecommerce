import React, { useEffect, useState } from 'react';
import './OrdersPage.css';
import { getOrdersForUser } from '../getOrdersForUser';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Fetch orders for the current user
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const userOrders = await getOrdersForUser();
        setOrders(userOrders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div className="orders-page-container">
      <h2 className="orders-title">My Orders</h2>
      {loading ? (
        <div className="orders-loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 0'}}>
          <svg width="90" height="90" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom:'18px'}}>
            <ellipse cx="32" cy="54" rx="20" ry="6" fill="#d7ccc8"/>
            <rect x="14" y="22" width="36" height="24" rx="10" fill="#fff3e0" stroke="#6d4c41" strokeWidth="2"/>
            <rect x="18" y="26" width="28" height="16" rx="8" fill="#ffe0b2"/>
            <ellipse cx="32" cy="34" rx="10" ry="3" fill="#bcaaa4"/>
            <path d="M50 32c4 0 6 4 6 8s-2 8-6 8" stroke="#8d6e63" strokeWidth="2" fill="none"/>
            <rect x="24" y="12" width="16" height="8" rx="4" fill="#a1887f"/>
            <ellipse cx="32" cy="16" rx="8" ry="2.5" fill="#fffde7"/>
            <ellipse cx="32" cy="16" rx="4" ry="1.2" fill="#bcaaa4"/>
          </svg>
          <div style={{fontWeight:600, fontSize:'1.2rem', color:'#b9805a'}}>No Orders Yet</div>
          <div style={{color: '#888', fontSize: '1rem', marginTop: '8px', textAlign:'center', maxWidth:'300px'}}>Looks like you haven't placed any orders yet. Start shopping and your orders will appear here!</div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <span className="order-id">Order ID: {order.id}</span>
                <span className="order-date">{order.date ? new Date(order.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
              </div>
              <div className="order-items">
                {(order.items || []).map((item, idx) => (
                  <div className="order-item" key={idx}>
                    {item.image && <img src={item.image} alt={item.name} className="order-item-img" style={{width:36, height:36, borderRadius:8, marginRight:10, objectFit:'cover'}} />}
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x{item.quantity}</span>
                    <span className="item-price">₹{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="order-shipping">
                <span style={{fontWeight:600, color:'#795548'}}>Shipping to:</span> {order.shipping?.fullName}, {order.shipping?.address}, {order.shipping?.city}, {order.shipping?.state} - {order.shipping?.pincode}
              </div>
              <div className="order-total">Total: <span style={{fontWeight:600}}>₹{order.total}</span></div>
              <div className="order-status" style={{display:'flex',alignItems:'center',gap:8}}>
                {order.status === 'completed' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#388e3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" stroke="#388e3c" strokeWidth="2.5" fill="#e8f5e9"/><path d="M8 12.5l2.5 2.5 5-5"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b71c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" stroke="#b71c1c" strokeWidth="2.5" fill="#ffebee"/><path d="M8 12l4 4 4-8"/></svg>
                )}
                <span>Status: <span style={{fontWeight:600, color: order.status === 'completed' ? '#388e3c' : '#b71c1c'}}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
