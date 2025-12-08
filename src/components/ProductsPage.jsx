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
  const prevPathRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
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
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear search when entering products page from another page
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = prevPathRef.current;

    // If we just entered /products from a non-products page, clear search
    if (currentPath === '/products' && previousPath && !previousPath.includes('/products')) {
      setSearchTerm('');
    }

    prevPathRef.current = currentPath;
  }, [location.pathname, setSearchTerm]);

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
    navigate(`/product/${product.id}`, { state: { product, fromProductsPage: true } });
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
        <div className="mobile-filter-overlay" role="dialog" aria-modal="true" style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: '1000',
          display: 'flex',
          alignItems: 'flex-end',
          paddingTop: '20px'
        }}>
          <div className="mobile-filter-panel" style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxHeight: '90vh',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto'
          }}>
            <div className="mobile-filter-content" style={{
              padding: '20px 16px',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}>
              {/* Categories with embedded close */}
              <div className="filter-section categories-with-close">
                <div className="categories-header-row" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: '0',
                    color: '#2c2c2c'
                  }}>Categories</h4>
                  <button className="close-mobile-filter inline" onClick={closeMobileFilters} aria-label="Close filters" style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.8rem',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>×</button>
                </div>
                {categories.map(category => (
                  <label key={category} className="filter-checkbox" style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    color: '#444',
                    fontWeight: '500'
                  }}>
                    <input
                      type="checkbox"
                      checked={tempSelectedCategories.includes(category)}
                      onChange={() => setTempSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}
                      style={{
                        marginRight: '10px',
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>

              {/* Price Range */}
              <div className="filter-section" style={{
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e8e8e8'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  margin: '0 0 12px 0',
                  color: '#2c2c2c',
                  fontWeight: '600'
                }}>Price</h4>
                <div className="price-inputs" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(Number(e.target.value) || 0)}
                    className="price-input"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(Number(e.target.value) || 2000)}
                    className="price-input"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div className="price-slider" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={10}
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <div className="price-slider-values" style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    textAlign: 'center'
                  }}>₹{tempMinPrice} - ₹{tempMaxPrice}</div>
                </div>
              </div>

              {/* Ratings */}
              <div className="filter-section" style={{
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e8e8e8'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  margin: '0 0 12px 0',
                  color: '#2c2c2c',
                  fontWeight: '600'
                }}>Ratings</h4>
                {[5, 4, 3, 2, 1].map(rating => (
                  <label key={rating} className="filter-radio" style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    color: '#444'
                  }}>
                    <input
                      type="radio"
                      name="mobile-rating"
                      checked={tempSelectedRating === rating}
                      onChange={() => setTempSelectedRating(tempSelectedRating === rating ? null : rating)}
                      style={{
                        marginRight: '10px',
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    <span className="rating-stars" title={`Rated ${rating} & up`} style={{
                      fontSize: '1rem',
                      color: '#ffa500',
                      letterSpacing: '2px'
                    }}>
                      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mobile-filter-actions" style={{
                display: 'flex',
                gap: '10px',
                padding: '16px',
                borderTop: '1px solid #e8e8e8',
                position: 'sticky',
                bottom: '0',
                backgroundColor: '#ffffff'
              }}>
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
                  style={{
                    flex: '1',
                    padding: '12px 16px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: '#666',
                    cursor: 'pointer'
                  }}
                >
                  Remove Filters
                </button>
                <button type="button" className="apply-filters-btn" onClick={applyMobileFilters} style={{
                  flex: '1',
                  padding: '12px 16px',
                  backgroundColor: '#d32f2f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>Apply Filters</button>
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
          <div className="filter-clear-wrapper" style={{
            marginTop: '2rem',
            padding: '1rem 0',
            borderTop: '2px solid #e8e8e8'
          }}>
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
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(211, 47, 47, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.3)';
              }}
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
          <div className="product-grid" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '8px 6px' : '20px 16px',
            width: '100%',
            justifyItems: 'center',
            padding: isMobile ? '8px 0' : '0',
            marginRight: isMobile ? '0' : 'auto'
          }}>
            {sortedProducts.length === 0 ? (
              <div className="no-products">
                No products found.
              </div>
            ) : (
              sortedProducts.map((product) => {
                const discount = calculateDiscount(product.price, product.originalPrice);
                return (
                  <div key={product.id} className="product-card" style={{
                    background: '#ffffff',
                    border: '2px solid #c0a080',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '320px',
                    padding: isMobile ? '10px' : '16px',
                    position: 'relative',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
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
                      style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        objectFit: 'contain',
                        borderRadius: '10px',
                        marginBottom: isMobile ? '8px' : '12px',
                        background: '#ffffff',
                        padding: '0',
                        boxSizing: 'border-box',
                        display: 'block',
                        cursor: 'pointer'
                      }}
                    />
                    <h3 className="product-title" onClick={() => handleProductClick(product)} style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      margin: isMobile ? '6px 0 4px 0' : '8px 0 6px 0',
                      color: '#333333',
                      textAlign: 'center',
                      fontWeight: '500',
                      lineHeight: '1.3',
                      cursor: 'pointer'
                    }}>{product.name}</h3>
                    <div className="product-rating-row" style={{
                      margin: isMobile ? '4px 0 6px 0' : '4px 0 8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: isMobile ? '0.85rem' : '0.9rem'
                    }}>
                      <ProductRating productId={product.id} onRatingUpdate={(avg) => setRatingMap(prev => ({ ...prev, [product.id]: avg == null ? 0 : avg }))} />
                    </div>
                    {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
                    <div className="product-price-container" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: isMobile ? '8px' : '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span className="product-price" style={{
                        fontSize: isMobile ? '1.1rem' : '1.35rem',
                        color: '#d32f2f',
                        fontWeight: '700'
                      }}>₹{product.price}</span>
                      {product.originalPrice && (
                        <>
                          <span className="product-original-price" style={{
                            fontSize: isMobile ? '0.8rem' : '0.95rem',
                            color: '#999999',
                            textDecoration: 'line-through'
                          }}>₹{product.originalPrice}</span>
                          {discount && <span className="product-discount" style={{
                            color: '#22c55e',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            fontWeight: '600',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>-{discount}%</span>}
                        </>
                      )}
                    </div>
                    <button className="add-to-cart-btn" onClick={() => onAdd(product)} style={{
                      width: '100%',
                      padding: isMobile ? '9px 8px' : '11px 10px',
                      backgroundColor: '#d32f2f',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.2s ease'
                    }}>
                      Add to Cart
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