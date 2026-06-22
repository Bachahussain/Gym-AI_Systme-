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
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Vercel', timestamp: new Date().toISOString() });
});

// Import and use routes dynamically
try {
  const { default: authRoutes } = await import('../server/routes/authRoutes.js');
  const { default: planRoutes } = await import('../server/routes/planRoutes.js');
  const { default: exerciseRoutes } = await import('../server/routes/exerciseRoutes.js');
  const { default: userRoutes } = await import('../server/routes/userRoutes.js');

  app.use('/api/auth', authRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/exercises', exerciseRoutes);
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('Error loading routes:', error);
}

// Catch-all for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;