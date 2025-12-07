import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function MyAccount() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  let mounted = true;
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(q);
        if (!mounted) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(list);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, []);

  const parseAmountToPaise = (raw) => {
    if (raw == null) return 0;
    if (typeof raw === "number") {
      if (raw > 1000) return Math.round(raw);
      return Math.round(raw * 100);
    }
    const cleaned = String(raw).replace(/[^\d.-]/g, "");
    const n = parseFloat(cleaned);
    if (isNaN(n)) return 0;
    if (n > 1000) return Math.round(n);
    return Math.round(n * 100);
  };

  const toDate = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    try {
      return new Date(ts);
    } catch {
      return null;
    }
  };

  const totalOrders = orders.length;
  const totalPaise = orders.reduce((sum, o) => sum + parseAmountToPaise(o.amount), 0);
  const totalAmount = `₹${(totalPaise / 100).toFixed(2)}`;

  const mostRecentDate = (() => {
    if (!orders.length) return null;
    let latest = null;
    for (const o of orders) {
      const d = toDate(o.createdAt);
      if (!d) continue;
      if (!latest || d > latest) latest = d;
    }
    return latest;
  })();

  if (loading) return <div style={{ padding: 16 }}>Loading account...</div>;
  if (error) return <div style={{ padding: 16, color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>My Account</h2>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalOrders}</div>
          <div style={{ color: "#666" }}>Total Orders</div>
        </div>

        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{totalAmount}</div>
          <div style={{ color: "#666" }}>Total Spent</div>
        </div>

        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {mostRecentDate ? mostRecentDate.toLocaleString() : "N/A"}
          </div>
          <div style={{ color: "#666" }}>Most Recent Order</div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div style={{ marginBottom: 16 }}>
        <strong>Recent Orders</strong>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: 12, border: "1px dashed #ccc", borderRadius: 6 }}>
          No orders found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {orders.slice(0, 5).map((o) => (
            <div
              key={o.id}
              style={{
                border: "1px solid #eee",
                padding: 12,
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{o.name || "Unknown"}</div>
                <div style={{ color: "#666", fontSize: 13 }}>
                  {toDate(o.createdAt)?.toLocaleString() || "N/A"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>
                  ₹{(parseAmountToPaise(o.amount) / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {o.status || o.paymentStatus || "Success"}
                </div>
                {/* ✅ View Details Button */}
                <button
                  onClick={() => navigate(`/orders/${o.id}`)}
                  style={{
                    marginTop: 6,
                    background: "#7c5a3a",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          onClick={() => navigate("/orders-list")}
          style={{ padding: "8px 12px" }}
        >
          View All Orders
        </button>
        <button onClick={() => navigate("/")} style={{ padding: "8px 12px" }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

