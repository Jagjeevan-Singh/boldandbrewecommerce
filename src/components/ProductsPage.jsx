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

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCartPlus, FaHeart } from 'react-icons/fa';
import ProductRating from './ProductRating';
import './ProductsPage.css';

function ProductsPage({ products, onAdd, onWishlist, searchTerm = '', setSearchTerm }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [tempMinPrice, setTempMinPrice] = useState(0);
  const [tempMaxPrice, setTempMaxPrice] = useState(2000);
  const [tempSelectedRating, setTempSelectedRating] = useState(null);
  const [ratingMap, setRatingMap] = useState({});

  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (setSearchTerm && prevPathRef.current === '/products' && location.pathname !== '/products') {
        setSearchTerm('');
      }
    };
  }, [setSearchTerm, location.pathname]);

  // Sync temp mobile filters when opening modal
  useEffect(() => {
    if (showMobileFilters) {
      setTempSelectedCategories(selectedCategories);
      setTempMinPrice(minPrice);
      setTempMaxPrice(maxPrice);
      setTempSelectedRating(selectedRating);
    }
  }, [showMobileFilters, selectedCategories, minPrice, maxPrice, selectedRating]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Get unique categories from products
  const categories = ['Instant Coffee', 'Accessories & Gifting'];

  // Unified rating extraction (covers multiple possible field names or reviews arrays)
  const extractRating = (product) => {
    if (ratingMap[product.id] != null) {
      return ratingMap[product.id];
    }
    const direct = product.rating ?? product.averageRating ?? product.avgRating ?? product.ratingValue;
    if (direct != null && direct !== '') {
      const num = Number(direct);
      if (!isNaN(num)) return num;
    }
    if (Array.isArray(product.reviews)) {
      const nums = product.reviews
        .map(r => Number(r.rating ?? r.stars ?? r.score))
        .filter(v => !isNaN(v));
      if (nums.length) return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    return 0;
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice(0);
    setMaxPrice(2000);
    setSelectedRating(null);
  };

  // Filter and sort products
  let filteredProducts = products;
  const EXCLUDE_NAMES = ['PURE INSTANT COFFEE', 'HAZELNUT', 'VANILLA COFFEE'];
  if (Array.isArray(filteredProducts)) {
    filteredProducts = filteredProducts.filter(p => !EXCLUDE_NAMES.includes(String(p.name || '').trim().toUpperCase()));
  }

  // Apply search filter
  if (searchTerm.trim() !== '') {
    filteredProducts = filteredProducts.filter(product => {
      const name = product.name.toLowerCase();
      return searchTerm
        .toLowerCase()
        .split(/\s+/)
        .some(word => word && name.includes(word));
    });
  }

  // Apply category filter (Instant Coffee acts as 'all products')
  if (selectedCategories.length > 0 && !selectedCategories.includes('Instant Coffee')) {
    filteredProducts = filteredProducts.filter(product => {
      const cat = (product.category || '').toLowerCase();
      return selectedCategories.some(sel => {
        if (sel === 'Accessories & Gifting') {
          // match accessories or gifting related categories
          return /access|gift/i.test(cat);
        }
        return sel === product.category;
      });
    });
  }

  // Apply price filter
  filteredProducts = filteredProducts.filter(product => {
    const price = Number(product.price);
    return price >= minPrice && price <= maxPrice;
  });

  // Apply rating filter (using unified extractor)
  if (selectedRating) {
    filteredProducts = filteredProducts.filter(product => extractRating(product) >= selectedRating);
  }

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low-high':
        return Number(a.price) - Number(b.price);
      case 'price-high-low':
        return Number(b.price) - Number(a.price);
      case 'name-a-z':
        return a.name.localeCompare(b.name);
      case 'name-z-a':
        return b.name.localeCompare(a.name);
      case 'rating':
        return extractRating(b) - extractRating(a);
      default:
        return 0;
    }
  });

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const openMobileFilters = () => setShowMobileFilters(true);
  const closeMobileFilters = () => setShowMobileFilters(false);
  const applyMobileFilters = () => {
    setSelectedCategories(tempSelectedCategories);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setSelectedRating(tempSelectedRating);
    setShowMobileFilters(false);
  };
  const clearMobileTempFilters = () => {
    setTempSelectedCategories([]);
    setTempMinPrice(0);
    setTempMaxPrice(2000);
    setTempSelectedRating(null);
  };

  return (
    <section className="products-page">
      {showMobileFilters && (
        <div className="mobile-filter-overlay" role="dialog" aria-modal="true">
          <div className="mobile-filter-panel">
            <div className="mobile-filter-content">
              {/* Categories with embedded close */}
              <div className="filter-section categories-with-close">
                <div className="categories-header-row">
                  <h4>Categories</h4>
                  <button className="close-mobile-filter inline" onClick={closeMobileFilters} aria-label="Close filters">×</button>
                </div>
                {categories.map(category => (
                  <label key={category} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={tempSelectedCategories.includes(category)}
                      onChange={() => setTempSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <h4>Price</h4>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(Number(e.target.value) || 0)}
                    className="price-input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(Number(e.target.value) || 2000)}
                    className="price-input"
                  />
                </div>
                <div className="price-slider">
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={10}
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(Number(e.target.value))}
                  />
                  <div className="price-slider-values">₹{tempMinPrice} - ₹{tempMaxPrice}</div>
                </div>
              </div>

              {/* Ratings */}
              <div className="filter-section">
                <h4>Ratings</h4>
                {[5, 4, 3, 2, 1].map(rating => (
                  <label key={rating} className="filter-radio">
                    <input
                      type="radio"
                      name="mobile-rating"
                      checked={tempSelectedRating === rating}
                      onChange={() => setTempSelectedRating(tempSelectedRating === rating ? null : rating)}
                    />
                    <span className="rating-stars" title={`Rated ${rating} & up`}>
                      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mobile-filter-actions">
                <button
                  type="button"
                  className="remove-filters-btn"
                  onClick={clearMobileTempFilters}
                  disabled={
                    tempSelectedCategories.length === 0 &&
                    tempMinPrice === 0 &&
                    tempMaxPrice === 2000 &&
                    tempSelectedRating === null
                  }
                >
                  Remove Filters
                </button>
                <button type="button" className="apply-filters-btn" onClick={applyMobileFilters}>Apply Filters</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="products-container">
        {/* Sidebar Filter */}
        <aside className="filter-sidebar">
          <h3 className="filter-title">Filter</h3>
          
          {/* Categories */}
          <div className="filter-section">
            <h4>Categories</h4>
            {categories.map(category => (
              <label key={category} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <h4>Price</h4>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
                className="price-input"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value) || 2000)}
                className="price-input"
              />
            </div>
            <div className="price-slider">
              <input
                type="range"
                min={0}
                max={5000}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
              <div className="price-slider-values">₹{minPrice} - ₹{maxPrice}</div>
            </div>
            <p className="price-tip">Tip: drag the slider or enter values manually</p>
          </div>

          {/* Ratings */}
          <div className="filter-section">
            <h4>Ratings</h4>
            {[5, 4, 3, 2, 1].map(rating => (
              <label key={rating} className="filter-radio">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === rating}
                  onChange={() => setSelectedRating(selectedRating === rating ? null : rating)}
                />
                <span className="rating-stars" title={`Rated ${rating} & up`}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </span>
              </label>
            ))}
          </div>

          {/* Clear Filters */}
          <div className="filter-clear-wrapper">
            <button
              type="button"
              className="filter-clear-btn"
              onClick={clearFilters}
              disabled={
                selectedCategories.length === 0 &&
                minPrice === 0 &&
                maxPrice === 2000 &&
                selectedRating === null
              }
            >
              Remove Filters
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="products-main">
          {/* Header with count and sort */}
          <div className="products-header">
            <button type="button" className="mobile-filter-button" onClick={openMobileFilters}>Filter</button>
            <h2>{sortedProducts.length} products</h2>
            <div className="sort-container">
              <label>Sort:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="relevance">Relevance</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A to Z</option>
                <option value="name-z-a">Name: Z to A</option>
                <option value="rating">Rating: High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="product-grid">
            {sortedProducts.length === 0 ? (
              <div className="no-products">
                No products found.
              </div>
            ) : (
              sortedProducts.map((product) => {
                const discount = calculateDiscount(product.price, product.originalPrice);
                return (
                  <div key={product.id} className="product-card">
                    <button
                      className={`wishlist-icon-btn${product.isWishlisted ? ' wishlisted' : ''}`}
                      onClick={() => onWishlist(product)}
                      aria-label="Add to wishlist"
                    >
                      <FaHeart />
                    </button>
                    <ProductImage
                      src={product.mainImage}
                      alt={product.name}
                      className="product-image"
                      onClick={() => handleProductClick(product)}
                    />
                    <h3 className="product-title" onClick={() => handleProductClick(product)}>{product.name}</h3>
                    <div className="product-rating-row">
                      <ProductRating productId={product.id} onRatingUpdate={(avg) => setRatingMap(prev => ({ ...prev, [product.id]: avg == null ? 0 : avg }))} />
                    </div>
                    {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
                    <div className="product-price-container">
                      <span className="product-price">₹{product.price}</span>
                      {product.originalPrice && (
                        <>
                          <span className="product-original-price">₹{product.originalPrice}</span>
                          {discount && <span className="product-discount">-{discount}%</span>}
                        </>
                      )}
                    </div>
                    <button className="add-to-cart-btn" onClick={() => onAdd(product)}>
                      Add to cart
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductsPage;