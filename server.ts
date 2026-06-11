import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Import existing backend routes
import authRoutes from "./server/routes/authRoutes.js";
import userRoutes from "./server/routes/userRoutes.js";
import planRoutes from "./server/src/routes/planRoutes.js";
import exerciseRoutes from "./server/src/routes/exerciseRoutes.js";

import authMiddleware from "./server/middleware/authMiddleware.js";
import { initDB } from "./server/db.js";

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
    origin: true,
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
