import React from 'react';
import './PolicyPages.css';

const ShippingPolicy = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Shipping Policy</h1>
      <p style={{fontSize:'1.18em',marginBottom:'1.7em',textAlign:'center',fontWeight:500}}>
        We're excited for you to receive your order! Here's everything you need to know about our shipping process.
      </p>
      <div className="terms-section">
        <div className="terms-block">
          <span className="terms-num">1.</span>
          <div>
            <b>Processing Time</b><br/>
            All orders are processed and shipped from our facility within 1-2 business days (Monday-Friday), excluding major holidays.<br/><br/>
            Orders placed after 12 PM IST will be processed the following business day.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">2.</span>
          <div>
            <b>Shipping & Delivery Estimates</b><br/>
            We are pleased to offer <b>Free Shipping</b> on all orders.<br/><br/>
            <b>Delivery Time:</b> Your order is expected to be delivered within 5-7 business days after it has been shipped.<br/><br/>
            <b>Please note:</b> Delivery times are estimates and may vary due to external factors outside of our control (e.g., weather, courier delays). We do not ship to P.O. boxes.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">3.</span>
          <div>
            <b>Order Tracking</b><br/>
            Once your order has been shipped, you will receive a confirmation email with a tracking number. You can use this number to track your order's journey directly from the courier's website.<br/><br/>
            If you don't receive a tracking number within 3 business days of placing your order, please contact us at <a href="mailto:boldandbrew@gmail.com">boldandbrew@gmail.com</a>.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">4.</span>
          <div>
            <b>Shipping Destinations</b><br/>
            We currently ship to all locations within India. We are working hard to expand our shipping to other countries soon!
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">5.</span>
          <div>
            <b>Damaged or Lost Packages</b><br/>
            We take great care in packaging your order, but if your package is lost or damaged in transit, please contact us immediately at <a href="mailto:boldandbrew@gmail.com">boldandbrew@gmail.com</a> with your order number. We will work with the shipping carrier to resolve the issue as quickly as possible and ensure you receive your products.
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ShippingPolicy;
