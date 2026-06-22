const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Import server routes (you may need to adjust if they are ESM)
// For Vercel serverless, we'll proxy or re-export key routes
const app = express();

// Load env
dotenv.config();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// For now, basic health check
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running on Vercel' });
});

// TODO: Properly mount your server routes here for serverless
// This is a minimal handler for now

module.exports = app;