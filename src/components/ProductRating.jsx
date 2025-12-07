
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FaStar } from 'react-icons/fa';

function ProductRating({ productId, onRatingUpdate }) {
  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!productId) return;
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    // attach an error handler so permission errors don't throw uncaught internal errors
    const unsub = onSnapshot(
      q,
      (snap) => {
        const ratings = snap.docs.map(doc => doc.data().rating).filter(r => typeof r === 'number');
        if (ratings.length) {
          const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          setAvg(average);
          setCount(ratings.length);
          if (onRatingUpdate) onRatingUpdate(average, ratings.length);
        } else {
          setAvg(null);
          setCount(0);
          if (onRatingUpdate) onRatingUpdate(null, 0);
        }
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.warn('ProductRating onSnapshot error:', error);
        // reset values on error (e.g., permission-denied) to keep UI stable
        setAvg(null);
        setCount(0);
        if (onRatingUpdate) onRatingUpdate(null, 0);
      }
    );
    return () => unsub();
  }, [productId, onRatingUpdate]);

  const displayAvg = avg === null ? 0 : avg;
  const displayCount = count;
  return (
    <div className="product-rating" title={
      displayCount > 0
        ? `${displayAvg.toFixed(1)} out of 5 from ${displayCount} review${displayCount > 1 ? 's' : ''}`
        : 'No reviews yet'
    }>
      {[1,2,3,4,5].map(i => (
        <FaStar key={i} color={i <= Math.round(displayAvg) ? '#FFD700' : '#ccc'} style={{marginRight:2}} />
      ))}
      <span className="product-rating-value">{displayAvg.toFixed(1)}</span>
      <span className="product-rating-count">({displayCount})</span>
    </div>
  );
}

export default ProductRating;
