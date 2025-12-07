import React, { useState } from 'react';
import './CustomerReviewDrawer.css';
import { FaStar, FaPaperPlane } from 'react-icons/fa';

export default function CustomerReviewDrawer({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !rating || !comment) return;
    setSubmitting(true);
    await onSubmit({ name, email, rating, comment });
    setSubmitting(false);
    setName('');
    setEmail('');
    setRating(0);
    setComment('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="review-drawer-static">
      <div className="review-drawer">
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="drawer-header">
            <span>Write a Review</span>
            <button type="button" className="drawer-close" onClick={onClose}>&times;</button>
          </div>
          <input
            className="drawer-input"
            type="text"
            placeholder="Your Name*"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="drawer-input"
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className="drawer-rating">
            {[1,2,3,4,5].map(star => (
              <FaStar
                key={star}
                className={star <= rating ? 'active' : ''}
                onClick={() => setRating(star)}
                size={22}
              />
            ))}
          </div>
          <textarea
            className="drawer-textarea"
            placeholder="Your review*"
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
            rows={3}
          />
          <button className="drawer-submit" type="submit" disabled={submitting || !name || !rating || !comment}>
            <FaPaperPlane /> Send Review
          </button>
        </form>
      </div>
    </div>
  );
}
