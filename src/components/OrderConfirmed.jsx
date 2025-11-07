import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function OrderConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();
  const payment = location.state?.payment;
  const checkout = location.state?.checkout;

  const db = getFirestore();

  useEffect(() => {
    if (!payment && !checkout) {
      navigate("/", { replace: true });
      return;
    }

    // ✅ Save order to Firestore on confirmation
    const saveOrder = async () => {
      try {
        await addDoc(collection(db, "orders"), {
          paymentId: payment?.razorpay_payment_id || payment?.id || "N/A",
          orderId: payment?.razorpay_order_id || payment?.order_id || "N/A",
          amount: payment?.amount ? payment.amount / 100 : 0, // paise to rupees
          status: "success",
          name: checkout?.name || "N/A",
          address: checkout?.address || "N/A",
          deliveryOption: checkout?.deliveryOption || "standard",
          deliveryDate: checkout?.deliveryDate || null,
          deliveryInstructions: checkout?.deliveryInstructions || "",
          createdAt: serverTimestamp(),
        });
        console.log("✅ Order saved to Firestore!");
      } catch (err) {
        console.error("❌ Failed to save order:", err);
      }
    };

    saveOrder();
  }, [payment, checkout, db, navigate]);

  if (!payment && !checkout) return null;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <h2>Order Confirmed!</h2>

      <div style={{ marginBottom: 12 }}>
        <strong>Payment ID:</strong> {payment?.razorpay_payment_id || payment?.id || "N/A"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Order ID:</strong> {payment?.razorpay_order_id || payment?.order_id || "N/A"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Amount:</strong> ₹{(payment?.amount / 100).toFixed(2)}
      </div>

      <hr />

      <div style={{ marginTop: 12 }}>
        <strong>Name:</strong> {checkout?.name || "N/A"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Address:</strong>
        <div style={{ whiteSpace: "pre-wrap" }}>{checkout?.address || "N/A"}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Delivery Option:</strong> {checkout?.deliveryOption || "N/A"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Delivery Date:</strong> {checkout?.deliveryDate || "Not selected"}
      </div>

      <div style={{ marginBottom: 20 }}>
        <strong>Instructions:</strong> {checkout?.deliveryInstructions || "None"}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => navigate("/")} style={{ padding: "8px 12px" }}>
          Back to Home
        </button>
        <button onClick={() => navigate("/orders-list")} style={{ padding: "8px 12px" }}>
          View All Orders
        </button>
      </div>
    </div>
  );
}
