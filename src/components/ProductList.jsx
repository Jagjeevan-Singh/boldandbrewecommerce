
import { FaCartPlus, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './ProductList.css';
import './ProductList.center.css';
import ProductRating from './ProductRating';

// Vite: import all images in assets at build time
// Updated to new Vite API
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
function ProductList({ products, onAdd, onWishlist }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const EXCLUDE_NAMES = ['PURE INSTANT COFFEE', 'HAZELNUT', 'VANILLA COFFEE'];
  const filtered = Array.isArray(products)
    ? products.filter(p => !EXCLUDE_NAMES.includes(String(p.name || '').trim().toUpperCase()))
    : [];

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product, fromProductsPage: true } });
  };

  return (
    <section className="products-section" data-aos="fade-up">
  <h2 className="india-coffee-title" style={{
    fontSize: isMobile ? '2.2rem' : '3.2rem',
    lineHeight: '1.1',
    fontWeight: '400',
    fontFamily: "'Pinyon Script', cursive",
    color: '#ffffff',
    margin: isMobile ? '0 -20px 20px -20px' : '0 -40px 30px -40px',
    letterSpacing: '2.5px',
    textAlign: 'center',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    background: 'rgba(70, 46, 34, 0.92)',
    padding: isMobile ? '20px 30px 22px 30px' : '30px 40px 32px 40px',
    borderRadius: '0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    boxSizing: 'border-box',
    border: 'none'
  }}>India's #1 Instant Coffee</h2>
      <div className="product-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px 10px' : '20px 16px',
        width: '100%',
        maxWidth: '1400px',
        padding: isMobile ? '12px 8px' : '20px 40px',
        margin: '0 auto 40px auto',
        boxSizing: 'border-box',
        justifyItems: 'center'
      }}>
        {filtered.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <div key={product.id} className="product-card" style={{
              background: '#ffffff',
              border: '2px solid #c0a080',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: isMobile ? '100%' : '320px',
              padding: isMobile ? '12px' : '16px',
              position: 'relative',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <button
                className={`wishlist-icon-btn${product.isWishlisted ? ' wishlisted' : ''}`}
                onClick={() => onWishlist(product)}
                disabled={outOfStock}
                aria-label="Add to wishlist"
                style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {}}
              >
                <FaHeart />
              </button>
              {outOfStock && <div className="out-of-stock-badge">Out of Stock</div>}
              <ProductImage
                src={product.mainImage}
                alt={product.name}
                className="product-image"
                onClick={() => handleProductClick(product)}
                style={{ 
                  cursor: 'pointer', 
                  opacity: outOfStock ? 0.6 : 1,
                  width: '100%',
                  aspectRatio: '1/1',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  marginBottom: isMobile ? '8px' : '12px',
                  background: '#ffffff',
                  padding: '0',
                  boxSizing: 'border-box',
                  display: 'block'
                }}
              />
              <h3
                className="product-title"
                onClick={() => handleProductClick(product)}
                style={{ 
                  cursor: 'pointer', 
                  opacity: outOfStock ? 0.7 : 1,
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  margin: isMobile ? '6px 0 4px 0' : '8px 0 6px 0',
                  color: '#333333',
                  textAlign: 'center',
                  fontWeight: '500',
                  lineHeight: '1.3'
                }}
              >
                {product.name}
              </h3>
              <ProductRating productId={product.id} />
              <div className="product-prices" style={{
                marginBottom: isMobile ? '8px' : '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                width: '100%'
              }}>
                <span className="product-price" style={{
                  color: '#d32f2f',
                  fontSize: isMobile ? '1.1rem' : '1.35rem',
                  fontWeight: '700'
                }}>₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="product-original-price" style={{
                      color: '#999999',
                      fontSize: isMobile ? '0.8rem' : '0.95rem',
                      textDecoration: 'line-through',
                      fontWeight: '500'
                    }}>₹{product.originalPrice}</span>
                    {(() => {
                      const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                      return (
                        <span className="product-discount" style={{
                          color: '#22c55e',
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          fontWeight: '600',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>-{discount}%</span>
                      );
                    })()}
                  </>
                )}
              </div>
              <button
                className="add-btn add-btn-full"
                onClick={() => onAdd(product)}
                disabled={outOfStock}
                style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {
                  backgroundColor: '#d32f2f',
                  color: '#ffffff',
                  border: 'none',
                  padding: isMobile ? '9px 8px' : '11px 10px',
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: isMobile ? '8px' : '12px'
                }}
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProductList;