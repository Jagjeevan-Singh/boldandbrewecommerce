import React from 'react';
import OrderItemDetail from './OrderItemDetail';
import './OrderItemDetailDemo.css';

/**
 * Demo component to showcase the OrderItemDetail component
 * with sample data for testing and visualization
 */
const OrderItemDetailDemo = () => {
  // Sample product data
  const sampleItems = [
    {
      name: 'Pure Instant Coffee',
      quantity: 2,
      price: 299,
      mrp: 399,
      couponDiscount: 50,
      product: {
        name: 'Pure Instant Coffee'
      }
    },
    {
      name: 'Vanilla Instant Coffee',
      quantity: 1,
      price: 349,
      mrp: 449,
      couponDiscount: 0,
      product: {
        name: 'Vanilla Instant Coffee'
      }
    },
    {
      name: 'Hazelnut Instant Coffee',
      quantity: 3,
      price: 349,
      mrp: 499,
      couponDiscount: 100,
      product: {
        name: 'Hazelnut Instant Coffee'
      }
    }
  ];

  return (
    <div className="oid-demo-container">
      <div className="oid-demo-header">
        <h1>Order Item Detail Component - Mobile View</h1>
        <p>Responsive component optimized for mobile viewports (320px - 576px)</p>
      </div>

      <div className="oid-demo-items">
        {sampleItems.map((item, index) => (
          <OrderItemDetail key={index} item={item} />
        ))}
      </div>

      <div className="oid-demo-footer">
        <h2>Features:</h2>
        <ul>
          <li>✓ 80×80px product image with cloud URL integration</li>
          <li>✓ Stacked layout with product name, MRP, and price</li>
          <li>✓ Clear discount breakdown with percentage badge</li>
          <li>✓ Coupon discount in accent blue color</li>
          <li>✓ Item amount subtotal with separator line</li>
          <li>✓ Fully responsive (320px - 768px+)</li>
          <li>✓ Professional alignment and spacing</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderItemDetailDemo;
