import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Import existing backend routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";

import authMiddleware from "./middleware/authMiddleware.js";
import { initDB } from "./db.js";

dotenv.config();

async function startServer() {
  // Initialize Database
  try {
    await initDB();
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }

  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any vercel.app, replit.app, replit.dev, or localhost origin
      const allowed = [
        /\.vercel\.app$/,
        /\.replit\.app$/,
        /\.replit\.dev$/,
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
      ];
      if (allowed.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for now during development
    },
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes
  app.use('/auth', authRoutes);
  app.use('/user', authMiddleware, userRoutes);
  app.use('/api', planRoutes);
  app.use('/api/exercise', exerciseRoutes);

  app.get("/check-auth", authMiddleware, (req, res) => {
    return res.json({ loggedIn: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
