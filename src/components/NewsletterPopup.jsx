import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import './NewsletterPopup.css';

const NewsletterPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '', 'submitting', 'success', 'error', 'invalid'

  useEffect(() => {
    let timer;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Check the new key so it resets for your testing
      const hasSeen = localStorage.getItem('hasSeenNewsletterFinal');
      
      if (user) {
        // User is logged in, just hide it. Don't permanently set localStorage.
        if (timer) clearTimeout(timer);
        setIsVisible(false);
      } else {
        // User is not logged in, show popup if they haven't seen it yet
        if (!hasSeen) {
          if (!timer) {
            timer = setTimeout(() => {
              setIsVisible(true);
            }, 15000); // 15 seconds
          }
        }
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenNewsletterFinal', 'true');
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    if (!validateEmail(email)) {
      setStatus('invalid');
      return;
    }

    setStatus('submitting');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.toLowerCase(),
        timestamp: serverTimestamp(),
      });
      setStatus('success');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error adding document: ', error);
      setStatus('error');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="newsletter-overlay">
      <div className="newsletter-modal">
        <button className="newsletter-close" onClick={handleClose}>
          &times;
        </button>
        <div className="newsletter-image-container">
          <img 
            src="https://ik.imagekit.io/3xnjrgh8n/banner/Gemini_Generated_Image_lj9ewflj9ewflj9e.png" 
            alt="Join our community" 
            className="newsletter-image"
          />
        </div>
        <div className="newsletter-content">
          <h2 className="newsletter-title">Join Our Community</h2>
          <p className="newsletter-text">
            To get latest updates & best offers, join our community!
          </p>
          
          {status === 'success' ? (
            <div className="newsletter-success-msg">Thank you for joining!</div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'invalid') setStatus('');
                }}
                required
                className="newsletter-input"
                disabled={status === 'submitting'}
              />
              <button 
                type="submit" 
                className="newsletter-submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Submitting...' : 'Join Now'}
              </button>
              {status === 'error' && <div className="newsletter-error-msg">Something went wrong. Please try again.</div>}
              {status === 'invalid' && <div className="newsletter-error-msg">Please enter a valid email address.</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;
