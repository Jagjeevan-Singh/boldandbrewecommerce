import ProductRating from './ProductRating';

import { useNavigate } from 'react-router-dom';
import './BestSellerSection.css';

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

const bestSellers = [
  {
    name: 'Pure Instant Coffee',
    desc: 'Experience the purest, richest instant coffee. No additives, just bold flavor.',
    price: 299,
    originalPrice: 499,
    image: '100instant.jpg',
    tag: 'Best Seller',
    highlight: '#f7e7ce',
  },
  {
    name: 'Hazelnut Instant Coffee',
    desc: 'Nutty, aromatic, and irresistibly smooth. A customer favorite!',
    price: 349,
    originalPrice: 499,
    image: 'Hazelnut.jpg',
    tag: 'Most Loved',
    highlight: '#f3e6e3',
  },
  {
    name: 'Vanilla Instant Coffee',
    desc: 'Sweet vanilla meets premium coffee for a truly indulgent cup.',
    price: 349,
    originalPrice: 499,
    image: 'Vanilla.jpg',
    tag: 'Trending',
    highlight: '#f6f3e9',
  },
];

import { useMemo, useRef, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
export default function BestSellerSection({ onAdd, onWishlist, products = [] }) {
  const gridRef = useRef(null);

  const navigate = useNavigate();
  // Try to find the real Firestore product by name/price, else fallback
  const getNormalizedProduct = (p, i) => {
    const real = products.find(prod => prod.name === p.name && prod.price === p.price);
    return {
      ...p,
      id: real?.id || p.id || p.name.replace(/ /g, '-').toLowerCase(),
      mainImage: real?.mainImage || p.image,
      description: real?.description || p.desc || p.description || '',
      brand: real?.brand || p.brand || 'Bold & Brew',
      stock: real?.stock ?? p.stock,
      isWishlisted: real?.isWishlisted || false,
    };
  };

  return (
    <section className="best-seller-section">
      <div className="best-seller-content">
        <h2 className="best-seller-title">
          <span role="img" aria-label="star">🌟</span> Best Sellers <span role="img" aria-label="star">🌟</span>
        </h2>
  <div className="best-seller-grid" ref={gridRef}>
          {bestSellers.map((p, i) => {
            const normalized = getNormalizedProduct(p, i);
            const outOfStock = normalized.stock === 0;
            return (
              <div
                className="best-seller-card"
                key={p.name}
                style={{ background: p.highlight, opacity: outOfStock ? 0.7 : 1 }}
                onClick={() => navigate(`/product/${encodeURIComponent(p.name.replace(/ /g, '-').toLowerCase())}`, { state: { product: normalized } })}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/product/${encodeURIComponent(p.name.replace(/ /g, '-').toLowerCase())}`, { state: { product: normalized } }); }}
              >
                {/* Tag removed as per request */}
                <div className="best-seller-img-container">
                  <ProductImage src={p.image} alt={p.name} className="best-seller-img" style={outOfStock ? {opacity:0.7} : {}} />
                  <button
                    className={`wishlist-icon-btn${normalized.isWishlisted ? ' wishlisted' : ''}`}
                    onClick={e => { e.stopPropagation(); onWishlist && onWishlist(normalized); }}
                    aria-label="Add to wishlist"
                    disabled={outOfStock}
                    style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {}}
                  >
                    <FaHeart />
                  </button>
                  {outOfStock && <div className="out-of-stock-badge">Out of Stock</div>}
                </div>
                <h3 className="best-seller-name" style={outOfStock ? {opacity:0.7} : {}}>{p.name}</h3>
                <div className="best-seller-desc" style={outOfStock ? {opacity:0.7} : {}}>{p.desc}</div>
                {/* Rating above price */}
                <div style={{margin:'8px 0 2px 0'}}>
                  <ProductRating productId={normalized.id} />
                </div>
                <div className="best-seller-prices">
                  <span className="best-seller-price">₹{p.price}</span>
                  <span className="best-seller-original">₹{p.originalPrice}</span>
                </div>
                <div className="best-seller-actions" onClick={e => e.stopPropagation()}>
                  <button className="best-seller-add" onClick={() => onAdd && onAdd(normalized)} disabled={outOfStock} style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {}}>Add to Cart</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}