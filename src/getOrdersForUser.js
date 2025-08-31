import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

// Fetch orders for the currently logged-in user
export async function getOrdersForUser() {
  const user = auth.currentUser;
  if (!user) return [];
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('userId', '==', user.uid),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
