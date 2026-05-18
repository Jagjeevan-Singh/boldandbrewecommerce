import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminDashboard.css'; // Reusing admin styles

export default function BannerManagement() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [heroBanners, setHeroBanners] = useState([]);
  const [newHeroBanner, setNewHeroBanner] = useState({ webImage: '', mobileImage: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const BANNER_DOC_REF = doc(db, 'settings', 'banner');
  const HERO_BANNER_DOC_REF = doc(db, 'settings', 'hero_banners');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannerSnap, heroSnap] = await Promise.all([
        getDoc(BANNER_DOC_REF),
        getDoc(HERO_BANNER_DOC_REF)
      ]);

      if (bannerSnap.exists() && bannerSnap.data().messages) {
        setMessages(bannerSnap.data().messages);
      } else {
        setMessages(['Free Delivery For All Orders', 'Save Rs.50 Using NEW50 Coupon']);
      }

      if (heroSnap.exists() && heroSnap.data().banners) {
        setHeroBanners(heroSnap.data().banners);
      } else {
        setHeroBanners([]);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load banner settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const updatedMessages = [...messages, newMessage.trim()];
    await saveMessages(updatedMessages);
    setNewMessage('');
  };

  const handleDeleteMessage = async (index) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    await saveMessages(updatedMessages);
  };

  const handleUpdateMessage = async (index, newText) => {
    const updatedMessages = [...messages];
    updatedMessages[index] = newText;
    await saveMessages(updatedMessages);
  };

  const saveMessages = async (updatedMessages) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await setDoc(BANNER_DOC_REF, { messages: updatedMessages }, { merge: true });
      setMessages(updatedMessages);
      setSuccess('Auto-scroll messages updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving banner messages:', err);
      setError('Failed to save banner messages.');
    } finally {
      setSaving(false);
    }
  };

  // --- Hero Banner Handlers ---
  const handleAddHeroBanner = async (e) => {
    e.preventDefault();
    if (!newHeroBanner.webImage.trim() || !newHeroBanner.mobileImage.trim()) return;
    
    const updatedBanners = [...heroBanners, newHeroBanner];
    await saveHeroBanners(updatedBanners);
    setNewHeroBanner({ webImage: '', mobileImage: '' });
  };

  const handleDeleteHeroBanner = async (index) => {
    const updatedBanners = heroBanners.filter((_, i) => i !== index);
    await saveHeroBanners(updatedBanners);
  };

  const handleUpdateHeroBanner = async (index, field, value) => {
    const updatedBanners = [...heroBanners];
    updatedBanners[index] = { ...updatedBanners[index], [field]: value };
    await saveHeroBanners(updatedBanners);
  };

  const saveHeroBanners = async (updatedBanners) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await setDoc(HERO_BANNER_DOC_REF, { banners: updatedBanners }, { merge: true });
      setHeroBanners(updatedBanners);
      setSuccess('Hero Banners updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving hero banners:', err);
      setError('Failed to save hero banners.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading banner settings...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header-row">
        <h2>Banner Management</h2>
      </div>

      {error && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', gap: '40px' }}>
        
        {/* Auto Scroll Banner Section */}
        <div className="admin-stat-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#4e342e' }}>Auto Scroll Banner Messages</h3>
          <p style={{ fontSize: '0.9rem', color: '#6d4c41', marginBottom: '20px' }}>
            These messages will scroll automatically at the very top of the website.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {messages.length === 0 ? (
              <p style={{ color: '#8d6e63', fontStyle: 'italic' }}>No messages configured.</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => {
                      const newMessages = [...messages];
                      newMessages[idx] = e.target.value;
                      setMessages(newMessages);
                    }}
                    onBlur={(e) => handleUpdateMessage(idx, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d9c9bb',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleDeleteMessage(idx)}
                    disabled={saving}
                    style={{
                      background: '#e53935',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      opacity: saving ? 0.7 : 1
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddMessage} style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a new auto scroll message..."
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #d9c9bb',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || saving}
              style={{
                background: '#7c5a3a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: (!newMessage.trim() || saving) ? 0.7 : 1
              }}
            >
              Add Message
            </button>
          </form>
        </div>

        {/* Hero Slider Banners Section */}
        <div className="admin-stat-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '8px', color: '#4e342e' }}>Main Image Banners (Slider)</h3>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.85rem', color: '#d32f2f', margin: 0, fontWeight: 'bold' }}>Important Image Dimensions:</p>
            <ul style={{ fontSize: '0.85rem', color: '#4e342e', margin: '4px 0 0 16px', padding: 0 }}>
              <li><strong>Desktop (Web):</strong> 1920x768 px</li>
              <li><strong>Mobile (Mweb):</strong> 800x450 px</li>
            </ul>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            {heroBanners.length === 0 ? (
              <p style={{ color: '#8d6e63', fontStyle: 'italic' }}>No custom hero banners configured. Website will use default images.</p>
            ) : (
              heroBanners.map((banner, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', border: '1px solid #d9c9bb', borderRadius: '8px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#4e342e' }}>Slide {idx + 1}</h4>
                    <button
                      onClick={() => handleDeleteHeroBanner(idx)}
                      disabled={saving}
                      style={{
                        background: '#e53935',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        opacity: saving ? 0.7 : 1
                      }}
                    >
                      Delete Slide
                    </button>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6d4c41', display: 'block', marginBottom: '4px' }}>Desktop Image URL (1920x768)</label>
                    <input
                      type="text"
                      value={banner.webImage}
                      onChange={(e) => handleUpdateHeroBanner(idx, 'webImage', e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#6d4c41', display: 'block', marginBottom: '4px' }}>Mobile Image URL (800x450)</label>
                    <input
                      type="text"
                      value={banner.mobileImage}
                      onChange={(e) => handleUpdateHeroBanner(idx, 'mobileImage', e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddHeroBanner} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
            <h4 style={{ margin: 0, color: '#4e342e' }}>Add New Slide</h4>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#6d4c41', display: 'block', marginBottom: '4px' }}>Desktop Image URL</label>
              <input
                type="text"
                value={newHeroBanner.webImage}
                onChange={(e) => setNewHeroBanner(prev => ({ ...prev, webImage: e.target.value }))}
                placeholder="https://..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d9c9bb', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#6d4c41', display: 'block', marginBottom: '4px' }}>Mobile Image URL</label>
              <input
                type="text"
                value={newHeroBanner.mobileImage}
                onChange={(e) => setNewHeroBanner(prev => ({ ...prev, mobileImage: e.target.value }))}
                placeholder="https://..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d9c9bb', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={!newHeroBanner.webImage.trim() || !newHeroBanner.mobileImage.trim() || saving}
              style={{
                background: '#7c5a3a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '8px',
                opacity: (!newHeroBanner.webImage.trim() || !newHeroBanner.mobileImage.trim() || saving) ? 0.7 : 1
              }}
            >
              Add New Slide
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
