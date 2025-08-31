import React from 'react';
import { FaStar } from 'react-icons/fa';
import './CustomerReviewList.css';

export default function CustomerReviewList({ reviews }) {
  if (!reviews?.length) return null;
  return (
    <div className="customer-review-list">
      <h4>All Reviews</h4>
      {reviews.map((r, i) => (
        <div className="review-item" key={r.id || i}>
          <div className="review-header">
            <span className="review-name">{r.userName || 'Anonymous'}</span>
            <span className="review-rating">
              {[1,2,3,4,5].map(star => (
                <FaStar key={star} color={star <= (r.rating || 0) ? '#FFD700' : '#ccc'} size={15} />
              ))}
            </span>
          </div>
          <div className="review-comment">{r.review}</div>
        </div>
      ))}
    </div>
  );
}
