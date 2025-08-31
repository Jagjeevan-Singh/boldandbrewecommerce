import React, { useMemo } from 'react';
import { FaStar } from 'react-icons/fa';
import ProductReviewsBar from './ProductReviewsBar';

export default function CustomerReviewSummary({ reviews, onWriteReview }) {
  // reviews: [{rating: 5, ...}, ...]
  const ratingsCount = useMemo(() => {
    const count = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { count[r.rating] = (count[r.rating] || 0) + 1; });
    return count;
  }, [reviews]);
  const total = reviews.length;
  const avg = total ? (reviews.reduce((a, b) => a + (b.rating || 0), 0) / total) : 0;
  const avgDisplay = avg.toFixed(1);

  return (
    <div className="customer-review-summary">
      <div className="review-summary-left">
        <div className="review-summary-score">
          <span className="review-summary-avg">{avgDisplay}</span>
          <span className="review-summary-outof">/5</span>
        </div>
        <div className="review-summary-stars">
          {[1,2,3,4,5].map(i => (
            <FaStar key={i} color={i <= Math.floor(avg) ? '#FFD700' : (i - avg <= 0.5 && i - avg > 0 ? '#FFD70088' : '#ccc')} />
          ))}
        </div>
        <div className="review-summary-count">From {total} reviews</div>
        <button className="review-summary-write-btn" onClick={onWriteReview}>Write A Review</button>
      </div>
      <div className="review-summary-right">
        <ProductReviewsBar ratingsCount={ratingsCount} totalReviews={total} />
      </div>
    </div>
  );
}
