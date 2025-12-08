

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { FaEdit, FaTag } from 'react-icons/fa';
import { db } from "../firebase";
import "./AdminDashboard.css";

// Import all images in assets at build time (Vite)
// Updated to new Vite API
const images = import.meta.glob('../assets/*', { eager: true, query: '?url', import: 'default' });

function ProductImage({ src, alt }) {
  if (src && !src.startsWith('http')) {
    const match = Object.entries(images).find(([key]) => key.endsWith('/' + src));
    if (match) {
      return <img src={match[1]} alt={alt} className="admin-dashboard-img" />;
    }
  }
  // Fallback to direct src (for http or not found)
  return <img src={src} alt={alt} className="admin-dashboard-img" onError={e=>e.target.style.display='none'} />;
}

export default function AdminDashboard({ onCreateProduct, onEditProduct, onManageCoupons }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const querySnap = await getDocs(collection(db, "products"));
        const items = querySnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const loadCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const querySnap = await getDocs(collection(db, "coupons"));
        const items = querySnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          validFrom: doc.data().validFrom?.toDate?.() || null,
          validUntil: doc.data().validUntil?.toDate?.() || null
        }));
        setCoupons(items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds || 0));
      } catch (err) {
        console.error("Error loading coupons:", err);
      } finally {
        setLoadingCoupons(false);
      }
    };
    
    loadProducts();
    loadCoupons();
    
    // Listen for product deletion events
    const onDeleted = (e) => {
      const deletedId = e.detail?.id;
      if (deletedId) {
        setProducts(prev => prev.filter(p => p.id !== deletedId));
      }
    };
    window.addEventListener('productDeleted', onDeleted);
    return () => window.removeEventListener('productDeleted', onDeleted);
  }, []);

  const handleChange = (id, field, value) => {
    setProducts(products =>
      products.map(p =>
        p.id === id ? { ...p, [field]: field === "price" || field === "originalPrice" || field === "stock" ? Number(value) : value } : p
      )
    );
  };

  const handleSave = async (id) => {
    setSavingId(id);
    setSuccessMsg("");
    const product = products.find(p => p.id === id);
    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        description: product.description,
        brand: product.brand,
        stock: product.stock ?? 0,
        mainImage: product.mainImage,
        images: product.images ?? [product.mainImage],
      });
      setSuccessMsg("Product updated successfully!");
    } catch (err) {
      alert("Error saving product: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p style={{color:'#7c5a3a', fontWeight:600, fontSize:'1.2em'}}>Loading dashboard...</p>;

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalCoupons = coupons.length;

  return (
    <div>
      <div style={{ padding: "32px 0", maxWidth: 1200, margin: "0 auto", fontFamily: 'Poppins, Montserrat, Arial, sans-serif' }}>
        <h2 style={{ color: '#4a3c35', fontWeight: 700, fontSize: '2.2rem', marginBottom: 32, letterSpacing: 1 }}>☕ Admin Dashboard</h2>
        {successMsg && <div style={{background:'#e6ffe6',color:'#2e7d32',padding:'10px 18px',borderRadius:8,marginBottom:18,fontWeight:600}}>{successMsg}</div>}
        
        {/* Coupons Summary Section */}
        <div style={{marginBottom:24, background:'#fff7f0', padding:'20px 24px', borderRadius:12, border:'2px solid #e0c9b6'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem'}}>
            <div>
              <h3 style={{color:'#4a3c35', fontWeight:600, fontSize:'1.4rem', marginBottom:8, display:'flex', alignItems:'center', gap:8}}>
                <FaTag style={{color:'#b9805a'}} /> Coupons Management
              </h3>
              <p style={{color:'#666', fontSize:'0.95rem', margin:0}}>
                {loadingCoupons ? 'Loading coupons...' : `${activeCoupons} active out of ${totalCoupons} total coupons`}
              </p>
            </div>
            <button 
              onClick={onManageCoupons} 
              style={{
                background:'#4caf50',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'12px 24px',
                fontWeight:600,
                fontSize:'1em',
                cursor:'pointer',
                boxShadow:'0 2px 8px rgba(76, 175, 80, 0.3)',
                transition:'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#45a049'}
              onMouseOut={(e) => e.target.style.background = '#4caf50'}
            >
              Manage Coupons
            </button>
          </div>
          
          {!loadingCoupons && coupons.length > 0 && (
            <div style={{marginTop:16, display:'flex', gap:'12px', flexWrap:'wrap'}}>
              {coupons.slice(0, 5).map(coupon => (
                <div 
                  key={coupon.id} 
                  style={{
                    background: coupon.isActive ? '#e8f5e9' : '#f5f5f5',
                    border: `2px solid ${coupon.isActive ? '#4caf50' : '#ccc'}`,
                    borderRadius:8,
                    padding:'8px 12px',
                    fontSize:'0.85rem'
                  }}
                >
                  <strong style={{color: coupon.isActive ? '#2e7d32' : '#666'}}>{coupon.code}</strong>
                  {' - '}
                  <span style={{color:'#666'}}>
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off
                  </span>
                </div>
              ))}
              {coupons.length > 5 && (
                <div style={{
                  background:'#f0f0f0',
                  borderRadius:8,
                  padding:'8px 12px',
                  fontSize:'0.85rem',
                  color:'#666',
                  fontWeight:600
                }}>
                  +{coupons.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
        
        <div style={{marginBottom:18}}>
          <button onClick={onCreateProduct} style={{background:'#b9805a',color:'#fff',border:'none',borderRadius:6,padding:'12px 24px',fontWeight:600,letterSpacing:1,cursor:'pointer',fontSize:'1em',boxShadow:'0 2px 8px #bcae9e22'}}>
            + Create New Product
          </button>
        </div>
        {products.length === 0 ? (
          <p style={{color:'#a67c52'}}>No products found.</p>
        ) : (
          <div className="admin-dashboard-table-wrapper" style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',boxShadow:'0 4px 24px #bcae9e22',borderRadius:12,overflow:'hidden'}}>
              <thead style={{background:'#f7f3ef',color:'#4a3c35'}}>
                <tr style={{fontWeight:700,fontSize:'1.08em'}}>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Title</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Brand</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Price (₹)</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Original Price (₹)</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Stock</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Description</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Image</th>
                  <th style={{padding:'14px 10px',borderBottom:'2px solid #e0c9b6'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{borderBottom:'1px solid #f0e6dd'}}>
                    <td style={{padding:'10px 8px'}}>
                      <input value={p.name} onChange={e=>handleChange(p.id,'name',e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6,fontSize:'1em'}} />
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <input value={p.brand} onChange={e=>handleChange(p.id,'brand',e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6,fontSize:'1em'}} />
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <input type="number" value={p.price} onChange={e=>handleChange(p.id,'price',e.target.value)} style={{width:'90px',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6}} />
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <input type="number" value={p.originalPrice} onChange={e=>handleChange(p.id,'originalPrice',e.target.value)} style={{width:'90px',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6}} />
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <input type="number" value={p.stock ?? 0} onChange={e=>handleChange(p.id,'stock',e.target.value)} style={{width:'70px',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6}} />
                    </td>
                    <td style={{padding:'10px 8px',minWidth:180}}>
                      <textarea value={p.description} onChange={e=>handleChange(p.id,'description',e.target.value)} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6,fontSize:'1em',minHeight:40}} />
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <input value={p.mainImage} onChange={e=>handleChange(p.id,'mainImage',e.target.value)} style={{width:'120px',padding:'6px 8px',border:'1.5px solid #bcae9e',borderRadius:6}} />
                      <div style={{marginTop:6}}>
                        <ProductImage src={p.mainImage} alt={p.name} />
                      </div>
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <button onClick={()=>handleSave(p.id)} disabled={savingId===p.id} style={{background:'#4a3c35',color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontWeight:600,letterSpacing:1,cursor:'pointer',fontSize:'0.95em',boxShadow:'0 2px 8px #bcae9e22'}}>
                          {savingId===p.id ? 'Saving...' : 'Save'}
                        </button>
                        <button title="Edit full details" onClick={()=>onEditProduct && onEditProduct(p)} style={{background:'#b9805a',color:'#fff',border:'none',borderRadius:'50%',width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px #bcae9e33'}}>
                          <FaEdit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}