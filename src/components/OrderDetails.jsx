import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    let mounted = true;
    const db = getFirestore();

    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, "orders", id);
        const snapshot = await getDoc(orderRef);
        if (!mounted) return;

        if (!snapshot.exists()) {
          setError("Order not found");
          setOrder(null);
        } else {
          const data = snapshot.data();
          setOrder({ id: snapshot.id, ...data });
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load order");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [id]);

  const formatAmount = (raw) => {
    if (raw == null) return "N/A";
    if (typeof raw === "number") {
      // If large, assume in paise
      if (raw > 1000) return `₹${(raw / 100).toFixed(2)}`;
      return `₹${raw.toFixed ? raw.toFixed(2) : raw}`;
    }
    return `₹${raw}`;
  };

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Loading order...</div>;
  if (error)
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: "red", marginBottom: 12 }}>Error: {error}</div>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 12px" }}>
          Back
        </button>
      </div>
    );

  if (!order)
    return <div style={{ padding: 16 }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h2>Order Details</h2>

      <div style={{ marginBottom: 8 }}>
        <strong>Order ID:</strong> {order.id}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Payment ID:</strong> {order.paymentId || order.razorpay_payment_id || "N/A"}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Amount:</strong> {formatAmount(order.amount)}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Status:</strong> {order.status || order.paymentStatus || "Success"}
      </div>
      <hr />

      <div style={{ marginTop: 12 }}>
        <strong>Name:</strong> {order.name || "N/A"}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Address:</strong>
        <div style={{ whiteSpace: "pre-wrap" }}>{order.address || "N/A"}</div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Delivery Option:</strong> {order.deliveryOption || "N/A"}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Delivery Date:</strong> {order.deliveryDate || "Not selected"}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Instructions:</strong> {order.deliveryInstructions || "None"}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Created At:</strong> {formatDate(order.createdAt)}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 12px" }}>
          Back
        </button>
        <button onClick={() => navigate("/orders-list")} style={{ padding: "8px 12px" }}>
          View All Orders
        </button>
      </div>
    </div>
  );
}

