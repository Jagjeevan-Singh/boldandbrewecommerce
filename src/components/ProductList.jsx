
import { FaCartPlus, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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
  const EXCLUDE_NAMES = ['PURE INSTANT COFFEE', 'HAZELNUT', 'VANILLA COFFEE'];
  const filtered = Array.isArray(products)
    ? products.filter(p => !EXCLUDE_NAMES.includes(String(p.name || '').trim().toUpperCase()))
    : [];

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  return (
    <section className="products-section" data-aos="fade-up">
  <h2 className="india-coffee-title">India's #1 Instant Coffee</h2>
      <div className="product-grid">
        {filtered.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <div key={product.id} className="product-card">
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
                style={{ cursor: 'pointer', opacity: outOfStock ? 0.6 : 1 }}
              />
              <h3
                className="product-title"
                onClick={() => handleProductClick(product)}
                style={{ cursor: 'pointer', opacity: outOfStock ? 0.7 : 1 }}
              >
                {product.name}
              </h3>
              <ProductRating productId={product.id} />
              <div className="product-prices">
                <span className="product-price">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="product-original-price">₹{product.originalPrice}</span>
                )}
              </div>
              <button
                className="add-btn add-btn-full"
                onClick={() => onAdd(product)}
                disabled={outOfStock}
                style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {}}
              >
                <FaCartPlus /> Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProductList;