import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FaPlus, FaEdit, FaTrash, FaPercentage, FaCalendarAlt, FaTag } from 'react-icons/fa';
import './CouponManagement.css';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    usedCount: 0,
    validFrom: '',
    validUntil: '',
    isActive: true
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const querySnap = await getDocs(collection(db, 'coupons'));
      const items = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom?.toDate?.() || null,
        validUntil: doc.data().validUntil?.toDate?.() || null
      }));
      setCoupons(items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds || 0));
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      usageLimit: '',
      usedCount: 0,
      validFrom: '',
      validUntil: '',
      isActive: true
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      minOrderValue: coupon.minOrderValue || '',
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || '',
      usedCount: coupon.usedCount || 0,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
      isActive: coupon.isActive !== undefined ? coupon.isActive : true
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discountValue) {
      alert('Coupon code and discount value are required');
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscount: Number(formData.maxDiscount) || 0,
        usageLimit: Number(formData.usageLimit) || 0,
        usedCount: formData.usedCount || 0,
        validFrom: formData.validFrom ? Timestamp.fromDate(new Date(formData.validFrom)) : null,
        validUntil: formData.validUntil ? Timestamp.fromDate(new Date(formData.validUntil)) : null,
        isActive: formData.isActive,
        updatedAt: Timestamp.now()
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), couponData);
        setSuccessMsg('Coupon updated successfully!');
      } else {
        couponData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'coupons'), couponData);
        setSuccessMsg('Coupon created successfully!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      loadCoupons();
    } catch (err) {
      console.error('Error saving coupon:', err);
      alert('Error saving coupon: ' + err.message);
    }
  };

  const handleDelete = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
      setSuccessMsg('Coupon deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Error deleting coupon: ' + err.message);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: !coupon.isActive,
        updatedAt: Timestamp.now()
      });
      loadCoupons();
    } catch (err) {
      console.error('Error toggling coupon status:', err);
    }
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return <div className="coupon-loading">Loading coupons...</div>;
  }

  return (
    <div className="coupon-management">
      <div className="coupon-header">
        <h2><FaTag /> Coupon Management</h2>
        <button className="btn-create-coupon" onClick={() => setShowForm(true)}>
          <FaPlus /> Create New Coupon
        </button>
      </div>

      {successMsg && (
        <div className="success-message">{successMsg}</div>
      )}

      {showForm && (
        <div className="coupon-form-overlay" onClick={(e) => e.target.className === 'coupon-form-overlay' && resetForm()}>
          <div className="coupon-form-container">
            <div className="coupon-form-header">
              <h3>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="coupon-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="WELCOME10"
                    required
                    maxLength={20}
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="10% off on first order"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                    required
                    min="0"
                    step="0.01"
                  />
                  <small>{formData.discountType === 'percentage' ? '(%)' : '(₹)'}</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Order Value</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                    placeholder="500"
                    min="0"
                  />
                  <small>(₹) Leave blank for no minimum</small>
                </div>
                
                <div className="form-group">
                  <label>Max Discount Amount</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    placeholder="200"
                    min="0"
                  />
                  <small>(₹) For percentage type only</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    placeholder="100"
                    min="0"
                  />
                  <small>Total uses allowed (0 = unlimited)</small>
                </div>
                
                <div className="form-group">
                  <label>Times Used</label>
                  <input
                    type="number"
                    value={formData.usedCount}
                    readOnly
                    disabled
                  />
                  <small>Current usage count</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valid From</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Valid Until</label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="coupons-list">
        {coupons.length === 0 ? (
          <div className="no-coupons">
            <FaTag size={48} />
            <p>No coupons created yet</p>
            <button onClick={() => setShowForm(true)}>Create Your First Coupon</button>
          </div>
        ) : (
          <div className="coupons-grid">
            {coupons.map(coupon => (
              <div key={coupon.id} className={`coupon-card ${!coupon.isActive ? 'inactive' : ''} ${isExpired(coupon.validUntil) ? 'expired' : ''}`}>
                <div className="coupon-card-header">
                  <div className="coupon-code">
                    <FaTag />
                    <span>{coupon.code}</span>
                  </div>
                  <div className="coupon-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(coupon)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(coupon.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="coupon-details">
                  {coupon.description && (
                    <p className="coupon-description">{coupon.description}</p>
                  )}
                  
                  <div className="coupon-info">
                    <div className="info-item">
                      <FaPercentage />
                      <span>
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`
                        }
                      </span>
                    </div>
                    
                    {coupon.minOrderValue > 0 && (
                      <div className="info-item">
                        <span>Min Order: ₹{coupon.minOrderValue}</span>
                      </div>
                    )}
                    
                    {coupon.maxDiscount > 0 && coupon.discountType === 'percentage' && (
                      <div className="info-item">
                        <span>Max Discount: ₹{coupon.maxDiscount}</span>
                      </div>
                    )}
                  </div>

                  {(coupon.validFrom || coupon.validUntil) && (
                    <div className="coupon-validity">
                      <FaCalendarAlt />
                      <span>
                        {coupon.validFrom && `From ${new Date(coupon.validFrom).toLocaleDateString()}`}
                        {coupon.validFrom && coupon.validUntil && ' - '}
                        {coupon.validUntil && `Until ${new Date(coupon.validUntil).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}

                  <div className="coupon-usage">
                    <span>
                      Used: {coupon.usedCount || 0}
                      {coupon.usageLimit > 0 && ` / ${coupon.usageLimit}`}
                    </span>
                  </div>
                </div>

                <div className="coupon-card-footer">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={coupon.isActive}
                      onChange={() => toggleActive(coupon)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="status-text">
                    {isExpired(coupon.validUntil) ? 'Expired' : (coupon.isActive ? 'Active' : 'Inactive')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
