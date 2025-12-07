import CustomerReviewList from './CustomerReviewList';
import './CustomerReviewList.css';
import CustomerReviewDrawer from './CustomerReviewDrawer';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import './CustomerReviewDrawer.css';
// Vite: import all images in assets at build time
// Updated to new Vite API
const images = import.meta.glob('../assets/*', { eager: true, query: '?url', import: 'default' });

function ProductImage({ src, alt, ...props }) {
  // If src is an HTTP/HTTPS URL, use it directly. Otherwise treat as asset
  if (!src) return <img src="" alt={alt} {...props} />;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return <img src={src} alt={alt} {...props} />;
  }
  // Legacy asset handling
  if (src && !src.startsWith('http')) {
    const match = Object.entries(images).find(([key]) => key.endsWith('/' + src));
    if (match) {
      return <img src={match[1]} alt={alt} {...props} />;
    }
  }
  return <img src={src} alt={alt} {...props} />;
}

import { useParams, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import './ProductLanding.css';
import ProductReviews from './ProductReviews';
import ProductRating from './ProductRating';
import CustomerReviewSummary from './CustomerReviewSummary';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './CustomerReviewSummary.css';

function ProductLanding({ products, onAddToCart, onAddToWishlist }) {
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    how: true,
    inside: false,
    faqs: false,
    reviews: true,
  });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const { id } = useParams();
  const location = useLocation();
  let product = null;
  const EXCLUDE_NAMES = ['PURE INSTANT COFFEE', 'HAZELNUT', 'VANILLA COFFEE'];
  // Try to find by id in products array (Firestore live data)
  if (id) {
    product = products.find(p => String(p.id) === String(id));
  }
  // If not found, fallback to location.state (e.g. from BestSellerSection, Wishlist, Cart)
  if (!product && location.state?.product) {
    // Try to match by name or fallback to state product
    const stateProduct = location.state.product;
    product = products.find(p => p.id === stateProduct.id || p.name === stateProduct.name) || stateProduct;
  }
  // If product is in exclusion list, block rendering and show not found
  if (product && EXCLUDE_NAMES.includes(String(product.name || '').trim().toUpperCase())) {
    product = null;
  }
  // Patch: If product only has 'image' (from best seller), synthesize mainImage and images
  if (product && !product.mainImage && product.image) {
    product = {
      ...product,
      mainImage: product.image,
      images: [product.image],
      description: product.desc || product.description || '',
      brand: product.brand || 'Bold & Brew',
    };
  }

  // Customer reviews state for summary (must be after product is determined)
  const [allReviews, setAllReviews] = useState([]);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  useEffect(() => {
    if (!product?.id) return;
    const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
    const unsub = onSnapshot(q, (snap) => {
      setAllReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [product?.id]);

  // For espresso, show a fixed set of images as gallery
  // Live subscription to this product doc to get updated images
  const [liveProduct, setLiveProduct] = useState(null);
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, 'products', id);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setLiveProduct({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [id]);

  const effectiveProduct = liveProduct || product;
  // Build gallery strictly from Firestore product fields
  const dynamicImages = (effectiveProduct?.images && Array.isArray(effectiveProduct.images))
    ? effectiveProduct.images.filter(img => typeof img === 'string' && img.trim() !== '')
    : [];
  const mainImg = effectiveProduct?.mainImage && typeof effectiveProduct.mainImage === 'string' && effectiveProduct.mainImage.trim() !== '' ? effectiveProduct.mainImage.trim() : null;
  // Build gallery: keep order and duplicates so user can see every slot stored
  const galleryImages = [
    ...(mainImg ? [mainImg] : []),
    ...dynamicImages
  ];
  if (process.env.NODE_ENV !== 'production') {
    console.log('ProductLanding raw images array:', effectiveProduct?.images);
    console.log('ProductLanding built galleryImages:', galleryImages);
  }
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] || '');
  useEffect(() => {
    const first = galleryImages[0] || mainImg || '';
    setSelectedImage(first);
  }, [effectiveProduct?.id, galleryImages.map(i=>i).join('|')]);
  // Responsive breakpoint for gallery orientation
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const galleryRef = useRef(null);

  if (!effectiveProduct) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Product not found</div>;
  }

  return (
    <>

      <div className="product-landing">
        {/* Main image and thumbnails */}
        <div className="product-main-image">
          <div style={{position:'relative',display:'inline-block'}}>
            <ProductImage
              ref={imgRef}
              src={selectedImage}
              alt={effectiveProduct.name}
              style={{ cursor: 'zoom-in', width: '100%', maxWidth: 400, borderRadius: 12 }}
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={e => {
                const rect = imgRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setZoomPos({ x, y });
              }}
            />
            {showZoom && (() => {
              // resolve actual image URL for local assets
              let zoomImgUrl = selectedImage;
              if (selectedImage && !selectedImage.startsWith('http')) {
                const match = Object.entries(images).find(([key]) => key.endsWith('/' + selectedImage));
                if (match) zoomImgUrl = match[1];
              }
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.max(0, Math.min(zoomPos.x - 60, (imgRef.current?.width || 300) - 120)),
                    top: Math.max(0, Math.min(zoomPos.y - 60, (imgRef.current?.height || 300) - 120)),
                    width: 120,
                    height: 120,
                    border: '2px solid #7c5a3a',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px #0003',
                    background: '#fff',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 240,
                      height: 240,
                      backgroundImage: `url(${zoomImgUrl})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: `-${Math.max(0, Math.min(zoomPos.x - 60, (imgRef.current?.width || 300) - 120))*2}px -${Math.max(0, Math.min(zoomPos.y - 60, (imgRef.current?.height || 300) - 120))*2}px`,
                      backgroundSize: `${(imgRef.current?.width || 300)*2}px ${(imgRef.current?.height || 300)*2}px`,
                      filter: 'contrast(1.1) saturate(1.1)',
                      imageRendering: 'auto',
                    }}
                  />
                </div>
              );
            })()}
          </div>
          {/* Thumbnails gallery */}
          {isMobile ? (
            <div className={`product-images mobile-horizontal`}>
              {galleryImages.map((img, index) => (
                <ProductImage
                  key={index}
                  src={img}
                  alt={`${effectiveProduct.name} ${index}`}
                  className={`thumb-image${selectedImage === img ? ' selected' : ''}`}
                  onClick={() => setSelectedImage(img)}
                  style={{border:selectedImage===img?'3px solid #bf360c':'2px solid #d9c9bb'}}
                />
              ))}
            </div>
          ) : (
            <div className="desktop-gallery-wrapper" style={{position:'relative',height:420}}>
              <button type="button" aria-label="Scroll up" onClick={()=>galleryRef.current?.scrollBy({top:-120,behavior:'smooth'})} className="gallery-arrow gallery-arrow-top">▲</button>
              <div ref={galleryRef} className={`product-images desktop-vertical`} style={{scrollBehavior:'smooth'}}>
                {galleryImages.map((img, index) => (
                  <ProductImage
                    key={index}
                    src={img}
                    alt={`${effectiveProduct.name} ${index}`}
                    className={`thumb-image${selectedImage === img ? ' selected' : ''}`}
                    onClick={() => setSelectedImage(img)}
                    style={{border:selectedImage===img?'3px solid #bf360c':'2px solid #d9c9bb'}}
                  />
                ))}
              </div>
              <button type="button" aria-label="Scroll down" onClick={()=>galleryRef.current?.scrollBy({top:120,behavior:'smooth'})} className="gallery-arrow gallery-arrow-bottom">▼</button>
            </div>
          )}
        </div>

        {/* Right product details */}
        <div className="product-details">
          <h2>{effectiveProduct.name}</h2>
          <span className="brand">{effectiveProduct.brand}</span>
          <div style={{ margin: '6px 0 8px 0' }}>
            <ProductRating productId={effectiveProduct.id} />
          </div>
          <div>
            <span className="price">₹{effectiveProduct.price}</span>
            <span className="discount">₹{effectiveProduct.originalPrice}</span>
          </div>
          {effectiveProduct.stock === 0 && (
            <div className="out-of-stock-badge" style={{position:'static',margin:'10px 0 0 0',display:'inline-block',background:'#b71c1c',color:'#fff',fontWeight:700,fontSize:'1.1em',padding:'4px 14px',borderRadius:'8px',letterSpacing:'0.5px',boxShadow:'0 2px 8px #bcae9e33',zIndex:2,textAlign:'center'}}>Out of Stock</div>
          )}
          <div className="buttons">
            <button onClick={() => onAddToCart(effectiveProduct)} disabled={effectiveProduct.stock === 0} style={effectiveProduct.stock === 0 ? {opacity:0.6, cursor:'not-allowed'} : {}}>Add to Cart</button>
            <button onClick={() => onAddToWishlist(effectiveProduct)} disabled={effectiveProduct.stock === 0} style={effectiveProduct.stock === 0 ? {opacity:0.6, cursor:'not-allowed'} : {}}>Add to Wishlist</button>
          </div>
          <div className="description">
            <h4 style={{ fontWeight: 'bold', fontSize: '1.25em', marginBottom: '0.3em' }}>Description</h4>
            <p>{effectiveProduct.description}</p>
          </div>
        </div>
      </div>

      {/* Collapsible Info Sections */}
      <div className="product-info-sections">
        {/* How To Use */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('how')}>
            <span>How To Use?</span>
            <span className="icon">{openSections.how ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.how && (
            <div className="info-content">
              <ol className="how-steps">
                <li><b>Step 1</b> - Add 2 gms of Coffee Powder to 180 ml of Hot/Cold Milk.</li>
                <li><b>Step 2</b> - Add sugar as per your taste.</li>
                <li><b>Step 3</b> - Blend for Frothy Cold Coffee/ Stir for Delicious Hot Coffee!</li>
                <li><b>Step 4</b> - Voila! Your Instant Coffee is ready.</li>
              </ol>
            </div>
          )}
        </div>
        {/* What's Inside */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('inside')}>
            <span>What's Inside?</span>
            <span className="icon">{openSections.inside ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.inside && (
            <div className="info-content">
              <p><b>100% pure instant coffee.</b></p>
              <p>But that's only part of the story.</p>
              <p>Our coffee is made from the finest Arabica and Robusta beans, carefully selected from high-altitude farms. Each bean is harvested with care and roasted to a perfect medium-dark, bringing out its rich, complex flavor.</p>
              <p>We then use a specialized process to crystallize the brew, preserving the full aroma and taste of a freshly made cup. This ensures that every granule in this jar holds the promise of an exceptional coffee experience.</p>
              <p>So, when you open this jar, you're not just getting instant coffee. You're getting the result of passion and dedication, transforming simple beans into a moment of pure bliss. It’s a cup made with love, ready for you to enjoy.</p>
            </div>
          )}
        </div>
        {/* FAQs */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('faqs')}>
            <span>FAQs</span>
            <span className="icon">{openSections.faqs ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.faqs && (
            <div className="info-content faqs">
              <div className="faq-item"><b>What is the shelf life of your instant coffee?</b><br/>Our instant coffee has a best-by date of 24 months from the date of manufacture. However, for the freshest and most vibrant flavor, we recommend enjoying it within 12-18 months of opening, as long as it is stored in a cool, dry place with the lid tightly sealed. Proper storage is key to preserving the rich aroma and taste of every granule.</div>
              <div className="faq-item"><b>Can I add the coffee powder to hot/cold milk or water?</b><br/>Absolutely! Our instant coffee is crafted to be versatile and dissolves beautifully in both hot and cold liquids.<br/><br/>For a Hot Coffee: Simply add 1-2 teaspoons of coffee powder to a cup of hot water or hot milk, stir until dissolved, and enjoy.<br/><br/>For a Cold Coffee: First, dissolve the coffee powder in a small amount of hot water to create a concentrate. Then, add cold water or chilled milk and ice. Stir vigorously or blend for a perfect, refreshing iced coffee.<br/><br/>Feel free to experiment with the ratios to create your perfect cup, whether it's a bold black coffee or a creamy latte.</div>
              <div className="faq-item"><b>Which coffee beans are used to make Bold & Brew Instant Coffee?</b><br/>We believe in using the best ingredients to create an exceptional product. Our instant coffee is a carefully balanced blend of premium Arabica and Robusta beans. The Arabica beans provide a smooth, aromatic, and nuanced flavor profile, while the Robusta beans add a rich body and a delightful boldness to the blend. This combination ensures a well-rounded and satisfying coffee experience with every sip.</div>
            </div>
          )}
        </div>
        {/* Customer Reviews */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('reviews')}>
            <span>Customer Reviews</span>
            <span className="icon">{openSections.reviews ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.reviews && (
            <div className="info-content reviews">
              <CustomerReviewSummary
                reviews={allReviews}
                onWriteReview={() => setShowReviewDrawer(true)}
              />
            </div>
          )}
        </div>

        {/* Review Drawer/Modal */}
        <CustomerReviewDrawer
          open={showReviewDrawer}
          onClose={() => setShowReviewDrawer(false)}
          onSubmit={async ({ name, email, rating, comment }) => {
            if (!product?.id) return;
            await addDoc(collection(db, 'reviews'), {
              productId: product.id,
              userName: name,
              userEmail: email,
              rating,
              review: comment,
              createdAt: serverTimestamp(),
            });
            setShowReviewDrawer(false);
          }}
        />

        {/* Show all reviews below the drawer */}
        <CustomerReviewList reviews={allReviews} />
      </div>
    </>
  );
}

export default ProductLanding;