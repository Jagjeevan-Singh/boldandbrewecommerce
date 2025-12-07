# Shiprocket Integration Guide

## Overview
This project now includes a secure Firebase Cloud Functions integration with Shiprocket for order fulfillment and shipping.

## Architecture

### Token Management (Best Practice)
- **Bearer Token Caching**: The Shiprocket authentication token is stored in Firestore (`apiTokens/shiprocket` collection)
- **Auto-Refresh**: Token is automatically refreshed when it expires or has less than 230 hours remaining
- **Token Validity**: 240 hours (10 days)
- **Security**: Credentials are stored securely via Firebase Functions config (not in code)

### Files Modified/Created

#### 1. `functions/package.json`
- Added `axios` dependency for HTTP requests to Shiprocket API

#### 2. `functions/index.js`
- Added `getShiprocketToken()` helper function for token management
- Added `createShiprocketOrder()` callable Cloud Function

## Deployed Cloud Functions

### `createShiprocketOrder`
- **Type**: Callable function (requires Firebase Authentication)
- **Purpose**: Creates orders in Shiprocket
- **Authentication**: Automatically gets valid Bearer token from cache or generates new one
- **URL**: Called via Firebase SDK (not direct HTTP)

## Configuration

### Shiprocket Credentials (Already Set)
```bash
firebase functions:config:set shiprocket.email="jagsrocks13@gmail.com"
firebase functions:config:set shiprocket.password="x7DuJ6&m6QxyIjkh"
```

**Status**: ✅ Configured and deployed

## Usage from Frontend

### Example: Call Shiprocket Order Creation

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createShiprocketOrder = httpsCallable(functions, 'createShiprocketOrder');

// Order data structure (example)
const orderData = {
  order_id: "unique-order-id",
  order_date: "2025-11-20 12:00",
  pickup_location: "Primary",
  channel_id: "",
  comment: "Order from Bold & Brew",
  billing_customer_name: "John Doe",
  billing_last_name: "",
  billing_address: "123 Main St",
  billing_address_2: "",
  billing_city: "Mumbai",
  billing_pincode: "400001",
  billing_state: "Maharashtra",
  billing_country: "India",
  billing_email: "john@example.com",
  billing_phone: "9876543210",
  shipping_is_billing: true,
  shipping_customer_name: "",
  shipping_last_name: "",
  shipping_address: "",
  shipping_address_2: "",
  shipping_city: "",
  shipping_pincode: "",
  shipping_country: "",
  shipping_state: "",
  shipping_email: "",
  shipping_phone: "",
  order_items: [
    {
      name: "Espresso Coffee",
      sku: "ESP001",
      units: 2,
      selling_price: "299",
      discount: "",
      tax: "",
      hsn: 446
    }
  ],
  payment_method: "Prepaid",
  shipping_charges: 0,
  giftwrap_charges: 0,
  transaction_charges: 0,
  total_discount: 0,
  sub_total: 598,
  length: 10,
  breadth: 10,
  height: 10,
  weight: 0.5
};

// Call the function
try {
  const result = await createShiprocketOrder({ orderData });
  console.log('Shiprocket Order Created:', result.data);
  // result.data will contain order_id and shipment_id from Shiprocket
} catch (error) {
  console.error('Error creating Shiprocket order:', error);
}
```

## Token Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend calls createShiprocketOrder        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloud Function: createShiprocketOrder              │
│  1. Verify user authentication                                  │
│  2. Call getShiprocketToken()                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Helper Function: getShiprocketToken                │
│  1. Check Firestore (apiTokens/shiprocket)                      │
│  2. If valid (>230 hours remaining) → Return cached token       │
│  3. If expired/missing:                                         │
│     a. Call Shiprocket Login API                                │
│     b. Get new token                                            │
│     c. Update Firestore with token + expiration                 │
│     d. Return new token                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Call Shiprocket Order Creation API                 │
│  POST https://apiv2.shiprocket.in/v1/external/orders/create/   │
│  Authorization: Bearer <token>                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Return order_id & shipment_id to Frontend          │
└─────────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Secure**: Credentials never exposed to frontend
2. **Efficient**: Token cached in Firestore, not regenerated on every request
3. **Reliable**: Automatic token refresh prevents expiration errors
4. **Scalable**: Works across multiple function invocations
5. **Maintainable**: Easy to update credentials via Firebase CLI

## Firestore Structure

```
apiTokens/
  └── shiprocket/
      ├── token: "Bearer eyJ..."
      ├── expiresAt: Timestamp (240 hours from creation)
      └── lastUpdated: Timestamp
```

## Monitoring

Check Firebase Console → Functions → Logs to see:
- Token refresh events: "Fetching new Shiprocket token..."
- Token usage: "Using cached Shiprocket token (valid for X more hours)"
- Order creation success: "Shiprocket order created successfully"

## Deployment Status

✅ **Deployed Functions**:
- `createShiprocketOrder` (new)
- `createRazorpayOrder` (updated)
- `verifyRazorpayPayment` (updated)
- `createRazorpayPreference` (updated)

## Next Steps

1. Integrate `createShiprocketOrder` call in your checkout flow
2. Test with sample order data
3. Monitor logs in Firebase Console
4. Set up error handling for failed shipments

## Support

- Shiprocket API Docs: https://apidocs.shiprocket.in/
- Firebase Functions Docs: https://firebase.google.com/docs/functions
