import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from '../server/routes/authRoutes.js';
import userRoutes from '../server/routes/userRoutes.js';
import planRoutes from '../server/src/routes/planRoutes.js';
import exerciseRoutes from '../server/src/routes/exerciseRoutes.js';
import authMiddleware from '../server/middleware/authMiddleware.js';
import { initDB } from '../server/db.js';

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

initDB().catch(console.error);

app.use('/auth', authRoutes);
app.use('/user', authMiddleware, userRoutes);
app.use('/api', planRoutes);
app.use('/api/exercise', exerciseRoutes);

app.get('/check-auth', authMiddleware, (req, res) => {
  return res.json({ loggedIn: true });
});

export default app;
