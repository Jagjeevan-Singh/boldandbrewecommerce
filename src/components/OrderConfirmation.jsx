import React from 'react';
import './OrderConfirmation.css';

function generateOrderId() {
  // Generates a random 8-character alphanumeric order ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const OrderConfirmation = () => {
  const orderId = React.useMemo(() => generateOrderId(), []);

  return (
    <div className="order-confirmation-container">
      <div className="order-confirmation-card">
        <div className="order-confirmation-icon">
          <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="#ffe0b2"/>
            <path d="M20 34l8 8 16-16" stroke="#43a047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <ellipse cx="32" cy="50" rx="16" ry="4" fill="#ffe082"/>
            <rect x="24" y="18" width="16" height="10" rx="5" fill="#fff3e0" stroke="#b9805a" strokeWidth="1.5"/>
            <ellipse cx="32" cy="23" rx="6" ry="2" fill="#ffe0b2"/>
          </svg>
        </div>
        <h2 className="order-confirmation-title">Thank You for Your Order!</h2>
        <div className="order-confirmation-message">
          Your order has been placed successfully.<br />
          <span style={{color:'#b9805a', fontWeight:600}}>Order ID:</span> <span className="order-confirmation-id">{orderId}</span>
        </div>
        <div className="order-confirmation-subtext">
          We appreciate your purchase. Your delicious coffee will be delivered soon!
        </div>
        <a href="/products" className="order-confirmation-btn">Continue Shopping</a>
      </div>
    </div>
  );
};

export default OrderConfirmation;
