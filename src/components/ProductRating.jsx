
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FaStar } from 'react-icons/fa';

function ProductRating({ productId }) {
  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!productId) return;
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const unsub = onSnapshot(q, (snap) => {
      const ratings = snap.docs.map(doc => doc.data().rating).filter(r => typeof r === 'number');
      if (ratings.length) {
        setAvg(ratings.reduce((a, b) => a + b, 0) / ratings.length);
        setCount(ratings.length);
      } else {
        setAvg(null);
        setCount(0);
      }
    });
    return () => unsub();
  }, [productId]);

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
