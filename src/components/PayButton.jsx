import React, { useState } from "react";

export default function PayButton({
  amount = 0, // ✅ now default is 0, not 500
  checkoutData = {},
  onSuccess = () => {},
  onFailure = () => {}
}) {
  const [loading, setLoading] = useState(false);

  // ✅ Load Razorpay script safely
  const loadScript = (src) =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      if (document.querySelector(`script[src="${src}"]`)) {
        const check = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(check);
            resolve(true);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(check);
          resolve(!!window.Razorpay);
        }, 5000);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      alert("Invalid amount. Please check your order total.");
      return;
    }

    setLoading(true);
    try {
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok) {
        onFailure({ error: "SDK_LOAD_FAILED" });
        alert("Failed to load Razorpay SDK. Please check your connection.");
        setLoading(false);
        return;
      }

      // ✅ Razorpay expects amount in paise
      const finalAmount = Math.round(amount * 100);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RD3VXSAsbG6VGZ",
        amount: finalAmount,
        currency: "INR",
        name: "Bold & Brew",
        description: "Order Payment",
        handler: function (response) {
          console.log("✅ Razorpay payment successful, navigating immediately...", response);
          setLoading(false);
          // Immediately call onSuccess to navigate without any delay
          onSuccess(response);
        },
        prefill: {
          name: checkoutData?.name || "",
          email: checkoutData?.email || "",
          contact: checkoutData?.phone || ""
        },
        notes: {
          address: checkoutData?.address || ""
        },
        theme: { color: "#8b5e3c" }
      };

      const rzp = new window.Razorpay(options);

      // ✅ Handle payment failure event
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        onFailure(response.error);
        alert("Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      console.error("Unexpected error:", err);
      onFailure({ error: "UNKNOWN", detail: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      style={{
        padding: "10px 16px",
        backgroundColor: "#8b5e3c",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: loading ? "not-allowed" : "pointer"
      }}
    >
      {loading ? "Processing..." : `Pay ₹${amount.toFixed(2)}`}
    </button>
  );
}
