import ProductRating from './ProductRating';

import { useNavigate } from 'react-router-dom';
import './BestSellerSection.css';

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

const bestSellers = [
  {
    name: 'Bold & Brew Strong Instant Coffee Powder | 70% Coffee 30% Chicory | Rich Aroma & Intense Taste | South Indian Style Blend | Perfect for Hot & Cold Coffee | 100g Jar',
    desc: 'Strong South Indian style blend: 70% coffee, 30% chicory. Rich aroma, intense taste. Great hot or cold.',
    price: 299,
    originalPrice: 499,
    image: 'https://ik.imagekit.io/3xnjrgh8n/9.png?updatedAt=1764437942985',
    highlight: '#f7e7ce',
  },
  {
    name: 'Bold & Brew Pure Instant Coffee Powder | 100% Premium Coffee | Rich Aroma & Strong Taste | Perfect for Espresso, Latte & Cappuccino | Hot & Cold Brew | 100g Jar',
    desc: '100% premium instant coffee with rich aroma and strong taste. Perfect for espresso, latte, cappuccino.',
    price: 299,
    originalPrice: 499,
    image: 'https://ik.imagekit.io/3xnjrgh8n/1.png?updatedAt=1764437943137',
    highlight: '#f3e6e3',
  },
];

import { useMemo, useRef, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
export default function BestSellerSection({ onAdd, onWishlist, products = [] }) {
  const gridRef = useRef(null);

  const navigate = useNavigate();
  // Prefer live products (from Firestore) by matching name; fallback to static data
  const EXCLUDE_NAMES = ['PURE INSTANT COFFEE', 'HAZELNUT', 'VANILLA COFFEE'];
  const norm = str => String(str || '').trim().toUpperCase();

  const getNormalizedProduct = (p) => {
    const real = products
      .filter(prod => !EXCLUDE_NAMES.includes(norm(prod.name)))
      .find(prod => norm(prod.name) === norm(p.name));

    const price = real?.price ?? p.price;
    const originalPrice = real?.originalPrice ?? real?.mrp ?? real?.compareAtPrice ?? p.originalPrice ?? price;
    const name = real?.name || p.name;
    const desc = real?.description || p.desc || p.description || '';

    return {
      ...p,
      ...real,
      name,
      desc,
      price,
      originalPrice,
      id: real?.id || p.id || name.replace(/ /g, '-').toLowerCase(),
      mainImage: real?.mainImage || real?.image || p.image,
      description: desc,
      brand: real?.brand || p.brand || 'Bold & Brew',
      stock: real?.stock ?? p.stock,
      isWishlisted: real?.isWishlisted || false,
    };
  };

  return (
    <section className="best-seller-section">
      <div className="best-seller-content">
        <h2 className="best-seller-title">
          <span role="img" aria-label="star"></span> Best  Sellers <span role="img" aria-label="star"></span>
        </h2>
  <div className="best-seller-grid" ref={gridRef}>
          {bestSellers.map((p) => {
            const normalized = getNormalizedProduct(p);
            const outOfStock = normalized.stock === 0;
            return (
              <div
                className="best-seller-card"
                key={normalized.id}
                style={{ background: p.highlight, opacity: outOfStock ? 0.7 : 1 }}
                onClick={() => navigate(`/product/${encodeURIComponent(normalized.name.replace(/ /g, '-').toLowerCase())}`, { state: { product: normalized } })}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/product/${encodeURIComponent(normalized.name.replace(/ /g, '-').toLowerCase())}`, { state: { product: normalized } }); }}
              >
                {/* Tag removed as per request */}
                <div className="best-seller-img-container">
                  <ProductImage src={normalized.mainImage || p.image} alt={normalized.name} className="best-seller-img" style={outOfStock ? {opacity:0.7} : {}} />
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
                <h3 className="best-seller-name" style={outOfStock ? {opacity:0.7} : {}}>{normalized.name}</h3>
                <div className="best-seller-desc" style={outOfStock ? {opacity:0.7} : {}}>{normalized.desc}</div>
                {/* Rating above price */}
                <div style={{margin:'8px 0 2px 0'}}>
                  <ProductRating productId={normalized.id} />
                </div>
                <div className="best-seller-prices">
                  <span className="best-seller-price">₹{normalized.price}</span>
                  <span className="best-seller-original">₹{normalized.originalPrice}</span>
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