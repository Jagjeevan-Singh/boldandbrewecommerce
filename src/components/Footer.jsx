import React from 'react';
import { NavLink } from 'react-router-dom';
import './Footer.css';
import logo from '../assets/logo.png'; // Adjust the path as necessary

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Left: Logo and description */}
        <div className="footer-logo-section">
          <img src={logo} alt="Brand Logo" className="footer-logo" />
          <p> +91-93104-75549</p>
          <p> boldandbrew@gmail.com</p>
        </div>

        {/* Center: Navigation Links */}
        <div className="footer-links-section">
          <h2>Company</h2>
          <ul>
            <li><NavLink to="/about">About Us</NavLink></li>
            <li><NavLink to="/contact">Contact Us</NavLink></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><NavLink to="/orders">Track Order</NavLink></li>
          </ul>
        </div>

        {/* Right: Legal & Social */}
        <div className="footer-legal-section">
          <h2>Legal</h2>
          <ul>
            <li><NavLink to="/terms">Terms & Conditions</NavLink></li>
            <li><NavLink to="/privacy">Privacy Policy</NavLink></li>
            <li><NavLink to="/return-policy">Return Policy</NavLink></li>
            <li><NavLink to="/return-cancel-policy">Cancellation & Refund Policy</NavLink></li>
            <li><NavLink to="/shipping-policy">Shipping Policy</NavLink></li>
          </ul>
          <div className="footer-social-icons">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Bold&Brew. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
