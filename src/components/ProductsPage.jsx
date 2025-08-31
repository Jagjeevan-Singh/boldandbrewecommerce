// Vite: import all images in assets at build time
const images = import.meta.glob('../assets/*', { eager: true, as: 'url' });

function ProductImage({ src, alt, ...props }) {
  if (src && !src.startsWith('http')) {
    const match = Object.entries(images).find(([key]) => key.endsWith('/' + src));
    if (match) {
      return <img src={match[1]} alt={alt} {...props} />;
    }
  }
  return <img src={src} alt={alt} {...props} />;
}

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCartPlus, FaHeart } from 'react-icons/fa';
import ProductRating from './ProductRating';
import './ProductsPage.css';

function ProductsPage({ products, onAdd, onWishlist, searchTerm = '', setSearchTerm }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Only clear search term if navigating away from /products
  useEffect(() => {
    return () => {
      if (setSearchTerm && prevPathRef.current === '/products' && location.pathname !== '/products') {
        setSearchTerm('');
      }
    };
  }, [setSearchTerm, location.pathname]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // Split search term into words, filter products if any word matches product name
  const filteredProducts = searchTerm.trim() === ''
    ? products
    : products.filter(product => {
        const name = product.name.toLowerCase();
        return searchTerm
          .toLowerCase()
          .split(/\s+/)
          .some(word => word && name.includes(word));
      });

  return (
    <section className="products-page">
      <h2>All Products</h2>
      <div className="product-grid">
        {filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', color: '#b19d8e', fontSize: '1.2rem', padding: '2rem' }}>
            No products found.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
            >
              <button
                className={`wishlist-icon-btn${product.isWishlisted ? ' wishlisted' : ''}`}
                onClick={() => onWishlist(product)}
                aria-label="Add to wishlist"
                style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', zIndex: 3, cursor: 'pointer', padding: 4 }}
              >
                <FaHeart />
              </button>
              <ProductImage
                src={product.mainImage}
                alt={product.name}
                className="product-image"
                onClick={() => handleProductClick(product)}
              />
              <h3 onClick={() => handleProductClick(product)}>{product.name}</h3>
              <ProductRating productId={product.id} />
              <p className="price">
                ₹{product.price}
                {product.originalPrice && (
                  <span className="original-price">₹{product.originalPrice}</span>
                )}
              </p>
              <div className="product-actions">
                <button onClick={() => onAdd(product)}>
                  <FaCartPlus /> Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ProductsPage;