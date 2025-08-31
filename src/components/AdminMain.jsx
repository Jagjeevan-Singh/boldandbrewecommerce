import React, { useState } from 'react';

import AdminOrders from './AdminOrders';
import AdminDashboard from './AdminDashboard';
import './AdminMain.css';
import logo from '../assets/logo.png';

const NAV_OPTIONS = [
  { key: 'dashboard', label: 'Home' },
  { key: 'orders', label: 'Orders' },
];

export default function AdminMain() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'orders' && <AdminOrders />}
      </div>
    </div>
  );
}