import React, { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './EditProduct.css';

export default function EditProduct({ product, onClose, onSaved }) {
  // Defaults matching current ProductLanding content
  const DEFAULT_HOW_STEPS = [
    'Add 2 gms of Coffee Powder to 180 ml of Hot/Cold Milk.',
    'Add sugar as per your taste.',
    'Blend for Frothy Cold Coffee / Stir for Delicious Hot Coffee!',
    'Voila! Your Instant Coffee is ready.'
  ];
  const DEFAULT_INSIDE = [
    '100% pure instant coffee.',
    "But that's only part of the story.",
    'Our coffee is made from the finest Arabica and Robusta beans, carefully selected from high-altitude farms. Each bean is harvested with care and roasted to a perfect medium-dark, bringing out its rich, complex flavor.',
    'We then use a specialized process to crystallize the brew, preserving the full aroma and taste of a freshly made cup. This ensures that every granule in this jar holds the promise of an exceptional coffee experience.',
    "So, when you open this jar, you're not just getting instant coffee. You're getting the result of passion and dedication, transforming simple beans into a moment of pure bliss. It’s a cup made with love, ready for you to enjoy."
  ].join('\n');
  const DEFAULT_FAQS = [
    {
      question: 'What is the shelf life of your instant coffee?',
      answer: 'Our instant coffee has a best-by date of 24 months from the date of manufacture. However, for the freshest and most vibrant flavor, we recommend enjoying it within 12-18 months of opening, as long as it is stored in a cool, dry place with the lid tightly sealed. Proper storage is key to preserving the rich aroma and taste of every granule.'
    },
    {
      question: 'Can I add the coffee powder to hot/cold milk or water?',
      answer: "Absolutely! Our instant coffee is crafted to be versatile and dissolves beautifully in both hot and cold liquids. For a Hot Coffee: Simply add 1-2 teaspoons of coffee powder to a cup of hot water or hot milk, stir until dissolved, and enjoy. For a Cold Coffee: First, dissolve the coffee powder in a small amount of hot water to create a concentrate. Then, add cold water or chilled milk and ice. Stir vigorously or blend for a perfect, refreshing iced coffee. Feel free to experiment with the ratios to create your perfect cup, whether it's a bold black coffee or a creamy latte."
    },
    {
      question: 'Which coffee beans are used to make Bold & Brew Instant Coffee?',
      answer: 'We believe in using the best ingredients to create an exceptional product. Our instant coffee is a carefully balanced blend of premium Arabica and Robusta beans. The Arabica beans provide a smooth, aromatic, and nuanced flavor profile, while the Robusta beans add a rich body and a delightful boldness to the blend. This combination ensures a well-rounded and satisfying coffee experience with every sip.'
    }
  ];
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    mainImage: '',
    price: '',
    originalPrice: '',
    stock: '',
    images: ['', '', '', '', '', '', ''],
    isBestSeller: false,
    landingHowSteps: ['','','',''],
    landingInside: '',
    landingFaqs: [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' }
    ]
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
      images: padded,
      isBestSeller: product.isBestSeller === true,
      landingHowSteps: Array.isArray(product.landingHowSteps) && product.landingHowSteps.length
        ? [...product.landingHowSteps].slice(0,4).concat(Array(Math.max(0,4 - product.landingHowSteps.length)).fill(''))
        : [...DEFAULT_HOW_STEPS],
      landingInside: (product.landingInside && product.landingInside.trim() !== '') ? product.landingInside : DEFAULT_INSIDE,
      landingFaqs: Array.isArray(product.landingFaqs) && product.landingFaqs.length
        ? [...product.landingFaqs].slice(0,3).map(f => ({
            question: f.question || '',
            answer: f.answer || ''
          }))
        : DEFAULT_FAQS.map(f => ({ question: f.question, answer: f.answer }))
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
    // Optional fields: ProductLanding content is not required
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
        isBestSeller: formData.isBestSeller,
        landingHowSteps: formData.landingHowSteps.map(s => (s || '').trim()).filter(s => s !== ''),
        landingInside: (formData.landingInside || '').trim(),
        landingFaqs: formData.landingFaqs
          .map(f => ({
            question: (f.question || '').trim(),
            answer: (f.answer || '').trim()
          }))
          .filter(f => f.question !== '' || f.answer !== ''),
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
            <label>Best Seller Status</label>
            <select 
              value={formData.isBestSeller ? 'yes' : 'no'}
              onChange={(e) => setFormData(prev => ({ ...prev, isBestSeller: e.target.value === 'yes' }))}
              style={{ 
                width: '100%', 
                padding: '0.6rem', 
                border: '2px solid #d9c9bb', 
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#4e342e',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="no">No - Regular Product</option>
              <option value="yes">Yes - Show in Best Seller Section</option>
            </select>
            <p style={{ fontSize: '0.85rem', color: '#6d4c41', marginTop: '0.5rem' }}>
              {formData.isBestSeller 
                ? '✓ This product will appear in the Best Seller section on the homepage' 
                : 'This product will not appear in the Best Seller section'}
            </p>
          </div>
          {/* ProductLanding Content Editing */}
          <div className="edit-product-section">
            <h4>Product Landing: How To Use (up to 4 steps)</h4>
            {formData.landingHowSteps.map((step, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <input
                  value={step}
                  placeholder={`Step ${idx + 1} text`}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => {
                      const arr = [...prev.landingHowSteps];
                      arr[idx] = val;
                      return { ...prev, landingHowSteps: arr };
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="edit-product-section">
            <h4>Product Landing: What's Inside (description)</h4>
            <textarea
              value={formData.landingInside}
              placeholder="Rich description of what's inside"
              onChange={e => setFormData(prev => ({ ...prev, landingInside: e.target.value }))}
            />
          </div>
          <div className="edit-product-section">
            <h4>Product Landing: FAQs (up to 3)</h4>
            {formData.landingFaqs.map((faq, idx) => (
              <div key={idx} style={{ border: '1px solid #d9c9bb', padding: '0.6rem', borderRadius: 8, marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem' }}>Question {idx + 1}</label>
                <input
                  value={faq.question}
                  placeholder={`FAQ ${idx + 1} question`}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => {
                      const arr = prev.landingFaqs.map((f, i) => i === idx ? { ...f, question: val } : f);
                      return { ...prev, landingFaqs: arr };
                    });
                  }}
                />
                <label style={{ fontSize: '0.9rem', marginTop: '0.4rem', display: 'block' }}>Answer {idx + 1}</label>
                <textarea
                  value={faq.answer}
                  placeholder={`FAQ ${idx + 1} answer`}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => {
                      const arr = prev.landingFaqs.map((f, i) => i === idx ? { ...f, answer: val } : f);
                      return { ...prev, landingFaqs: arr };
                    });
                  }}
                />
              </div>
            ))}
            <p style={{ fontSize: '0.85rem', color: '#6d4c41' }}>Empty items are ignored when saving.</p>
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
