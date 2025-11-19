import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getOrdersForUser } from '../getOrdersForUser';
import { getProductImageUrl } from '../utils/imageUtils';

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
				if (user) {
					const uDoc = await getDoc(doc(db, 'users', user.uid));
					const role = uDoc.exists() && uDoc.data().role;
					if (role === 'owner') {
						setIsAdmin(true);
						const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
						const snap = await getDocs(q);
						if (!mounted) return;
						const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
						setOrders(list);
						return;
					}
				}
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
		return () => { mounted = false; };
	}, []);

	const formatAmount = raw => {
		if (raw == null) return 'N/A';
		if (typeof raw === 'number') return `₹${raw.toFixed ? raw.toFixed(2) : raw}`;
		return `₹${raw}`;
	};

	const formatDate = ts => {
		if (!ts) return 'N/A';
		if (ts.toDate) return ts.toDate().toLocaleString();
		if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
		try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
	};

	if (loading) return <div className="orders-loading">Loading orders...</div>;
	if (error) return <div className="orders-error">Error: {error}</div>;
	if (!orders.length) return <div className="orders-empty">No orders found.</div>;

	return (
		<div className="orders-container">
			<div className="orders-header">
				<h2 className="orders-title">{isAdmin ? 'All Orders' : 'My Orders'}</h2>
				<div className="orders-count">{orders.length} orders</div>
			</div>
			<div className="orders-list">
				{orders.map(o => {
					const paymentStatus = o.razorpayPaymentId || o.razorpay_payment_id || o.paymentId || o.payment_id ? 'Success' : 'Pending';
					const statusDisplay = (() => {
						const s = o.status || o.paymentStatus || '';
						return (s && String(s).toLowerCase() !== 'completed') ? s : 'In Process';
					})();
					const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
					const orderImageUrl = firstItem ? getProductImageUrl(firstItem) : null;
					const firstProductName = firstItem ? (firstItem.name || firstItem.productName || 'Product') : 'Order';
					return (
						<div key={o.id} className="order-row-item" onClick={() => navigate(`/orders/${o.id}`)}>
							<div className="order-mobile-header">
								{orderImageUrl && (
									<img src={orderImageUrl} alt="Order product" className="order-mobile-image" />
								)}
								<div className="order-mobile-name">{firstProductName}</div>
							</div>
							{orderImageUrl && (
								<div className="order-col order-image">
									<img src={orderImageUrl} alt="Order product" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
								</div>
							)}
							<div className="order-col order-date">
								<div className="order-date-text">{formatDate(o.date || o.createdAt)}</div>
							</div>
							<div className="order-col order-customer">
								<div className="order-customer-name">{o.shipping?.fullName || o.name || 'Unknown'}</div>
							</div>
							<div className="order-col order-products">
								{o.items && o.items.length > 0 ? (
									<div className="products-list">
										{o.items.map((item, idx) => (
											<span key={idx} className="product-item">
												{item.name || item.productName || 'Item'} × {item.quantity || item.qty || 1}
												{idx < o.items.length - 1 && ', '}
											</span>
										))}
									</div>
								) : (
									<span className="no-items">No items</span>
								)}
							</div>
							<div className="order-col order-amount-col">
								<div className="order-amount-value">{formatAmount(o.total || o.amount)}</div>
							</div>
							<div className="order-col order-payment">
								<span className={`payment-badge ${paymentStatus.toLowerCase()}`}>{paymentStatus}</span>
							</div>
							<div className="order-col order-status">
								<span className="status-badge">{statusDisplay}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default OrdersPage;

