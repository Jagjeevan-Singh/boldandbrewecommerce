import emailjs from '@emailjs/browser';
import { getProductImageUrl } from '../utils/imageUtils';

// EmailJS Configuration
const EMAIL_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ugu0eah',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_zjf5zsm',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'Y3m1ic5-mSSYUkTKX',
  FROM_EMAIL: 'boldandbrew@gmail.com'
};

// Initialize EmailJS once on app startup
export const initializeEmailJS = () => {
  try {
    emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
    console.log('✅ EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize EmailJS:', error);
    return false;
  }
};

/**
 * Formats product details into HTML table rows
 */
const formatOrderItemsHTML = (items) => {
  const brandColor = '#3e2723';
  const border = '#e0d6cd';
  
  if (!items || items.length === 0) {
    return '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #7a6a5f;">No items in order</td></tr>';
  }

  return items
    .map(item => {
      const itemName = item.name || item.productName || item.title || item.product?.name || 'Unknown Product';
      const itemQty = item.quantity || item.qty || 1;
      const itemPrice = item.price ?? item.unitPrice ?? item.product?.price ?? 0;
      const imageUrl = getProductImageUrl(item);

      return `
        <tr style="vertical-align: top; border-bottom: 1px solid ${border};">
          <td style="padding: 14px 8px 14px 0; width: 72px;">
            <img 
              style="width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid ${border};" 
              src="${imageUrl}" 
              alt="${itemName}"
              onerror="this.src='https://via.placeholder.com/64?text=Product'"
            >
          </td>
          <td style="padding: 14px 8px;">
            <div style="font-weight: 600; color: ${brandColor}; font-size: 13px;">${itemName}</div>
            <div style="font-size: 12px; color: #7a6a5f; margin-top: 4px;">QTY: ${itemQty}</div>
          </td>
          <td style="padding: 14px 0; white-space: nowrap; text-align: right; font-weight: 700; color: ${brandColor}; font-size: 13px;">₹${parseFloat(itemPrice).toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');
};

/**
 * Builds complete order confirmation email HTML
 */
const buildOrderConfirmationHTML = (orderData) => {
  const {
    customerName,
    customerEmail,
    orderId,
    orderItems,
    shippingAddress,
    paymentStatus,
    shippingCost,
    totalAmount,
    websiteUrl,
    orderDate
  } = orderData;

  const orderItemsHTML = formatOrderItemsHTML(orderItems);
  const formattedShipping = parseFloat(shippingCost || 0).toFixed(2);
  const formattedTotal = parseFloat(totalAmount || 0).toFixed(2);
  const paymentStatusColor = paymentStatus === 'Paid' || paymentStatus === 'successful' ? '#bf360c' : '#d9534f';
  const statusDisplay = paymentStatus === 'Paid' || paymentStatus === 'successful' ? '✅ Paid' : '⏳ Pending';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size: 14px; color: #3e2723; padding: 0; background-color: #f8f6f4; margin: 0;">
  
  <div style="max-width: 640px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e0d6cd; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <div style="padding: 20px 24px; border-bottom: 2px solid #e0d6cd; background: linear-gradient(135deg, #3e2723 0%, #5d4037 100%);">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Order Confirmed!</h1>
      <p style="margin: 8px 0 0 0; color: #e0d6cd; font-size: 13px;">Thank you for your purchase</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">
      
      <!-- Order Summary -->
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f8f6f4; border-radius: 6px; border-left: 4px solid #bf360c;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div style="font-size: 11px; color: #7a6a5f; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Order ID</div>
            <div style="font-size: 16px; color: #3e2723; font-weight: 700;">${orderId}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #7a6a5f; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Payment Status</div>
            <div style="font-size: 14px; color: ${paymentStatusColor}; font-weight: 700;">${statusDisplay}</div>
          </div>
        </div>
        ${orderDate ? `<div style="font-size: 11px; color: #7a6a5f; margin-top: 12px;">Order Date: ${orderDate}</div>` : ''}
      </div>

      <!-- Customer Information -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #3e2723; font-size: 14px; font-weight: 700; text-transform: uppercase;">Customer Information</h3>
        <div style="background-color: #faf7f5; padding: 12px; border-radius: 6px;">
          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; color: #7a6a5f; font-weight: 600;">Name</div>
            <div style="color: #3e2723; font-size: 13px;">${customerName || 'N/A'}</div>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; color: #7a6a5f; font-weight: 600;">Email</div>
            <div style="color: #3e2723; font-size: 13px;"><a href="mailto:${customerEmail}" style="color: #bf360c; text-decoration: none;">${customerEmail || 'N/A'}</a></div>
          </div>
        </div>
      </div>

      <!-- Delivery Address -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #3e2723; font-size: 14px; font-weight: 700; text-transform: uppercase;">Delivery Address</h3>
        <div style="background-color: #faf7f5; padding: 12px; border-radius: 6px; border-left: 3px solid #bf360c; white-space: pre-wrap; line-height: 1.6; color: #6b5a4a; font-size: 13px;">
          ${shippingAddress || 'Address not provided'}
        </div>
      </div>

      <!-- Order Items -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #3e2723; font-size: 14px; font-weight: 700; text-transform: uppercase;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0d6cd; border-radius: 6px; overflow: hidden;">
          <tbody>
            ${orderItemsHTML}
          </tbody>
        </table>
      </div>

      <!-- Order Totals -->
      <div style="margin-bottom: 24px; border-top: 2px solid #e0d6cd; padding-top: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="color: #7a6a5f; font-size: 13px;">Shipping Cost:</span>
          <span style="color: #3e2723; font-weight: 600; font-size: 13px;">₹${formattedShipping}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 2px solid #e0d6cd;">
          <span style="color: #3e2723; font-weight: 700; font-size: 16px;">Total Amount:</span>
          <span style="color: #bf360c; font-weight: 700; font-size: 18px;">₹${formattedTotal}</span>
        </div>
      </div>

      <!-- Next Steps -->
      <div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; color: #2e7d32; font-size: 13px; font-weight: 700;">What happens next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #388e3c; font-size: 12px;">
          <li style="margin-bottom: 6px;">We'll process your order right away</li>
          <li style="margin-bottom: 6px;">You'll receive tracking information via email</li>
          <li style="margin-bottom: 0;">Delivery typically takes 3-5 business days</li>
        </ul>
      </div>

      <!-- Support Message -->
      <div style="background-color: #fff3e0; border: 1px solid #ffe0b2; border-radius: 6px; padding: 16px;">
        <p style="margin: 0; color: #e65100; font-size: 12px; line-height: 1.6;">
          <strong>Need Help?</strong><br>
          If you have any questions about your order, please reply to this email or contact our support team at boldandbrew@gmail.com. We're here to help!
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; border-top: 1px solid #e0d6cd; background-color: #f8f6f4; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #8b7a6d; font-size: 11px;">
        <strong>Bold & Brew Coffee</strong><br>
        Premium Instant Coffee | Quality Assured
      </p>
      ${websiteUrl ? `<p style="margin: 8px 0 0 0;"><a href="${websiteUrl}" style="color: #bf360c; text-decoration: none; font-size: 11px; font-weight: 600;">Visit Our Website →</a></p>` : ''}
      <p style="margin: 12px 0 0 0; color: #aaa; font-size: 10px;">
        This is an automated email. Please do not reply with attachment requests.
      </p>
    </div>

  </div>

</body>
</html>
  `;
};

/**
 * Main function to send order confirmation email
 */
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    // Validate required data
    if (!orderData.customerEmail) {
      console.error('❌ Customer email is required');
      return { success: false, error: 'No customer email provided' };
    }

    if (!orderData.orderId) {
      console.error('❌ Order ID is required');
      return { success: false, error: 'No order ID provided' };
    }

    // Ensure EmailJS is initialized
    if (!window.emailjs) {
      initializeEmailJS();
    }

    console.log('📧 Preparing order confirmation email for:', orderData.customerEmail);

    // Build the HTML email
    const htmlContent = buildOrderConfirmationHTML(orderData);

    // Prepare EmailJS parameters
    const templateParams = {
      to_email: orderData.customerEmail,
      to_name: orderData.customerName || 'Customer',
      order_id: orderData.orderId,
      customer_name: orderData.customerName || 'Customer',
      customer_email: orderData.customerEmail,
      customer_address: orderData.shippingAddress || 'N/A',
      payment_status: orderData.paymentStatus || 'Pending',
      order_items_html: htmlContent.match(/<table[\s\S]*?<\/table>/)?.[0] || '',
      shipping_amount: `₹${parseFloat(orderData.shippingCost || 0).toFixed(2)}`,
      total_amount: `₹${parseFloat(orderData.totalAmount || 0).toFixed(2)}`,
      website_url: orderData.websiteUrl || 'https://boldandbrew.com',
      html_content: htmlContent
    };

    console.log('📧 EmailJS Config:', {
      SERVICE_ID: EMAIL_CONFIG.SERVICE_ID.substring(0, 10) + '...',
      TEMPLATE_ID: EMAIL_CONFIG.TEMPLATE_ID.substring(0, 10) + '...',
      recipient: orderData.customerEmail
    });

    console.log('📧 Sending email via EmailJS...');

    // Send email
    const response = await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200 || response.text === 'OK') {
      console.log('✅ Order confirmation email sent successfully to:', orderData.customerEmail);
      console.log('📧 EmailJS Response:', response);
      return { success: true, message: 'Email sent successfully' };
    } else {
      console.warn('⚠️ Unexpected EmailJS response:', response);
      return { success: false, error: 'Unexpected response from email service' };
    }

  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    console.error('Error details:', {
      message: error?.message,
      text: error?.text,
      status: error?.status,
      toString: error?.toString()
    });
    return { 
      success: false, 
      error: error?.text || error?.message || 'Failed to send email' 
    };
  }
};

export default {
  initializeEmailJS,
  sendOrderConfirmationEmail,
  EMAIL_CONFIG
};
