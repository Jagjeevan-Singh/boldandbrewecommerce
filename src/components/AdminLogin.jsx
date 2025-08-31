import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import "./AdminLogin.css";

import logo from "../assets/logo.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Check if user is admin in users collection
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && (docSnap.data().isAdmin === true || docSnap.data().role === "owner")) {
        navigate("/admin");
      } else {
        setError("You are not an admin.");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-bg">
      <div className="admin-login-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
          <img src={logo} alt="Bold & Brew Logo" className="admin-login-logo" style={{ borderRadius: "50%", background: "#fff" }} />
        </div>
        <div className="admin-login-title">Admin Login</div>
        <form className="admin-login-form" onSubmit={handleLogin}>
          <input
            className="admin-login-input"
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="admin-login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="admin-login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <div className="admin-login-error">{error}</div>}
      </div>
    </div>
  );
}