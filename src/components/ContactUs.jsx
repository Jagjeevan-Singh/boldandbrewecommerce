// ContactUs.jsx
import React, { useState } from 'react';
import './ContactUs.css';

const ContactUs = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://formsubmit.co/ajax/boldandbrew@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          _captcha: 'false',
          _template: 'box',
          _subject: 'New Contact Message - Bold & Brew'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Common cause: email not verified with FormSubmit
        const msg = data?.message || 'Submission failed. If this is the first submission, verify the recipient email in FormSubmit (check spam).';
        throw new Error(msg);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong sending your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <h1 className="contact-title">Connect With The Essence of Excellence!</h1>
      <p className="contact-description">
        At BOLD & BREW, every conversation is brewed with purpose. Whether you seek to inquire,
        collaborate, or simply share your coffee tale, our doors are always open! Reach out to us and
        become a part of a story steeped in richness, refinement, and regal warmth.
      </p>

      {!submitted ? (
        <form className="contact-form" onSubmit={handleSubmit}>
          {/* Hidden defaults preserved for parity with non-AJAX mode */}
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="box" />
          <input type="hidden" name="_autoresponse" value="Thanks for contacting BOLD & BREW! We’ll get back to you soon." />
          <input type="hidden" name="_subject" value="New Contact Message - Bold & Brew" />

          <div className='form-group-1-parent'>
            <div className="form-group-1">
              <label htmlFor="name" id='name'>Your Name</label>
              <input name="name" type="text" id="name" placeholder="Your Full Name" required value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group-1">
              <label htmlFor="phone">Your Phone</label>
              <input name="phone" type="tel" placeholder='+91 - xxxx-xxxx-xx' id="phone" required value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group-2">
            <label htmlFor="email">Your Email</label>
            <input name="email" type="email" id="email" placeholder="you@example.com" required value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group-2">
            <label htmlFor="message">Message</label>
            <textarea name="message" id="message" placeholder="Tell us what's on your mind..." rows="6" required value={form.message} onChange={handleChange}></textarea>
          </div>
          {error && (
            <div className="alert-error" style={{ color: '#b71c1c', background:'#ffebee', border:'1px solid #ffcdd2', padding:'10px', borderRadius:8 }}>
              {error}
            </div>
          )}
          <button type="submit" className="contact-button" disabled={loading}>{loading ? 'Sending…' : 'Send Message'}</button>
        </form>
      ) : (
        <div className="thank-you-message">
          <h2>Thank you!</h2>
          <p>Your message has been sent. We'll get back to you soon.</p>
          <p style={{marginTop:'0.5rem', fontSize:'0.95rem'}}>If you don’t see a confirmation email, please check your spam folder. For the first ever submission, FormSubmit sends a verification email to boldandbrew@gmail.com — that must be confirmed once to start receiving messages.</p>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
