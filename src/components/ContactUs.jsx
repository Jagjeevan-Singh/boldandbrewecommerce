// ContactUs.jsx
import React, { useState } from 'react';
import './ContactUs.css';

const ContactUs = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="contact-container">
      <h1 className="contact-title">Connect With The Essence of Excellence!</h1>
      <p className="contact-description">
        At BOLD & BREW, every conversation is brewed with purpose. Whether you seek to inquire,
        collaborate, or simply share your coffee tale, our doors are always open! Reach out to us and
        become a part of a story steeped in richness, refinement, and regal warmth.
      </p>

      {!submitted ? (
        <form
          className="contact-form"
          action="https://formsubmit.co/boldandbrew@gmail.com"
          method="POST"
          onSubmit={() => setSubmitted(true)}
        >
          {/* Hidden inputs to configure Formsubmit */}
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="box" />
          <input type="hidden" name="_autoresponse" value="Thanks for contacting BOLD & BREW! We’ll get back to you soon." />
          
          <div className='form-group-1-parent'>
            <div className="form-group-1">
              <label htmlFor="name" id='name'>Your Name</label>
              <input name="name" type="text" id="name" placeholder="Your Full Name" required />
            </div>
            <div className="form-group-1">
              <label htmlFor="email" id='phone'>Your Phone</label>
              <input name="email" type="tel" placeholder='+91 - xxxx-xxxx-xx' id="email" required />
            </div>
          </div>
          <div className="form-group-2">
            <label htmlFor="email">Your Email</label>
            <input name="email" type="email" id="email" placeholder="you@example.com" required />
          </div>
          <div className="form-group-2">
            <label htmlFor="message">Message</label>
            <textarea name="message" id="message" placeholder="Tell us what's on your mind..." rows="6" required></textarea>
          </div>
          <button type="submit" className="contact-button">Send Message</button>
        </form>
      ) : (
        <div className="thank-you-message">
          <h2>Thank you!</h2>
          <p>Your message has been sent. We'll get back to you soon.</p>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
