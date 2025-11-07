import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const total = location.state?.total || 0; // ✅ gets total from Cart
  const cartItems = location.state?.cartItems || [];

  const [form, setForm] = useState({
    name: "",
    address: "",
    deliveryOption: "standard",
    deliveryDate: "",
    deliveryInstructions: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProceed = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.address.trim()) {
      alert("Please provide Name and Address.");
      return;
    }

    if (total <= 0) {
      alert("Invalid order amount. Please check your cart.");
      navigate("/cart");
      return;
    }

    // ✅ Pass total + checkout form data to PaymentPage
   navigate("/payment", {
  state: {
    checkoutData: { ...form, cartItems },
    total: total,
  },
});

  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <h2>Checkout</h2>
      <form onSubmit={handleProceed}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Address
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={4}
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Delivery Option
            <select
              name="deliveryOption"
              value={form.deliveryOption}
              onChange={handleChange}
              style={{ display: "block", width: "100%", padding: 8 }}
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Delivery Date (optional)
            <input
              type="date"
              name="deliveryDate"
              value={form.deliveryDate}
              onChange={handleChange}
              style={{ display: "block", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Delivery Instructions (optional)
            <input
              name="deliveryInstructions"
              value={form.deliveryInstructions}
              onChange={handleChange}
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 20, fontWeight: "bold" }}>
          Total Amount: ₹{total.toFixed(2)}
        </div>

        <button type="submit" style={{ padding: "10px 16px" }}>
          Proceed to Payment
        </button>
      </form>
    </div>
  );
}
