import React from 'react';
import './About.css';

import logo from '../assets/logo.png';
import quality from '../assets/quality.png';
import sustainability from '../assets/sustainability.png';
import community from '../assets/community.png';

const About = () => {
  return (
    <div className="about-container coffee-theme-bg">
      <div className="about-header">
        <img src={logo} alt="Bold & Brew Logo" className="about-logo" />
        <h1 className="about-title">About <span className="coffee-highlight">BOLD & BREW</span></h1>
      </div>
      <div className="about-main-content">
        <div className="about-story-card">
          <p className="about-description">
            Welcome to <b>Bold & Brew</b> — your destination for <span className="coffee-highlight">premium coffee experiences</span> that fuel your day and satisfy your soul.<br /><br />
            We are more than just a coffee brand; we are a <span className="coffee-highlight">lifestyle movement</span> for those who live passionately, work relentlessly, and crave that perfect cup to start or end their day.
          </p>
          <blockquote className="about-quote">“Where every cup tells a story.”</blockquote>
        </div>
        <div className="about-values-section">
          <h2 className="values-title">Our Values</h2>
          <div className="values-list">
            <div className="value-card">
              <img src={quality} alt="Quality" className="value-icon" />
              <h3>Quality</h3>
              <p>Handpicked, ethically sourced beans roasted to perfection for unmatched richness and aroma.</p>
            </div>
            <div className="value-card">
              <img src={sustainability} alt="Sustainability" className="value-icon" />
              <h3>Sustainability</h3>
              <p>Eco-friendly packaging and support for small-scale farmers — every sip makes a difference.</p>
            </div>
            <div className="value-card">
              <img src={community} alt="Community" className="value-icon" />
              <h3>Community</h3>
              <p>We believe in sharing memorable moments and building a passionate coffee community.</p>
            </div>
          </div>
        </div>
        <div className="about-signature-section">
          <p className="about-signature">Thank you for choosing <span className="coffee-highlight">Bold & Brew</span> — where <b>bold flavor</b> meets <b>bold ambition</b>.</p>
        </div>
      </div>
    </div>
  );
};

export default About;