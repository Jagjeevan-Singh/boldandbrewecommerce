import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './CreateProduct.css';

export default function CreateProduct({ onClose }) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleImageBlur = (index) => {
    // Validate image URL
    const url = formData.images[index];
    if (url && !url.startsWith('http')) {
      setError(`Image URL ${index + 1} must start with http:// or https://`);
      return;
    }
    setError('');
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages[index] = '';
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.brand.trim()) return 'Brand is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.mainImage.trim()) return 'Main image URL is required';
    if (!formData.mainImage.startsWith('http')) return 'Main image must be a valid URL';
    if (!formData.price || parseFloat(formData.price) <= 0) return 'Valid price is required';
    if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) return 'Valid original price is required';
    if (!formData.stock || parseInt(formData.stock) < 0) return 'Valid stock quantity is required';

    // Validate non-empty images start with http
    const nonEmptyImages = formData.images.filter(img => img.trim());
    for (let img of nonEmptyImages) {
      if (!img.startsWith('http')) {
        return 'All image URLs must be valid and start with http:// or https://';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // Filter out empty image URLs
      const filteredImages = formData.images.filter(img => img.trim());

      const productData = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        description: formData.description.trim(),
        mainImage: formData.mainImage.trim(),
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice),
        stock: parseInt(formData.stock),
        images: filteredImages,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      setSuccess(`Product created successfully! ID: ${docRef.id}`);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: '',
          brand: '',
          description: '',
          mainImage: '',
          price: '',
          originalPrice: '',
          stock: '',
          images: ['', '', '', '', '', '', '']
        });
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to create product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-product-overlay">
      <div className="create-product-container">
        <div className="create-product-header">
          <h1>Create New Product</h1>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="create-product-form">
          {/* Basic Info Section */}
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
              />
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Enter brand name"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows="4"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="form-section">
            <h2>Pricing & Stock</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Original Price (₹) *</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Sale Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="form-section">
            <h2>Product Images</h2>
            
            <div className="form-group">
              <label>Main Image URL *</label>
              <input
                type="url"
                name="mainImage"
                value={formData.mainImage}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              {formData.mainImage && (
                <div className="image-preview">
                  <img src={formData.mainImage} alt="Main" onError={e => e.target.style.display = 'none'} />
                </div>
              )}
            </div>

            <div className="images-section">
              <h3>Additional Images (up to 7)</h3>
              <div className="images-grid">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="image-input-group">
                    <div className="image-input-header">
                      <label>Image {index + 1}</label>
                      {imageUrl && (
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      onBlur={() => handleImageBlur(index)}
                      placeholder="https://example.com/image.jpg"
                    />
                    {imageUrl && (
                      <div className="image-preview-small">
                        <img src={imageUrl} alt={`Product ${index + 1}`} onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="form-hint">Add up to 7 additional product images. All images must be from valid URLs (http:// or https://)</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
