import React from 'react';
import './PolicyPages.css';

const ReturnCancelPolicy = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Cancellation & Refund Policy</h1>
      <p style={{fontSize:'1.18em',marginBottom:'1.7em',textAlign:'center',fontWeight:500}}>
        We understand that sometimes plans change. Here is our policy regarding order cancellations and refunds.
      </p>
      <div className="terms-section">
        <div className="terms-block">
          <span className="terms-num">1.</span>
          <div>
            <b>Order Cancellation</b><br/>
            You may cancel your order at any time as long as it has not yet been processed for shipping.<br/><br/>
            <b>How to Cancel:</b> To request a cancellation, please contact us immediately at <a href="mailto:boldandbrew@gmail.com">boldandbrew@gmail.com</a> or call us at <a href="tel:9310475549">9310475549</a>. Be sure to include your order number in your message to help us locate your order quickly.<br/><br/>
            <b>Cancellation Confirmation:</b> If your cancellation request is successful, you will receive an email confirmation. We will then process a full refund to your original payment method.<br/><br/>
            <b>Please note:</b> If your order has already been shipped, we will be unable to cancel it.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">2.</span>
          <div>
            <b>Refund Policy</b><br/>
            Due to the consumable nature of our products, we do not accept returns or offer refunds on items that have been opened or used. However, your satisfaction is our priority. We are happy to issue a refund or a replacement for the following reasons:
            <ul style={{margin:'0.7em 0 0 1.2em',padding:0}}>
              <li><b>Damaged or Defective Products:</b> If your order arrives damaged or defective, please contact us within 7 days of delivery. To process a refund, we require:
                <ul style={{margin:'0.5em 0 0 1.2em',padding:0}}>
                  <li>Your order number.</li>
                  <li>A clear description of the damage or defect.</li>
                  <li>Photos of the damaged item and its original packaging.</li>
                </ul>
                Once we review the provided information, we will issue a full refund or send a replacement product at no additional cost.
              </li>
              <li><b>Incorrect Product Shipped:</b> If you receive a product that is different from what you ordered, please contact us within 7 days of delivery. We will arrange for the correct product to be shipped to you and will provide instructions on how to handle the incorrect item.</li>
            </ul>
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">3.</span>
          <div>
            <b>Refund Processing</b><br/>
            All approved refunds will be processed to your original payment method. Please allow [Number] business days for the refund to reflect in your account, as processing times may vary between financial institutions.
          </div>
        </div>
        <div className="terms-block">
          <span className="terms-num">4.</span>
          <div>
            <b>Need Assistance?</b><br/>
            If you have any questions about our policy or need help with a cancellation or refund, please don't hesitate to reach out to our customer support team at <a href="mailto:boldandbrew@gmail.com">boldandbrew@gmail.com</a> or call <a href="tel:+919310475549">+91 9310475549</a>. We are here to help!
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ReturnCancelPolicy;
