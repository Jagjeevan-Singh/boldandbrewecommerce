# EmailJS Configuration Guide for Order Confirmation Emails

## 🚨 CRITICAL: EmailJS Template Recipient Configuration

**If you're getting "recipients address is empty" error (422), you MUST configure the recipient in your EmailJS template settings:**

### Step-by-Step Fix:

1. **Go to EmailJS Dashboard** → Select your template (`template_zjf5zsm`)

2. **Click on "Settings" tab** in the template editor

3. **In the "To Email" field**, enter one of these variables:
   - `{{to_email}}` (recommended)
   - OR `{{reply_to}}`
   - OR `{{customer_email}}`

4. **IMPORTANT**: The "To Email" field in template settings must use `{{variable_name}}` syntax, NOT just `to_email`

5. **Save the template**

### Example Template Settings:
```
Template Settings:
├── To Email: {{to_email}}
├── From Name: Bold & Brew
├── Reply To: {{reply_to}}
└── Subject: Order Confirmation - Order #{{order_id}}
```

### Common Mistakes:
❌ Leaving "To Email" empty
❌ Using `to_email` without double braces `{{ }}`
❌ Not saving template after changes

✅ Correct: `{{to_email}}` or `{{reply_to}}`

---

## Overview
This application uses EmailJS to send order confirmation emails to customers after successful payment. The email system is configured in `src/components/OrderConfirmed.jsx`.

## Environment Variables
Make sure these are set in your `.env` file:

```env
VITE_EMAILJS_SERVICE_ID=service_ugu0eah
VITE_EMAILJS_TEMPLATE_ID=template_zjf5zsm
VITE_EMAILJS_PUBLIC_KEY=Y3m1ic5-mSSYUkTKX
```

## EmailJS Template Setup

### Template Variables Available
When creating/editing your EmailJS template, you have access to these variables:

#### Customer Information
- `{{to_email}}` - Customer's email address
- `{{to_name}}` - Customer's full name
- `{{customer_name}}` - Customer's full name (same as to_name)
- `{{customer_email}}` - Customer's email (same as to_email)
- `{{customer_address}}` - Customer's complete shipping address

#### Order Information
- `{{order_id}}` - Unique order/payment ID
- `{{order_items}}` - Plain text list of all items ordered (formatted as numbered list)
- `{{orders_json}}` - JSON array of order items with details
- `{{payment_status}}` - Payment status (e.g., "Paid", "Pending")

#### Pricing Information
- `{{shipping_amount}}` - Shipping cost (number)
- `{{total_amount}}` - Total order amount including shipping (number)

#### Additional Information
- `{{website_url}}` - Your website URL
- `{{html_content}}` - Pre-formatted HTML email content (use this for rich emails)

## Recommended EmailJS Template Configuration

### Option 1: Use Pre-formatted HTML (Recommended)
In your EmailJS template, simply use:

```html
{{{html_content}}}
```

This will use the beautifully formatted HTML email template that includes:
- Company logo and branding
- Customer information section
- Order items with images
- Pricing breakdown
- Shipping and total amounts
- Professional styling matching your brand colors

### Option 2: Custom Template
If you want to create your own template, use these variables:

**Subject Line:**
```
Order Confirmation - Order #{{order_id}}
```

**Email Body:**
```html
<p>Dear {{customer_name}},</p>

<p>Thank you for your order! Your payment has been successfully processed.</p>

<h3>Order Details</h3>
<ul>
  <li><strong>Order ID:</strong> {{order_id}}</li>
  <li><strong>Payment Status:</strong> {{payment_status}}</li>
  <li><strong>Total Amount:</strong> ₹{{total_amount}}</li>
</ul>

<h3>Items Ordered</h3>
<pre>{{order_items}}</pre>

<h3>Shipping Information</h3>
<p>{{customer_address}}</p>

<p>We'll send you tracking information when your order ships.</p>

<p>If you have any questions, please reply to this email.</p>

<p>Thank you for shopping with us!</p>
<p>Bold & Brew Team</p>
```

## Email Data Structure

### Order Items Format
Each item in the `orders_json` array contains:
```json
{
  "name": "Product Name",
  "units": 2,
  "price": 299.00,
  "image_url": "https://..."
}
```

### Example order_items Text Format
```
1. Premium Coffee - Qty: 2 - Price: ₹299.00
2. Espresso Blend - Qty: 1 - Price: ₹349.00
```

## Testing Email Delivery

### Check Console Logs
When an email is sent, you'll see these logs in the browser console:

**Success:**
```
📧 Preparing to send order confirmation email to: customer@email.com
📧 Email details: { recipient, customerName, orderId, itemCount, total }
✅ Order confirmation email sent successfully to: customer@email.com
📧 EmailJS Response: { status: 200, ... }
```

**Errors:**
```
⚠️ No recipient email found for order confirmation
❌ Failed to send order confirmation email: [Error details]
```

## Troubleshooting

### Email Not Sending
1. **Check Environment Variables**: Verify `.env` file has correct EmailJS credentials
2. **Check Console**: Look for error messages in browser console
3. **Verify EmailJS Account**: Ensure service and template IDs are correct
4. **Check Email Quota**: EmailJS free tier has monthly limits
5. **Verify Template**: Make sure template exists and is active in EmailJS dashboard

### Email Received but Incomplete
1. **Check Template Variables**: Ensure all variables used in template are available
2. **Review HTML Content**: If using `{{{html_content}}}`, it's pre-formatted
3. **Check Order Data**: Verify orderData has all required fields

### Common Issues

**Issue:** Email shows "undefined" for some fields
**Solution:** Make sure the EmailJS template uses the correct variable names from the list above

**Issue:** Images not showing in email
**Solution:** Verify product images are hosted on accessible URLs (not local paths)

**Issue:** HTML formatting broken
**Solution:** Use `{{{html_content}}}` (triple braces) in EmailJS to render HTML properly

## Email Styling

The pre-formatted HTML email includes:
- Brand colors: Coffee brown (#3e2723), Accent (#bf360c)
- Responsive design
- Product images with proper sizing
- Professional invoice-style layout
- Mobile-friendly formatting

## Security Notes

- Public key is safe to expose in client-side code
- Service ID and Template ID are not sensitive
- Never expose your EmailJS private/secret key
- Email sending happens after payment verification

## Support

If emails are not being delivered:
1. Check EmailJS dashboard for delivery logs
2. Verify email isn't in spam folder
3. Test with different email providers
4. Check EmailJS service status
5. Review monthly quota usage

## Current Configuration Status

✅ EmailJS package installed (`@emailjs/browser@^4.4.1`)
✅ Environment variables configured
✅ Comprehensive order data passed to template
✅ Enhanced error logging and debugging
✅ Professional HTML email template included
✅ Automatic email sending after order confirmation
