
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { FaStar } from 'react-icons/fa';
import './ProductReviews.css';

function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) return;
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Fallback sort: newest first, even if createdAt is missing or not indexed yet
      docs.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setReviews(docs);
    });
    return () => unsub();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  if (!newRating) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: 'anonymous', // Replace with real user id if using auth
        userName: 'Anonymous', // Replace with real user name if using auth
        rating: newRating,
        review: newReview,
        createdAt: serverTimestamp(),
      });
      setNewReview('');
      setNewRating(0);
    } catch (err) {
      alert('Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <div className="product-reviews">
      <h4>Customer Reviews</h4>
      <form onSubmit={handleSubmit} className="review-form">
        <div className="rating-input">
          {[1,2,3,4,5].map(star => (
            <FaStar
              key={star}
              color={star <= newRating ? '#FFD700' : '#ccc'}
              style={{ cursor: 'pointer' }}
              onClick={() => setNewRating(star)}
            />
          ))}
        </div>
        <textarea
          value={newReview}
          onChange={e => setNewReview(e.target.value)}
          placeholder="Write your review... (optional)"
          rows={3}
        />
        <button
          type="submit"
          disabled={submitting || !newRating}
          style={{ pointerEvents: (submitting || !newRating) ? 'none' : 'auto' }}
        >
          {submitting ? 'Submitting...' : (!newReview.trim() ? 'Submit Rating' : 'Submit Review')}
        </button>
      </form>
      <div className="reviews-list-section">
        <h5 className="reviews-list-heading">All Reviews</h5>
        <div className="reviews-list">
          {reviews.length === 0 && <div>No reviews yet. Be the first!</div>}
          {reviews.map(r => (
            <div className="review-card" key={r.id}>
              <div className="review-header">
                <span className="reviewer">{r.userName}</span>
                <span className="review-stars">{Array.from({length: r.rating}).map((_,i) => <FaStar key={i} color="#FFD700" />)}</span>
              </div>
              <div className="review-text">{r.review}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductReviews;
