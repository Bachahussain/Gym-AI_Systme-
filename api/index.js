// Vercel serverless entry point for the backend
// This proxies or runs the main logic from server/

const express = require('express');
const serverApp = require('../server/index.js'); // Try to load if possible, but may need adjustments

// For full compatibility, we should use the compiled version or re-export routes

module.exports = (req, res) => {
  // Simple fallback for now
  res.status(200).json({ message: 'Vercel backend endpoint active. Check logs for more.' });
};