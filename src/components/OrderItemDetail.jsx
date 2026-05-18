import React from 'react';
import './OrderItemDetail.css';
import { getProductImageUrl } from '../utils/imageUtils';

const OrderItemDetail = ({ item }) => {
  // Extract data from item object with fallbacks
  const productName = item.name || item.productName || item.title || (item.product && item.product.name) || 'Item';
  const quantity = item.quantity || item.qty || 1;
  const productPrice = item.price ?? item.unitPrice ?? item.product?.price ?? 0;
  const listingPrice = item.mrp || item.listingPrice || item.originalPrice || productPrice;
  const couponDiscount = item.couponDiscount || 0;
  const discountAmount = (listingPrice - productPrice) * quantity;
  const subtotal = (productPrice * quantity) - couponDiscount;
  
  const imageUrl = getProductImageUrl(item);

  // Format currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate discount percentage
  const discountPercentage = listingPrice > productPrice 
    ? Math.round(((listingPrice - productPrice) / listingPrice) * 100) 
    : 0;

  return (
    <div className="order-item-detail">
      {/* Row 1: Image and Primary Details */}
      <div className="oid-main-content">
        <div className="oid-image-column">
          <img 
            src={imageUrl} 
            alt={productName} 
            className="oid-product-image"
          />
        </div>
        
        <div className="oid-primary-details">
          <h3 className="oid-product-name">{productName}</h3>
          {quantity > 1 && (
            <p className="oid-quantity">Qty: {quantity}</p>
          )}
          {listingPrice > productPrice && (
            <p className="oid-listing-price">{formatAmount(listingPrice)}</p>
          )}
          <p className="oid-product-price">{formatAmount(productPrice)}</p>
        </div>
      </div>

      {/* Row 2: Pricing Summary */}
      <div className="oid-pricing-summary">
        {discountAmount > 0 && (
          <div className="oid-pricing-row">
            <span className="oid-label">Discount on Price (MRP)</span>
            <span className="oid-value oid-discount">
              −{formatAmount(discountAmount)}
              {discountPercentage > 0 && (
                <span className="oid-discount-badge">{discountPercentage}% OFF</span>
              )}
            </span>
          </div>
        )}

        {couponDiscount > 0 && (
          <div className="oid-pricing-row">
            <span className="oid-label">Coupon Discount</span>
            <span className="oid-value oid-coupon">−{formatAmount(couponDiscount)}</span>
          </div>
        )}

        <div className="oid-separator"></div>

        <div className="oid-pricing-row oid-total-row">
          <span className="oid-label oid-total-label">Item Amount</span>
          <span className="oid-value oid-total-value">{formatAmount(subtotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemDetail;
