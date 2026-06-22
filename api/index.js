import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.VITE_API_URL || '*',
  credentials: true
}));
app.use(express.json());

// Import routes using dynamic import for Vercel
let routes;

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Load routes dynamically
app.use('/api', async (req, res, next) => {
  if (!routes) {
    try {
      const { default: authRoutes } = await import('../server/routes/authRoutes.js');
      const { default: exerciseRoutes } = await import('../server/routes/exerciseRoutes.js');
      // Add other routes
      routes = express.Router();
      routes.use('/auth', authRoutes);
      routes.use('/exercises', exerciseRoutes);
      // Add more
    } catch (e) {
      console.error('Route load error:', e);
    }
  }
  next();
});

export default app;
