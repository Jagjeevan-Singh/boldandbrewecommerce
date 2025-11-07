console.log('Login component loaded');
import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import './Login.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
      <div className="login-main-box">
        <div className="login-form-col">
          {user ? (
            <>
              <h2>Already Logged In</h2>
              <p>You are already logged in as <b>{user.email}</b>.</p>
              <button className="btn login-btn" onClick={async () => { await signOut(auth); setUser(null); }}>Sign Out</button>
            </>
          ) : (
            <>
              <h2>Login</h2>
              <p>If you have an account with us, please log in.</p>
              <form onSubmit={handleEmailLogin} autoComplete="on">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  autoComplete="current-password"
                  required
                />
                <button className="btn login-btn" type="submit">Sign In</button>
              </form>
              <button className="btn google-btn" onClick={handleGoogleLogin} type="button">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="google-logo" />
                Sign in with Google
              </button>
              <div>
                <button
                  type="button"
                  className="forgot-link"
                  style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem', marginTop: 8, display: 'inline-block', padding: 0 }}
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot your password?
                </button>
              </div>
              {error && <div className="login-error">{error}</div>}
            </>
          )}
        </div>
        <div className="login-register-col">
          <h2>New Customer?</h2>
          <p>Registering for this site allows you to access your order status and history. We’ll get a new account set up for you in no time.</p>
          <button className="btn register-btn" onClick={() => navigate('/register')}>Create an Account</button>
        </div>
      </div>
  );
}

export default Login;
