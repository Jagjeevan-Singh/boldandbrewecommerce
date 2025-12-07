import React from "react";
import { useLocation } from "react-router-dom";
import Checkout from "./Checkout";

export default function CheckoutPage({ cartItems: propCartItems = [], total: propTotal }) {
  // Prefer props (passed from App) but fall back to location.state
  const location = useLocation();
  const total = typeof propTotal !== "undefined" ? propTotal : location.state?.total || 0;
  const cartItems = (propCartItems && propCartItems.length > 0) ? propCartItems : (location.state?.cartItems || []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      {/* Render Checkout component which handles shipping, order creation and payment */}
      <Checkout cartItems={cartItems} total={total} />
    </div>
  );
}
