import React from 'react';
import './PolicyPages.css';

const Terms = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Terms and Conditions</h1>
      <p style={{fontSize:'1.18em',marginBottom:'1.7em',textAlign:'center',fontWeight:500}}>
        Welcome to our website. By accessing and using our website and purchasing products from us, you agree to be bound by the following Terms and Conditions. Please read them carefully.
      </p>
      <div className="terms-section">
        <div className="terms-block">
          <span className="terms-num">1.</span>
          <div>
            <b>General Conditions</b><br/>
            Our website is provided for your personal, non-commercial use. We reserve the right to refuse service to anyone for any reason at any time.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">2.</span>
          <div>
            <b>Product Information & Pricing</b><br/>
            All product descriptions and pricing are subject to change at our sole discretion. We strive to be as accurate as possible, but we do not warrant that product descriptions or other content are error-free. The prices displayed on the website are in your local currency and do not include applicable taxes or shipping fees, which will be calculated at checkout.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">3.</span>
          <div>
            <b>Orders and Payment</b><br/>
            By placing an order, you agree to provide current, complete, and accurate purchase and account information. We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in the description or price of the product, or an error in your order.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">4.</span>
          <div>
            <b>Intellectual Property</b><br/>
            All content on this website, including text, graphics, logos, images, and product information, is our property and is protected by copyright and intellectual property laws. You may not use, reproduce, or distribute any content without our express written permission.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">5.</span>
          <div>
            <b>User Conduct</b><br/>
            You agree not to use our website for any unlawful purpose or to solicit others to perform or participate in any unlawful acts. You are prohibited from violating any intellectual property rights, harassing others, or submitting false or misleading information.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">6.</span>
          <div>
            <b>Limitation of Liability</b><br/>
            We are not liable for any direct, indirect, incidental, or consequential damages resulting from your use of our website or products. Your use of the service is at your sole risk.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">7.</span>
          <div>
            <b>Governing Law</b><br/>
            These Terms and Conditions and any separate agreements whereby we provide you products shall be governed by and construed in accordance with the laws of [Your Country/State].
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">8.</span>
          <div>
            <b>Changes to Terms</b><br/>
            We reserve the right to update, change, or replace any part of these Terms and Conditions by posting updates on our website. It is your responsibility to check this page periodically for changes.
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Terms;