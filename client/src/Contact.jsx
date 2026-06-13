import React from 'react';
import ContactForm from './components/contact/ContactForm';
import ContactInfo from './components/contact/ContactInfo';

function Contact() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 to-purple-800 text-white">
      <div className="container">
        <div className="bg-purple-900 bg-opacity-60 backdrop-blur-lg border border-purple-700 shadow-lg rounded-xl w-full max-w-lg mx-auto p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">📬 Contact Us</h1>
            <p className="text-sm text-gray-300 mt-1">
              Have questions or feedback? We'd love to hear from you!
            </p>
          </div>

          <ContactForm />
          <ContactInfo />
        </div>
      </div>
    </section>
  );
}

export default Contact;