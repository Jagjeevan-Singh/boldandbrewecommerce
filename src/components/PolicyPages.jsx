import React from 'react';
import './PolicyPages.css';


const PrivacyPolicy = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Privacy Policy</h1>
      <div className="policy-blocks">
        <div className="policy-block">
          <div className="policy-block-number">1</div>
          <div className="policy-block-content">
            <h2>Introduction</h2>
            <p>
              At <b>Bold&amp;Brew</b>, your privacy is our top priority. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">2</div>
          <div className="policy-block-content">
            <h2>Information We Collect</h2>
            <ul>
              <li><b>Personal Data:</b> Name, email address, phone number, and delivery address when you register or place an order.</li>
              <li><b>Usage Data:</b> Pages visited, time spent, and other analytics to improve your experience.</li>
              <li><b>Cookies:</b> We use cookies to personalize content and remember your preferences.</li>
            </ul>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">3</div>
          <div className="policy-block-content">
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To process orders and provide customer support.</li>
              <li>To personalize your experience and recommend products.</li>
              <li>To improve our website and services through analytics.</li>
              <li>To send updates, offers, and important notifications (with your consent).</li>
            </ul>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">4</div>
          <div className="policy-block-content">
            <h2>Data Sharing & Security</h2>
            <ul>
              <li>We <b>never</b> sell or rent your personal data to third parties.</li>
              <li>We may share data with trusted partners for order fulfillment and analytics, under strict confidentiality agreements.</li>
              <li>Your data is protected with industry-standard security measures.</li>
            </ul>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">5</div>
          <div className="policy-block-content">
            <h2>Your Rights & Choices</h2>
            <ul>
              <li>You can access, update, or delete your personal information at any time.</li>
              <li>You may opt out of marketing communications via your account settings or by contacting us.</li>
              <li>Cookies can be managed through your browser settings.</li>
            </ul>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">6</div>
          <div className="policy-block-content">
            <h2>Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not knowingly collect personal information from children.
            </p>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">7</div>
          <div className="policy-block-content">
            <h2>Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised date.
            </p>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">8</div>
          <div className="policy-block-content">
            <h2>Contact Us</h2>
            <p>
              If you have any questions or concerns about your privacy, please contact us at <a href="mailto:boldandbrew@gmail.com"><b>boldandbrew@gmail.com</b></a> or call us at <b>+91 93104 75549</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
