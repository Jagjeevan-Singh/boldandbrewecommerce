import React, { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './EditProduct.css';

export default function EditProduct({ product, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    mainImage: '',
    price: '',
    originalPrice: '',
    stock: '',
    images: ['', '', '', '', '', '', '']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!product) return;
    const imgs = Array.isArray(product.images) ? product.images.filter(i => i && String(i).trim() !== '') : [];
    const padded = [...imgs];
    while (padded.length < 7) padded.push('');
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      mainImage: product.mainImage || '',
      price: String(product.price ?? ''),
      originalPrice: String(product.originalPrice ?? ''),
      stock: String(product.stock ?? ''),
      images: padded
    });
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index, value) => {
    setFormData(prev => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.brand.trim()) return 'Brand is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.mainImage.trim()) return 'Main image URL is required';
    if (!formData.price || isNaN(parseFloat(formData.price))) return 'Valid price required';
    if (!formData.originalPrice || isNaN(parseFloat(formData.originalPrice))) return 'Valid original price required';
    if (!formData.stock || isNaN(parseInt(formData.stock))) return 'Valid stock required';
    if (!formData.mainImage.startsWith('http')) return 'Main image must start with http/https';
    for (let i = 0; i < formData.images.length; i++) {
      const url = formData.images[i];
      if (url && !url.startsWith('http')) return `Image ${i + 1} must start with http/https`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const filteredImages = formData.images.filter(img => img && img.trim() !== '');
      const updateData = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        description: formData.description.trim(),
        mainImage: formData.mainImage.trim(),
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice),
        stock: parseInt(formData.stock),
        images: filteredImages,
        updatedAt: serverTimestamp()
      };
      await updateDoc(doc(db, 'products', product.id), updateData);
      setSuccess('Product updated successfully');
      if (onSaved) onSaved(updateData);
      setTimeout(() => onClose && onClose(), 1200);
    } catch (e2) {
      setError(e2.message || 'Error updating product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteDoc(doc(db, 'products', product.id));
      // Broadcast deletion so AdminDashboard can update immediately
      window.dispatchEvent(new CustomEvent('productDeleted', { detail: { id: product.id } }));
      setSuccess('Product deleted');
      setTimeout(() => onClose && onClose(), 600);
    } catch (e2) {
      setError(e2.message || 'Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-product-overlay">
      <div className="edit-product-modal">
        <div className="edit-product-header">
          <h2>Edit Product</h2>
          <button className="edit-product-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="edit-product-form">
          {error && <div className="edit-product-alert error">{error}</div>}
          {success && <div className="edit-product-alert success">{success}</div>}
          <div className="edit-product-section">
            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="edit-product-section">
            <label>Brand</label>
            <input name="brand" value={formData.brand} onChange={handleInputChange} />
          </div>
            <div className="edit-product-section">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} />
            </div>
          <div className="edit-product-grid-3">
            <div className="edit-product-section">
              <label>Price (₹)</label>
              <input name="price" type="number" value={formData.price} onChange={handleInputChange} />
            </div>
            <div className="edit-product-section">
              <label>Original Price (₹)</label>
              <input name="originalPrice" type="number" value={formData.originalPrice} onChange={handleInputChange} />
            </div>
            <div className="edit-product-section">
              <label>Stock</label>
              <input name="stock" type="number" value={formData.stock} onChange={handleInputChange} />
            </div>
          </div>
          <div className="edit-product-section">
            <label>Main Image URL</label>
            <input name="mainImage" value={formData.mainImage} onChange={handleInputChange} />
            {formData.mainImage && <img src={formData.mainImage} alt="Main" className="edit-product-preview" onError={e=>e.target.style.display='none'} />}
          </div>
          <div className="edit-product-images-wrapper">
            <h4>Additional Images (max 7)</h4>
            <div className="edit-product-images-grid">
              {formData.images.map((img, idx) => (
                <div key={idx} className="edit-product-image-item">
                  <input
                    value={img}
                    placeholder={`Image ${idx + 1} URL`}
                    onChange={e => handleImageChange(idx, e.target.value)}
                  />
                  {img && <img src={img} alt={"Preview " + idx} className="edit-product-preview" onError={e=>e.target.style.display='none'} />}
                </div>
              ))}
            </div>
          </div>
          <div className="edit-product-actions">
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="button" className="danger" onClick={handleDelete} disabled={loading}>{loading ? 'Working...' : 'Delete Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
