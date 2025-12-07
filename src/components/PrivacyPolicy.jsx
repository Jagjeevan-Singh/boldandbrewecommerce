import React from 'react';
import './PolicyPages.css';

const PrivacyPolicy = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Privacy Policy</h1>
      <p style={{fontSize:'1.18em',marginBottom:'1.7em',textAlign:'center',fontWeight:500}}>
        Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.
      </p>
      <div className="terms-section">
        <div className="terms-block">
          <span className="terms-num">1.</span>
          <div>
            <b>Information We Collect</b><br/>
            We collect personal information that you provide directly to us when you make a purchase or contact us. This may include your name, email address, shipping address, and payment information. We also automatically collect certain information when you visit our site, such as your IP address, browser type, and a record of your interactions on our website, including products viewed.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">2.</span>
          <div>
            <b>How We Use Your Information</b><br/>
            We use the information we collect for the following purposes:<br/>
            <ul style={{margin:'0.7em 0 0 1.2em',padding:0}}>
              <li>To process your orders and transactions.</li>
              <li>To communicate with you about your order.</li>
              <li>To improve our website and customer service.</li>
              <li>To send you promotional emails about new products and offers if you have opted in to receive them.</li>
            </ul>
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">3.</span>
          <div>
            <b>Data Sharing</b><br/>
            We do not sell your personal information. We may share your information with trusted third parties who help us operate our website and services, such as payment processors and shipping carriers. These third parties are obligated to keep your information confidential. We may also disclose your information if required by law.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">4.</span>
          <div>
            <b>Cookies</b><br/>
            Our website uses "cookies" to enhance your experience. Cookies are small data files stored on your device that help us remember your preferences, keep you logged in, and analyze website traffic. You can choose to disable cookies in your browser settings, but please note that some parts of the website may not function properly.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">5.</span>
          <div>
            <b>Your Rights</b><br/>
            You have the right to access the personal information we hold about you and to ask that your information be corrected, updated, or deleted. If you would like to exercise this right, please contact us using the information below.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">6.</span>
          <div>
            <b>Contact Us</b><br/>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at <a href="mailto:boldandbrew@gmail.com">boldandbrew@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
