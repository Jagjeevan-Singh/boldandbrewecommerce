import React, { useState } from 'react';

import AdminOrders from './AdminOrders';
import AdminDashboard from './AdminDashboard';
import EditProduct from './EditProduct';
import CreateProduct from './CreateProduct';
import CouponManagement from './CouponManagement';
import './AdminMain.css';
import logo from '../assets/logo.png';

const NAV_OPTIONS = [
  { key: 'dashboard', label: 'Home' },
  { key: 'orders', label: 'Orders' },
  { key: 'coupons', label: 'Coupons' },
];

export default function AdminMain() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  return (
    <div className="admin-main-wrapper">
      <nav className="admin-navbar">
        <div className="admin-navbar-logo">
          <img src={logo} alt="Logo" style={{height:32,width:32,marginRight:10,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 6px #bcae9e22'}} />
          Bold & Brew Admin
        </div>
        <div className="admin-navbar-links">
          {NAV_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`admin-navbar-link${activeTab === opt.key ? ' active' : ''}`}
              onClick={() => setActiveTab(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="admin-main-content">
        {activeTab === 'dashboard' && <AdminDashboard onCreateProduct={() => setShowCreateProduct(true)} onEditProduct={(p) => setEditingProduct(p)} onManageCoupons={() => setActiveTab('coupons')} />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'coupons' && <CouponManagement />}
        {showCreateProduct && <CreateProduct onClose={() => setShowCreateProduct(false)} />}
        {editingProduct && <EditProduct 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSaved={(updated) => {
            // Update the editing product with the latest data
            setEditingProduct(prev => ({ ...prev, ...updated }));
            // Close after a short delay to show success message
            setTimeout(() => setEditingProduct(null), 1500);
          }} 
        />}
      </div>
    </div>
  );
}