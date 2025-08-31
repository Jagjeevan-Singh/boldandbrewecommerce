
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Header from './Header';
import './Login.css';


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
  await sendPasswordResetEmail(auth, email);
  setMessage("A password reset email has been sent to " + email);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Header />
      <div className="login-bg">
        <div className="login-main-box">
          <div className="login-form-col" style={{margin: '0 auto', width: '100%'}}>
            <h2 className="login-title">Reset Password</h2>
            <p>Enter your email address to receive a password reset link.</p>
            <form onSubmit={handleSubmit} autoComplete="on">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
                required
              />
              <button className="btn login-btn" type="submit">Send Reset Link</button>
            </form>
            {message && <div className="login-success">{message}</div>}
            {error && <div className="login-error">{error}</div>}
            <button className="register-back-btn" style={{marginTop:16}} onClick={() => navigate('/login')}>Back to Login</button>
          </div>
        </div>
      </div>
    </>
  );
}
