import React from 'react';
import { FaStar } from 'react-icons/fa';
import './ProductReviewsBar.css';

export default function ProductReviewsBar({ ratingsCount, totalReviews }) {
  // ratingsCount: { 5: 196, 4: 25, 3: 6, 2: 7, 1: 0 }
  const max = Math.max(...Object.values(ratingsCount), 1);
  return (
    <div className="reviews-bar-breakdown">
      {[5,4,3,2,1].map(star => (
        <div className="reviews-bar-row" key={star}>
          <span className="reviews-bar-label">{star} <FaStar color="#FFD700" style={{marginBottom:-2}} /></span>
          <div className="reviews-bar-track">
            <div className="reviews-bar-fill" style={{width: `${(ratingsCount[star]||0)/max*100}%`}} />
          </div>
          <span className="reviews-bar-count">{ratingsCount[star]||0}</span>
        </div>
      ))}
    </div>
  );
}
