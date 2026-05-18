import React, { useEffect, useState } from 'react';
import { FaMugHot } from 'react-icons/fa';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './AutoScrollBanner.css';

const DEFAULT_MESSAGES = [
  'Free Delivery For All Orders',
  'Save Rs.50 Using NEW50 Coupon'
];

const AutoScrollBanner = () => {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Listen for real-time updates from Firebase
    const bannerRef = doc(db, 'settings', 'banner');
    const unsubscribe = onSnapshot(bannerRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages && docSnap.data().messages.length > 0) {
        setMessages(docSnap.data().messages);
      } else {
        setMessages(DEFAULT_MESSAGES);
      }
      setIndex(0); // Reset index on update to avoid out-of-bounds
    }, (error) => {
      console.error("Error fetching banner messages:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="auto-scroll-banner">
      <span className="banner-content">
        <FaMugHot className="banner-icon" />
        <span className="banner-message">{messages[index] || ''}</span>
      </span>
    </div>
  );
};

export default AutoScrollBanner;
