import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

// Fetch orders for the currently logged-in user.
// Matches both new orders (with userId) and legacy orders (by email).
// Avoid server-side orderBy combined with where to prevent requiring a composite index.
// Instead, fetch matching docs and sort client-side by date/createdAt.
export async function getOrdersForUser() {
  const user = auth.currentUser;
  if (!user) return [];
  
  const ordersRef = collection(db, 'orders');
  
  // Fetch orders that match the current user's ID (new orders)
  const q1 = query(ordersRef, where('userId', '==', user.uid));
  const snap1 = await getDocs(q1);
  const userIdOrders = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Also fetch orders that match the current user's email (legacy orders without userId)
  const q2 = query(ordersRef, where('shipping.email', '==', user.email));
  const snap2 = await getDocs(q2);
  const emailOrders = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Merge both lists and remove duplicates (by order ID)
  const allOrders = [...userIdOrders, ...emailOrders];
  const uniqueOrdersMap = new Map();
  allOrders.forEach(order => {
    uniqueOrdersMap.set(order.id, order);
  });
  const list = Array.from(uniqueOrdersMap.values());

  // Sort by date or createdAt descending (newest first)
  list.sort((a, b) => {
    const ta = a.date?.toDate ? a.date.toDate() : (a.date?.seconds ? new Date(a.date.seconds * 1000) : (a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0))));
    const tb = b.date?.toDate ? b.date.toDate() : (b.date?.seconds ? new Date(b.date.seconds * 1000) : (b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0))));
    return tb - ta;
  });

  return list;
}
