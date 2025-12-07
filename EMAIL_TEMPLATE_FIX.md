# Fix EmailJS Template - Images & Logo Not Showing

## Problem
Order confirmation emails are not showing:
- ❌ Product images
- ❌ Bold & Brew logo
- ❌ Product names
- ❌ Prices

## Root Cause
Your EmailJS template is not configured to display the HTML content properly.

## Solution - Update EmailJS Template

### Step 1: Go to EmailJS Dashboard
1. Visit: https://dashboard.emailjs.com
2. Click on **Email Templates**
3. Select template: **template_zjf5zsm**

### Step 2: Configure Template Settings Tab
Click on **Settings** tab and configure:

```
To Email: {{to_email}}
From Name: Bold & Brew
Reply To: {{reply_to}}
Subject: Order Confirmation - Order #{{order_id}}
```

⚠️ **CRITICAL:** Make sure "To Email" has `{{to_email}}` (with double braces)

### Step 3: Configure Template Content Tab
Click on **Content** tab and replace the entire email body with:

```html
{{{html_content}}}
```

⚠️ **CRITICAL:** Use **TRIPLE BRACES** `{{{` not double `{{`
- Triple braces = unescaped HTML (shows images, formatting)
- Double braces = escaped HTML (shows raw HTML code as text)

### Step 4: Save Template
Click **Save** button

### Step 5: Test
Place a test order and check your email. You should now see:
- ✅ Bold & Brew logo at the top
- ✅ Product images (64x64px thumbnails)
- ✅ Product names
- ✅ Quantities
- ✅ Prices in ₹ (INR)
- ✅ Order total
- ✅ Customer information
- ✅ Shipping address

## What the HTML Template Includes

The `html_content` variable contains a fully formatted HTML email with:
- Professional header with your logo
- Customer name and email
- Payment status
- Shipping address
- Product list with images
- Subtotal and shipping costs
- Order total in ₹
- Footer with support information

## Common Mistakes

❌ Using `{{html_content}}` (double braces) - This escapes HTML
✅ Using `{{{html_content}}}` (triple braces) - This renders HTML

❌ Leaving "To Email" empty in Settings
✅ Setting "To Email" to `{{to_email}}`

❌ Not saving the template after changes
✅ Always click Save button

## Cart Badge Issue Fix

If the cart is showing "1" when empty:

1. Open browser console (F12)
2. Type: `localStorage.removeItem('cart')`
3. Press Enter
4. Refresh page

This clears any old cart data from localStorage.
