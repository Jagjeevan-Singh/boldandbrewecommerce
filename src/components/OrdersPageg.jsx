import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

export default function OrdersPageg() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const db = getFirestore();
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(q);
        if (!mounted) return;
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(list);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const formatAmount = (raw) => {
    if (raw == null) return "N/A";
    if (typeof raw === "number") {
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

  if (loading) return <div style={{ padding: 16 }}>Loading orders...</div>;
  if (error)
    return (
      <div style={{ padding: 16, color: "red" }}>
        Error: {error}
      </div>
    );

  if (!orders.length) {
    return <div style={{ padding: 16 }}>No orders found.</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Orders</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {orders.map((o) => (
          <div
            key={o.id}
            onClick={() => navigate(`/orders/${o.id}`)} // ✅ click to view details
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: "#fff",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div>
                <strong>{o.name || "Unknown"}</strong>
              </div>
              <div>{formatAmount(o.amount)}</div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <strong>Payment ID:</strong> {o.paymentId || o.razorpay_payment_id || "N/A"}
            </div>

            <div style={{ marginBottom: 6 }}>
              <strong>Status:</strong> {o.status || o.paymentStatus || "Success"}
            </div>

            <div style={{ marginBottom: 6 }}>
              <strong>Delivery Option:</strong> {o.deliveryOption || "N/A"}
            </div>

            <div style={{ marginBottom: 6 }}>
              <strong>Created:</strong> {formatDate(o.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
