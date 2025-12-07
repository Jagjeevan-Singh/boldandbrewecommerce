# Deployment Log

## December 8, 2025

### Firebase Functions - Shiprocket Credentials Deployed

**Action:** Set Shiprocket credentials in Firebase Functions runtime config and redeployed all functions.

```bash
firebase functions:config:set shiprocket.email="jagsrocks13@gmail.com" shiprocket.password="i7D&N!po^SX7ln51s&a0ZAH7hc&!ppLJ"
firebase deploy --only functions
```

**Result:** ✅ All 7 functions successfully deployed:
- createRazorpayOrder(us-central1)
- verifyRazorpayPayment(us-central1)
- createRazorpayPreference(us-central1)
- createShiprocketOrder(asia-south1)
- listPickupAddresses(asia-south1)
- getShipmentRates(asia-south1)
- assignAWB(asia-south1)

**Status:** Functions now have live Shiprocket credentials. Orders should authenticate and create bookings correctly.

**Note:** The `functions.config()` API is deprecated (shutting down March 2026). Consider migrating to `.env` files in firebase.json later.
