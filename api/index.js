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
  res.json({ 
    status: 'ok', 
    message: 'Backend is running on Vercel', 
    timestamp: new Date().toISOString() 
  });
});

// Proper middleware for Vercel serverless
app.use('/api/auth', async (req, res) => {
  try {
    const { default: authRoutes } = await import('../server/routes/authRoutes.js');
    const router = express.Router();
    router.use(authRoutes);
    return router(req, res);
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch all for other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found', path: req.path });
});

export default app;