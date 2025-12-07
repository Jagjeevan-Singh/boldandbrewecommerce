
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

import Header from './Header';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // TODO: Implement registration logic
    alert("Registration logic goes here");
  };

  return (
    <div className="register-bg">
      <Header />
      <div className="register-box">
        <h2 className="register-title">Create Account</h2>
        <form onSubmit={handleRegister} autoComplete="on">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="register-input"
            required
          />
          <button type="submit" className="register-btn">Register</button>
        </form>
        <button className="register-back-btn" onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    </div>
  );
}
