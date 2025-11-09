import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getOrdersForUser } from '../getOrdersForUser';

const OrdersPage = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			setLoading(true);
			try {
				const user = auth.currentUser;
				// Determine role (owner/admin) by reading users collection
				if (user) {
					const uDoc = await getDoc(doc(db, 'users', user.uid));
					const role = uDoc.exists() && uDoc.data().role;
					if (role === 'owner') {
						setIsAdmin(true);
						// Fetch all orders (admin view)
						const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
						const snap = await getDocs(q);
						if (!mounted) return;
						const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
						setOrders(list);
						return;
					}
				}

				// Non-admin: fetch orders for current user
				const userOrders = await getOrdersForUser();
				if (!mounted) return;
				setOrders(userOrders);
			} catch (err) {
				if (!mounted) return;
				console.error('Failed to load orders:', err);
				setError(err.message || 'Failed to load orders');
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();

		return () => {
			mounted = false;
		};
	}, []);

	const formatAmount = (raw) => {
		if (raw == null) return 'N/A';
		if (typeof raw === 'number') return `₹${raw.toFixed ? raw.toFixed(2) : raw}`;
		return `₹${raw}`;
	};

	const formatDate = (ts) => {
		if (!ts) return 'N/A';
		if (ts.toDate) return ts.toDate().toLocaleString();
		if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
		try {
			return new Date(ts).toLocaleString();
		} catch {
			return String(ts);
		}
	};

	if (loading) return <div style={{ padding: 16 }}>Loading orders...</div>;
	if (error) return <div style={{ padding: 16, color: 'red' }}>Error: {error}</div>;

	if (!orders.length) {
		return <div style={{ padding: 16 }}>No orders found.</div>;
	}

	return (
		<div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
			<h2>{isAdmin ? 'All Orders' : 'My Orders'}</h2>
			<div style={{ display: 'grid', gap: 12 }}>
				{orders.map((o) => (
					<div
						key={o.id}
						onClick={() => navigate(`/orders/${o.id}`)}
						style={{
							border: '1px solid #ddd',
							padding: 12,
							borderRadius: 6,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							background: '#fff',
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
						onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
							<div>
								<strong>{o.shipping?.fullName || o.name || 'Unknown'}</strong>
							</div>
							<div>{formatAmount(o.total || o.amount)}</div>
						</div>

						<div style={{ marginBottom: 6 }}>
							<strong>Payment ID:</strong> {o.razorpayPaymentId || o.paymentId || o.razorpay_payment_id || 'N/A'}
						</div>

						<div style={{ marginBottom: 6 }}>
							<strong>Status:</strong> {o.status || o.paymentStatus || 'Success'}
						</div>

						<div style={{ marginBottom: 6 }}>
							<strong>Delivery Option:</strong> {o.deliveryOption || 'N/A'}
						</div>

						<div style={{ marginBottom: 6 }}>
							<strong>Created:</strong> {formatDate(o.date || o.createdAt)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default OrdersPage;

