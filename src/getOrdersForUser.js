import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

// Fetch orders for the currently logged-in user.
// Avoid server-side orderBy combined with where to prevent requiring a composite index.
// Instead, fetch matching docs and sort client-side by date/createdAt.
export async function getOrdersForUser() {
  const user = auth.currentUser;
  if (!user) return [];
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by date or createdAt descending (newest first)
  list.sort((a, b) => {
    const ta = a.date?.toDate ? a.date.toDate() : (a.date?.seconds ? new Date(a.date.seconds * 1000) : (a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0))));
    const tb = b.date?.toDate ? b.date.toDate() : (b.date?.seconds ? new Date(b.date.seconds * 1000) : (b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0))));
    return tb - ta;
  });

  return list;
}
