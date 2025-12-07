import React from 'react';
import './PolicyPages.css';


const ReturnPolicy = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Return Policy</h1>
      <div className="policy-blocks">
        <div className="policy-block">
          <div className="policy-block-number">1</div>
          <div className="policy-block-content">
            <h2>Eligibility for Returns</h2>
            <p>
              You may request a return or a refund for products that are <b>damaged or defective upon arrival</b>. We do not accept returns for products that have been opened or used due to health and safety regulations.
            </p>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">2</div>
          <div className="policy-block-content">
            <h2>Damaged or Defective Items</h2>
            <p>
              If your product arrives damaged or defective, please contact us within <b>7 days of delivery</b>. You must provide your order number and clear photos of the damaged item and its packaging. We will assess the issue and, if approved, offer you a full refund or a replacement at no additional cost.
            </p>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">3</div>
          <div className="policy-block-content">
            <h2>Non-Returnable Items</h2>
            <ul>
              <li>Products that have been opened or used.</li>
              <li>Items returned after the 7-day grace period.</li>
              <li>Products not purchased directly from our website.</li>
            </ul>
          </div>
        </div>
        <div className="policy-block">
          <div className="policy-block-number">4</div>
          <div className="policy-block-content">
            <h2>Refund Process</h2>
            <p>
              Once your return request is approved, your refund will be processed to the original payment method within <b>4-5</b> business days. The time it takes for the refund to appear on your statement may vary depending on your bank.
            </p>
          </div>
        </div>
            <div className="policy-block">
              <div className="policy-block-number">5</div>
              <div className="policy-block-content">
                <h2>Contact Us</h2>
                <p>
                  To initiate a return or if you have any questions about this policy, please contact our customer service team at <a href="mailto:boldandbrew@gmail.com"><b>boldandbrew@gmail.com</b></a> or call us at <b>+91 93104 75549</b> with your order number ready.
                </p>
              </div>
            </div>
      </div>
    </div>
  </div>
);

export default ReturnPolicy;