// Proper Vercel serverless handler for the entire backend
// This loads the Express app from server/index.js (adapted for serverless)

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import controllers and routes directly for serverless compatibility
dotenv.config();

// For Vercel, we create a new app instance since TS needs compilation or we use JS
// Better to use dynamic require or direct controllers

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Import routes (using require since Vercel uses CommonJS)
let authRoutes, planRoutes, exerciseRoutes;
try {
  authRoutes = require('./server/routes/authRoutes.js');
  planRoutes = require('./server/routes/planRoutes.js');
  exerciseRoutes = require('./server/routes/exerciseRoutes.js');
} catch (e) {
  console.error('Route load error:', e);
}

// Mount routes
if (authRoutes) app.use('/auth', authRoutes);
if (planRoutes) app.use('/api', planRoutes);
if (exerciseRoutes) app.use('/api/exercise', exerciseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Vercel' });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  // Let Express handle the request
  return app(req, res);
};
