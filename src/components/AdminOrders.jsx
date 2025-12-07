import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getProductImageUrl } from '../utils/imageUtils.js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const FUNCTION_REGION = 'asia-south1';
const functionsInstance = getFunctions(app, FUNCTION_REGION);
import './AdminOrders.css';

const STATUS_OPTIONS = ['In Process', 'Shipped', 'Completed', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [shippingOrder, setShippingOrder] = useState(null);
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState('');
  const [packageDimensions, setPackageDimensions] = useState({});

  useEffect(() => {
    const fetchOrdersAndUsers = async () => {
      setLoading(true);
      try {
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('date', 'desc')));
        const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch user details for each order
        const userIds = [...new Set(ordersList.map(o => o.userId).filter(Boolean))];
        const usersMap = {};
        for (const uid of userIds) {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            usersMap[uid] = userDoc.exists() ? userDoc.data() : { email: 'Unknown', displayName: 'Unknown' };
          } catch (e) {
            usersMap[uid] = { email: 'Unknown', displayName: 'Unknown' };
          }
        }

        setOrders(ordersList);
        setUsers(usersMap);
      } catch (err) {
        console.error('Failed to load admin orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersAndUsers();
  }, []);

  // Fetch pickup addresses for diagnostic & selection
  useEffect(() => {
    const fetchPickup = async () => {
      setPickupLoading(true);
      setPickupError(null);
      try {
        const listPickupAddresses = httpsCallable(functionsInstance, 'listPickupAddresses');
        const res = await listPickupAddresses();
        if (res.data && res.data.success) {
          const addresses = Array.isArray(res.data.addresses) ? res.data.addresses : [];
          setPickupAddresses(addresses);
          const configured = res.data.configuredPickup;
          if (configured) setSelectedPickup(configured);
          else if (addresses.length) setSelectedPickup(addresses[0].name || String(addresses[0].id) || '');
        } else {
          setPickupError(res.data?.message || 'Failed to load pickup addresses');
        }
      } catch (err) {
        console.error('Pickup addresses fetch error:', err);
        setPickupError(err.message || 'Failed to load pickup addresses');
      } finally {
        setPickupLoading(false);
      }
    };
    fetchPickup();
  }, []);

  const getPackageDimensions = (orderId) => {
    return packageDimensions[orderId] || { length: 15, breadth: 15, height: 15, weight: 0.5 };
  };

  const updatePackageDimension = (orderId, field, value) => {
    setPackageDimensions(prev => ({
      ...prev,
      [orderId]: { ...getPackageDimensions(orderId), [field]: parseFloat(value) || 0 }
    }));
  };

  const handleStatusChange = (orderId, newStatus) => {
    // Store the pending change locally
    setPendingChanges(prev => ({ ...prev, [orderId]: newStatus }));
  };

  const saveStatus = async (orderId) => {
    const newStatus = pendingChanges[orderId];
    if (!newStatus) return;

    setSavingId(orderId);
    try {
      const ref = doc(db, 'orders', orderId);
      await updateDoc(ref, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      alert('Status updated successfully!');
    } catch (err) {
      alert('Failed to update status: ' + (err.message || err));
    } finally {
      setSavingId(null);
    }
  };

  const bookShiprocketOrder = async (order) => {
    if (!order || shippingOrder === order.id) return;
    
    setShippingOrder(order.id);
    
    try {
      const createShiprocketOrder = httpsCallable(functionsInstance, 'createShiprocketOrder');
      
      // Raw Firestore order snapshot for structural diagnostics
      console.log('--- RAW FIRESTORE ORDER OBJECT ---', JSON.stringify(order, null, 2));
      // Prefer the correct path names used in stored orders (try multiple common keys)
      const shippingRaw = order.shippingAddress || order.shipping || order.checkout || order.Address || order.address || order.delivery || {};
      const shipping = {
        fullName: shippingRaw.fullName || shippingRaw.name || order.customerName || (users[order.userId]?.displayName) || '',
        addressLine1: shippingRaw.line1 || shippingRaw.address_line1 || shippingRaw.address1 || shippingRaw.address || '',
        addressLine2: shippingRaw.line2 || shippingRaw.address_line2 || shippingRaw.address2 || '',
        city: shippingRaw.city || '',
        state: shippingRaw.state || '',
        pincode: shippingRaw.pincode || shippingRaw.zip || shippingRaw.postalCode || shippingRaw.postcode || '',
        country: shippingRaw.country || 'India',
        email: shippingRaw.email || (users[order.userId]?.email) || order.email || '',
        phone: shippingRaw.phone || shippingRaw.phoneNumber || shippingRaw.phone_number || order.phone || ''
      };
      const userData = users[order.userId] || {};
      
      console.log('Order data:', order);
      console.log('Shipping data:', shipping);
      console.log('User data:', userData);
      
      // Robust defaults to satisfy Shiprocket mandatory address fields
      const DEFAULTS = {
        name: 'Customer',
        address: 'Sansad Marg',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
        email: 'no-reply@boldandbrew.in',
        phone: '9999999999'
      };

      const sanitize = (val, fallback) => {
        const v = (val === undefined || val === null ? '' : String(val)).trim();
        return v.length ? v : fallback;
      };

      // Build a single billing address from line1/line2 or fallback to 'address'
      const customerName   = sanitize(shipping.fullName || userData.displayName || order.customerName, DEFAULTS.name);
      const joinedAddress  = [shipping.addressLine1, shipping.addressLine2].filter(Boolean).join(', ');
      const billingAddress = sanitize(joinedAddress || shippingRaw.address || order.address, DEFAULTS.address);
      const billingCity    = sanitize(shipping.city || order.city, DEFAULTS.city);
      const billingPincode = sanitize(shipping.pincode || order.pincode, DEFAULTS.pincode);
      const billingState   = sanitize(shipping.state || order.state, DEFAULTS.state);
      const billingCountry = sanitize(shipping.country || order.country, DEFAULTS.country);
      const billingEmail   = sanitize(shipping.email || userData.email || order.email, DEFAULTS.email);
      const billingPhoneRaw= sanitize(shipping.phone || order.phone, DEFAULTS.phone);

      // If pincode missing try to extract from full joined address via regex
      let derivedPincode = billingPincode;
      if (!derivedPincode || derivedPincode === DEFAULTS.pincode) {
        const pinMatch = billingAddress.match(/\b\d{6}\b/);
        if (pinMatch) {
          derivedPincode = pinMatch[0];
          console.log('Derived pincode from address string:', derivedPincode);
        }
      }
      // If city still default, attempt heuristic: take second segment of address (after first comma)
      let derivedCity = billingCity;
      if (!derivedCity || derivedCity === DEFAULTS.city) {
        const parts = billingAddress.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          // Try last part containing state/pin; city might be second or third
          derivedCity = parts[parts.length - 2];
          console.log('Derived city from address string:', derivedCity);
        }
      }
      // If state still default try to find known Indian state token in address
      let derivedState = billingState;
      if (!derivedState || derivedState === DEFAULTS.state) {
        const STATES = ['Delhi','Karnataka','Maharashtra','Tamil Nadu','Uttar Pradesh','Haryana','Punjab','Gujarat','Rajasthan','Kerala','West Bengal'];
        const found = STATES.find(st => new RegExp(`\\b${st}\\b`, 'i').test(billingAddress));
        if (found) {
          derivedState = found;
          console.log('Derived state from address string:', derivedState);
        }
      }

      // Clean & validate phone (fallback to default if invalid)
      let cleanPhone = billingPhoneRaw.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        console.warn('Phone invalid, using default. Provided:', billingPhoneRaw);
        cleanPhone = DEFAULTS.phone;
      }

      // Clean & validate pincode (fallback to default if invalid)
      let cleanPincode = (derivedPincode || billingPincode).replace(/\D/g, '');
      if (cleanPincode.length !== 6) {
        console.warn('Pincode invalid, using default. Provided:', billingPincode);
        cleanPincode = DEFAULTS.pincode;
      }

      // Log sanitized values for debugging
      console.log('Sanitized shipping values:', { customerName, billingAddress, cityInitial: billingCity, cityDerived: derivedCity, stateInitial: billingState, stateDerived: derivedState, cleanPincode, billingCountry, billingEmail, cleanPhone });
      
      // Build Shiprocket order payload
      const pickupLocationValue = selectedPickup || 'Home';
      const orderData = {
        order_id: String(order.id),
        order_date: order.date?.toDate ? order.date.toDate().toISOString().split('T')[0] + ' ' + order.date.toDate().toTimeString().split(' ')[0].substring(0, 5) : new Date().toISOString().split('T')[0] + ' 12:00',
        pickup_location: pickupLocationValue,
        channel_id: "",
        comment: "Order from Bold & Brew",
        billing_customer_name: customerName,
        billing_last_name: "",
        billing_address: billingAddress,
        billing_address_2: "",
        billing_city: derivedCity || billingCity,
        billing_pincode: cleanPincode,
        billing_state: derivedState || billingState,
        billing_country: billingCountry,
        billing_email: billingEmail,
        billing_phone: cleanPhone,
        // Provide shipping fields explicitly (Shiprocket rejects empty shipping even if shipping_is_billing)
        shipping_is_billing: true,
        shipping_customer_name: customerName,
        shipping_last_name: "",
        shipping_address: billingAddress,
        shipping_address_2: "",
        shipping_city: derivedCity || billingCity,
        shipping_pincode: cleanPincode,
        shipping_country: billingCountry,
        shipping_state: derivedState || billingState,
        shipping_email: billingEmail,
        shipping_phone: cleanPhone,
        order_items: (order.items || []).map(item => ({
          name: (item.name || item.productName || 'Product').substring(0, 50),
          sku: String(item.sku || item.id || 'SKU' + Date.now()),
          units: parseInt(item.quantity || item.qty || 1),
          // Shiprocket expects numbers for price fields
          selling_price: Math.round(parseFloat(item.price || item.unitPrice || 0)),
          discount: "",
          tax: "",
          hsn: 446
        })),
        payment_method: "Prepaid",
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: Math.round(parseFloat(order.total || order.amount || 0)),
        length: getPackageDimensions(order.id).length,
        breadth: getPackageDimensions(order.id).breadth,
        height: getPackageDimensions(order.id).height,
        weight: getPackageDimensions(order.id).weight
      };
      
      console.log('Shiprocket payload:', orderData);
      console.log('Using pickup_location value:', pickupLocationValue);
      const result = await createShiprocketOrder({ orderData });
      
      if (result.data && result.data.success) {
        const orderIdFromSR = result.data.order_id;
        const shipmentIdFromSR = result.data.shipment_id;
        alert(`Shiprocket order created successfully!\nOrder ID: ${orderIdFromSR}\nShipment ID: ${shipmentIdFromSR || 'N/A'}`);
        const updatePayload = { status: 'Shipped' };
        if (orderIdFromSR !== undefined) updatePayload.shiprocketOrderId = orderIdFromSR || null;
        if (shipmentIdFromSR !== undefined) updatePayload.shiprocketShipmentId = shipmentIdFromSR || null;
        await updateDoc(doc(db, 'orders', order.id), updatePayload);
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Shipped', shiprocketOrderId: orderIdFromSR, shiprocketShipmentId: shipmentIdFromSR } : o));
      } else {
        console.error('Shiprocket booking failed:', result.data);
        alert('Failed to create Shiprocket order: ' + (result.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Shiprocket booking error:', error);
      alert('Error creating Shiprocket order: ' + (error.message || 'Unknown error'));
    } finally {
      setShippingOrder(null);
    }
  };

  if (loading) return <div className="admin-orders-loading">Loading orders...</div>;

  return (
    <div className="admin-orders-container">
      <h2 className="admin-orders-title">All Orders</h2>
      {orders.length === 0 ? (
        <div className="admin-orders-empty">No orders found.</div>
      ) : (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div className="admin-order-card" key={order.id}>
              <div className="admin-order-header">
                <span className="admin-order-id">Order ID: {order.id}</span>
                <span className="admin-order-date">{order.date && order.date.toDate ? order.date.toDate().toLocaleString() : (order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : '')}</span>
              </div>

              {(() => {
                const userData = users[order.userId] || {};
                const shipping = order.shipping || order.checkout || {};
                const customerName = shipping.fullName || userData.displayName || order.customerName || order.name || userData.email || 'Unknown';
                const email = shipping.email || userData.email || order.email || order.customerEmail || 'Unknown';
                // phone extraction similar to OrderConfirmed component
                const phone = (
                  shipping.phone || shipping.phoneNumber || shipping.phone_number ||
                  order.phone || order.contact?.phone || order.customerPhone || order.mobile ||
                  userData.phone || 'N/A'
                );
                const addressParts = [
                  shipping.address,
                  shipping.city,
                  shipping.state,
                  shipping.pincode || shipping.zip,
                  shipping.country
                ].filter(p => p && String(p).trim().length > 0);
                const address = addressParts.length ? addressParts.join(', ') : 'N/A';
                const paymentStatus = (
                  order.paymentStatus || order.payment?.status || (order.payment?.paid ? 'Paid' : null) ||
                  (order.razorpayPaymentId || order.razorpay_payment_id || order.paymentId || order.payment_id ? 'Paid' : null) ||
                  'Pending'
                );
                return (
                  <div className="admin-order-customer">
                    <div className="customer-row"><span className="label">Customer:</span><span>{customerName}</span></div>
                    <div className="customer-row"><span className="label">Email:</span><span>{email}</span></div>
                    <div className="customer-row"><span className="label">Phone:</span><span>{phone || 'N/A'}</span></div>
                    <div className="customer-row"><span className="label">Address:</span><span className="address-value">{address}</span></div>
                    <div className="customer-row"><span className="label">Payment:</span><span className={"payment-status " + paymentStatus.toLowerCase()}> {paymentStatus}</span></div>
                  </div>
                );
              })()}

              <div className="admin-order-items">
                {order.items && order.items.map((item, idx) => {
                  const imageUrl = getProductImageUrl(item);
                  return (
                    <div className="admin-order-item" key={idx}>
                      <img src={imageUrl} alt={item.name || item.productName || 'Product'} style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 8}} />
                      <span className="admin-item-name">{item.name || item.productName || 'Item'}</span>
                      <span className="admin-item-qty">x{item.quantity || item.qty || 1}</span>
                      <span className="admin-item-price">₹{item.price || item.unitPrice || 0}</span>
                    </div>
                  );
                })}
              </div>

              <div className="admin-order-bottom">
                <div className="admin-order-total">Total: ₹{order.total ?? order.amount ?? 0}</div>
                <div className="admin-order-status">
                  <label>Status:</label>
                  <select 
                    value={pendingChanges[order.id] ?? order.status ?? 'In Process'} 
                    onChange={e => handleStatusChange(order.id, e.target.value)} 
                    disabled={savingId === order.id}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {pendingChanges[order.id] && (
                    <button 
                      className="admin-save-btn" 
                      onClick={() => saveStatus(order.id)}
                      disabled={savingId === order.id}
                    >
                      {savingId === order.id ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
                <div className="admin-package-dimensions">
                  <label>Package Dimensions (cm):</label>
                  <div className="dimensions-inputs">
                    <input type="number" step="0.1" min="0" placeholder="L" value={getPackageDimensions(order.id).length} onChange={e => updatePackageDimension(order.id, 'length', e.target.value)} style={{width: '60px'}} />
                    <span>×</span>
                    <input type="number" step="0.1" min="0" placeholder="B" value={getPackageDimensions(order.id).breadth} onChange={e => updatePackageDimension(order.id, 'breadth', e.target.value)} style={{width: '60px'}} />
                    <span>×</span>
                    <input type="number" step="0.1" min="0" placeholder="H" value={getPackageDimensions(order.id).height} onChange={e => updatePackageDimension(order.id, 'height', e.target.value)} style={{width: '60px'}} />
                  </div>
                  <label>Weight (kg):</label>
                  <input type="number" step="0.01" min="0" placeholder="Weight" value={getPackageDimensions(order.id).weight} onChange={e => updatePackageDimension(order.id, 'weight', e.target.value)} style={{width: '80px'}} />
                </div>
                <button 
                  className="admin-ship-btn" 
                  onClick={() => bookShiprocketOrder(order)}
                  disabled={shippingOrder === order.id}
                >
                  {shippingOrder === order.id ? 'Creating Shipment...' : 'Create Shiprocket Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
