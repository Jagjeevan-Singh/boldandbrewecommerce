// src/components/GoogleLogin.jsx
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const GoogleLogin = () => {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      alert(`Welcome ${result.user.displayName}`);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>Sign in with Google</button>
  );
};

export default GoogleLogin;