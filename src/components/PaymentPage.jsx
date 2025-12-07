import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PayButton from "./PayButton";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const checkoutData = location.state?.checkoutData;
  const totalAmount = Number(location.state?.total || 0);

  useEffect(() => {
    if (!checkoutData || totalAmount <= 0) {
      alert("Invalid order amount. Redirecting to home.");
      navigate("/", { replace: true });
    }
  }, [checkoutData, totalAmount, navigate]);

  const handleSuccess = (razorpayResponse) => {
    console.log("✅ Payment successful, redirecting immediately:", razorpayResponse);
    // Navigate immediately with replace to prevent going back to payment page
    navigate("/order-confirmed", {
      replace: true,
      state: {
        payment: { ...razorpayResponse, amount: totalAmount * 100 },
        checkout: checkoutData,
      },
    });
  };

  if (!checkoutData || totalAmount <= 0) return null;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <h2>Payment</h2>

      <div style={{ marginBottom: 12 }}>
        <strong>Name:</strong> {checkoutData.name}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Address:</strong>
        <div style={{ whiteSpace: "pre-wrap" }}>{checkoutData.address}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Delivery Option:</strong> {checkoutData.deliveryOption}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Delivery Date:</strong> {checkoutData.deliveryDate || "Not selected"}
      </div>

      <div style={{ marginBottom: 20 }}>
        <strong>Instructions:</strong> {checkoutData.deliveryInstructions || "None"}
      </div>

      <PayButton
        amount={totalAmount}
        checkoutData={checkoutData}
        onSuccess={handleSuccess}
        onFailure={(err) => {
          console.error("❌ Payment failed:", err);
          alert("Payment failed. Please try again.");
        }}
      />
    </div>
  );
}
