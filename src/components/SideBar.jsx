import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './SideBar.css';

function SideBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="sidebar-hamburger" onClick={() => setOpen(true)}>
        <FaBars size={28} />
      </button>
      <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)} />
      <nav className={`sidebar${open ? ' open' : ''}`}>
        <button className="sidebar-close" onClick={() => setOpen(false)}>
          <FaTimes size={28} />
        </button>
  <div className="sidebar-logo">B&amp;B</div>
        <ul className="sidebar-links">
          <li><NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/products" onClick={() => setOpen(false)}>Products</NavLink></li>
          <li><NavLink to="/orders-list" onClick={() => setOpen(false)}>Orders</NavLink></li>
          <li><NavLink to="/about" onClick={() => setOpen(false)}>About Us</NavLink></li>
          <li><NavLink to="/contact" onClick={() => setOpen(false)}>Contact Us</NavLink></li>
        </ul>
      </nav>
    </>
  );
}

export default SideBar;