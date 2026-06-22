const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('../server/routes/authRoutes');
const exerciseRoutes = require('../server/routes/exerciseRoutes');
const planRoutes = require('../server/routes/planRoutes');
const userRoutes = require('../server/routes/userRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Vercel' });
});

// Vercel serverless handler
module.exports = app;
