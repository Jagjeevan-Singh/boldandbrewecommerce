// Vite: import all images in assets at build time
// Updated to new Vite API: use query: '?url' and import: 'default' instead of as: 'url'
const images = import.meta.glob('../assets/*', { eager: true, query: '?url', import: 'default' });

function ProductImage({ src, alt, ...props }) {
  if (src && !src.startsWith('http')) {
    const match = Object.entries(images).find(([key]) => key.endsWith('/' + src));
    if (match) {
      return <img src={match[1]} alt={alt} {...props} />;
    }
  }
  return <img src={src} alt={alt} {...props} />;
}

import { FaTrashAlt, FaHeart, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './Cart.css';
import ProductRating from './ProductRating';

function Cart({
  cartItems = [],
  onRemove,
  onUpdateQuantity,
  onMoveToWishlist,
  onApplyCoupon,
  coupon,
  setCoupon,
  couponError,
  discount = 0,
  subtotal,
  discountedTotal,
}) {
  const navigate = useNavigate();
  const EXCLUDE_NAMES = ['PURE INSTANT COFFEE', 'HAZELNUT', 'VANILLA COFFEE'];
  
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);

  // Fetch available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const couponsRef = collection(db, 'coupons');
        const q = query(couponsRef, where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        
        const now = new Date();
        const coupons = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(coupon => {
            // Filter by validity dates
            if (coupon.validFrom && coupon.validFrom.toDate() > now) return false;
            if (coupon.validUntil && coupon.validUntil.toDate() < now) return false;
            // Filter by usage limit
            if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) return false;
            return true;
          });
        
        setAvailableCoupons(coupons);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      } finally {
        setLoadingCoupons(false);
      }
    };
    
    fetchCoupons();
  }, []);

  const handleCouponSelect = (couponCode) => {
    setSelectedCoupon(couponCode);
    setCoupon(couponCode);
    setShowCouponDropdown(false);
  };

  const handleApplyCoupon = () => {
    if (selectedCoupon || coupon) {
      onApplyCoupon();
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon('');
    setCoupon('');
    setShowCouponDropdown(false);
  };

  const getCouponDescription = (coupon) => {
    if (!coupon) return '';
    
    const { discountType, discountValue, minOrderValue, description } = coupon;
    
    if (description) return description;
    
    let desc = discountType === 'percentage' 
      ? `${discountValue}% off` 
      : `₹${discountValue} off`;
    
    if (minOrderValue > 0) {
      desc += ` on purchase of ₹${minOrderValue}`;
    }
    
    return desc;
  };

  // Normalize cart items for image compatibility
  const normalizedCartItems = cartItems
    .filter(i => !EXCLUDE_NAMES.includes(String(i.name || '').trim().toUpperCase()))
    .map((item) => {
    if (!item.mainImage && item.image) {
      return {
        ...item,
        mainImage: item.image,
        brand: item.brand || 'Bold & Brew',
      };
    }
    return item;
  });

  // ✅ Compute safe numeric total for passing forward
  const safeTotal = Number((Math.max(discountedTotal ?? subtotal ?? 0, 0)).toFixed(2));

  return (
    <div className="cart-page-pro">
      <div className="cart-pro-left">
        <h2>Your Cart</h2>
        {normalizedCartItems.length === 0 ? (
          <div className="cart-empty-pro">Your cart is empty.</div>
        ) : (
          <div className="cart-items-list-pro">
            {normalizedCartItems.map((item) => {
              const outOfStock = item.stock === 0;
              return (
                <div className="cart-item-pro" key={item.id}>
                  <div className="cart-item-left-pro">
                    <ProductImage
                      src={item.mainImage}
                      alt={item.name}
                      className="cart-item-img-pro"
                      style={{ cursor: 'pointer', opacity: outOfStock ? 0.6 : 1 }}
                      onClick={() =>
                        navigate(`/product/${item.id}`, { state: { product: item } })
                      }
                    />
                    <div className="cart-left-controls-pro">
                      <div className="cart-item-qty-pro">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || outOfStock}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={outOfStock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="cart-item-details-pro">
                    <div
                      className="cart-item-title-pro"
                      style={{
                        cursor: 'pointer',
                        color: '#7c5a3a',
                        textDecoration: 'underline',
                        opacity: outOfStock ? 0.7 : 1,
                      }}
                      onClick={() =>
                        navigate(`/product/${item.id}`, { state: { product: item } })
                      }
                    >
                      {item.name}
                      <ProductRating productId={item.id} />
                    </div>
                    <div className="cart-item-brand-pro">{item.brand}</div>
                    <div className="cart-item-price-pro">
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: '#4a3c35',
                          fontSize: '1.1em',
                        }}
                      >
                        ₹{item.price}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: '#b19d8e',
                            marginLeft: 8,
                            fontSize: '0.98em',
                          }}
                        >
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>

                    {outOfStock && (
                      <div
                        className="out-of-stock-badge"
                        style={{
                          position: 'static',
                          margin: '6px 0',
                          display: 'inline-block',
                          background: '#b71c1c',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '1em',
                          padding: '4px 14px',
                          borderRadius: '8px',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 8px #bcae9e33',
                          zIndex: 2,
                          textAlign: 'center',
                        }}
                      >
                        Out of Stock
                      </div>
                    )}

                  </div>
                  <div className="cart-actions-row">
                    <button
                      className="move-wishlist-pro"
                      onClick={() => onMoveToWishlist(item)}
                      disabled={outOfStock}
                      style={outOfStock ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                      ♥ Move to Wishlist
                    </button>
                    <button
                      className="remove-item-pro"
                      onClick={() => onRemove(item.id)}
                    >
                      🗑 Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="cart-pro-right">
        <div className="cart-summary-box-pro">
          <h3>Order Summary</h3>
          <div className="cart-summary-row-pro">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {discount > 0 && (
            <div className="cart-summary-row-pro">
              <span style={{ color: '#2e7d32', fontWeight: 600 }}>Discount</span>
              <span style={{ color: '#2e7d32', fontWeight: 600 }}>
                -₹{discount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="cart-summary-row-pro">
            <span>Shipping</span>
            <span>Free</span>
          </div>

          {/* Coupon Section with Dropdown */}
          <div className="cart-coupon-section-pro">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4a3c35', marginBottom: '0.5rem' }}>
              Apply Coupon
            </h4>
            
            {!selectedCoupon && !coupon ? (
              <div className="coupon-dropdown-container-pro">
                <button 
                  className="coupon-select-btn-pro"
                  onClick={() => setShowCouponDropdown(!showCouponDropdown)}
                  disabled={loadingCoupons}
                >
                  {loadingCoupons ? 'Loading coupons...' : 'Select a coupon'}
                </button>
                
                {showCouponDropdown && availableCoupons.length > 0 && (
                  <div className="coupon-dropdown-list-pro">
                    {availableCoupons.map((cpn) => {
                      const isEligible = subtotal >= (cpn.minOrderValue || 0);
                      return (
                        <div 
                          key={cpn.id}
                          className={`coupon-item-pro ${!isEligible ? 'disabled' : ''}`}
                          onClick={() => isEligible && handleCouponSelect(cpn.code)}
                        >
                          <div className="coupon-item-header-pro">
                            <span className="coupon-code-pro">{cpn.code}</span>
                            {!isEligible && (
                              <span className="coupon-ineligible-pro">
                                Min ₹{cpn.minOrderValue}
                              </span>
                            )}
                          </div>
                          <div className="coupon-description-pro">
                            {getCouponDescription(cpn)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {showCouponDropdown && availableCoupons.length === 0 && !loadingCoupons && (
                  <div className="coupon-dropdown-list-pro">
                    <div className="coupon-item-pro disabled">
                      No coupons available
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="applied-coupon-container-pro">
                <div className="applied-coupon-info-pro">
                  <span className="applied-coupon-code-pro">{selectedCoupon || coupon}</span>
                  <button 
                    className="remove-coupon-btn-pro"
                    onClick={handleRemoveCoupon}
                    title="Remove coupon"
                  >
                    <FaTimes />
                  </button>
                </div>
                {discount === 0 && (
                  <button 
                    className="apply-coupon-action-btn-pro"
                    onClick={handleApplyCoupon}
                  >
                    Apply Coupon
                  </button>
                )}
              </div>
            )}

          {couponError && <div className="cart-coupon-error-pro">{couponError}</div>}
          </div>

          <div className="cart-summary-total-pro">
            <span>Total</span>
            <span>₹{safeTotal}</span>
          </div>

          {/* ✅ Proceed to Checkout (correct amount passed) */}
          <button
            className="checkout-btn-pro"
            onClick={() =>
              navigate('/checkout-page', {
                state: { total: safeTotal, cartItems: normalizedCartItems },
              })
            }
            disabled={
              normalizedCartItems.length === 0 ||
              normalizedCartItems.some((item) => item.stock === 0)
            }
          >
            Proceed to Checkout
          </button>

          {normalizedCartItems.some((item) => item.stock === 0) && (
            <div
              style={{
                color: '#b71c1c',
                fontWeight: 600,
                marginTop: '8px',
                fontSize: '1em',
                textAlign: 'center',
              }}
            >
              Please remove out-of-stock products to proceed to checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cart;
