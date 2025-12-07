import React, { useEffect, useState } from 'react';
import { FaMugHot } from 'react-icons/fa';
import './AutoScrollBanner.css';

const messages = [
  'Free Delivery For All Orders',
  'Save Rs.50 Using NEW50 Coupon'
];

const AutoScrollBanner = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auto-scroll-banner">
      <span className="banner-content">
        <FaMugHot className="banner-icon" />
        <span className="banner-message">{messages[index]}</span>
      </span>
    </div>
  );
};

export default AutoScrollBanner;
