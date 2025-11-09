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

import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import './Wishlist.css';
import ProductRating from './ProductRating';

function Wishlist({ items = [], onRemove, onMoveToCart }) {
  const navigate = useNavigate();
  return (
    <section className="wishlist-page">
      <h2>Your Wishlist</h2>
      {items.length === 0 ? (
        <p className="empty-msg">No favorites yet.</p>
      ) : (
        <div className="wishlist-container">
          {items.map((item) => {
            const outOfStock = item.stock === 0;
            return (
              <div key={item.id} className="wishlist-item" style={{position:'relative'}}>
                {outOfStock && <div className="out-of-stock-badge" style={{position:'absolute',top:16,right:16,background:'#b71c1c',color:'#fff',fontWeight:700,fontSize:'1em',padding:'4px 14px',borderRadius:'8px',letterSpacing:'0.5px',boxShadow:'0 2px 8px #bcae9e33',zIndex:2,textAlign:'center'}}>Out of Stock</div>}
                <ProductImage
                  src={item.mainImage}
                  alt={item.name}
                  className="wishlist-image"
                  style={outOfStock ? {opacity:0.7, cursor:'pointer'} : {cursor:'pointer'}}
                  onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                />
                <div className="wishlist-details">
                  <h3
                    style={outOfStock ? {opacity:0.7, cursor:'pointer'} : {cursor:'pointer'}}
                    onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                  >
                    {item.name}
                  </h3>
                    <ProductRating productId={item.id} />
                  <p className="price">₹{item.price}</p>
                  <div className="wishlist-actions">
                    <button className="move-btn" onClick={() => onMoveToCart(item)} disabled={outOfStock} style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {}}>
                      <FaShoppingCart /> Move to Cart
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => onRemove(item.id)}
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Wishlist;