import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaHeart } from 'react-icons/fa';
import { CircularText } from '../blocks/TextAnimations/CircularText/CircularText.jsx';
import './Header.css';
import { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png';
import SideBar from './SideBar';

function Header({ cartCount = 0, wishlistCount = 0 }) {
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(null);

  // Clear search when navigating away from products page
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = prevPathRef.current;

    // If we were on /products and now we're not, clear the search
    if (previousPath === '/products' && currentPath !== '/products') {
      if (typeof window.setAppSearchTerm === 'function') {
        window.setAppSearchTerm('');
      }
    }

    prevPathRef.current = currentPath;
  }, [location.pathname]);

  const handleSearchClick = () => {
    setShowSearch(true);
  };

  const handleSearchBlur = () => {
    setShowSearch(false);
    setLocalSearch('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      if (typeof window.setAppSearchTerm === 'function') {
        window.setAppSearchTerm(localSearch);
      }
      setShowSearch(false);
      setLocalSearch('');
      navigate('/products');
    }
  };
  return (
    <header className="header">
      <SideBar />
      {/* Left: Circular Text Logo */}
      <div className="nav-left">
        <NavLink to="/" className="circular-logo">
          <div className="circular-logo-wrapper">
            <img src={logo} alt="Bold & Brew Logo" className="center-logo" />
            <CircularText
              text="Bold&Brew * Bold&Brew * "
              onHover="goBonkers"
              spinDuration={12}
              className="circular-text"
            />
          </div>
        </NavLink>
      </div>
      {/* Right: Icons or Search */}
      <div className="nav-right">
        {!showSearch && (
          <button className="icon-navlink" onClick={handleSearchClick}>
            <FaSearch />
          </button>
        )}
        {showSearch && (
          <div className="search-overlay">
            <form onSubmit={handleSearchSubmit} className="search-overlay-form">
              <label htmlFor="header-search" className="visually-hidden">Search</label>
              <input
                id="header-search"
                name="search"
                type="text"
                className="search-overlay-input"
                autoFocus
                placeholder="Search"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="search-overlay-icon-btn" aria-label="Search">
                <FaSearch />
              </button>
              <button type="button" className="search-overlay-close" aria-label="Close search" onClick={() => setShowSearch(false)}>
                &#10005;
              </button>
            </form>
          </div>
        )}
        <NavLink to="/wishlist" className="icon-navlink">
          <FaHeart />
          {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
        </NavLink>
        <NavLink to="/cart" className="icon-navlink">
          <FaShoppingCart />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </NavLink>
        <NavLink to="/login" className="icon-navlink">
          <FaUser />
        </NavLink>
      </div>
    </header>
  );
}

export default Header;
