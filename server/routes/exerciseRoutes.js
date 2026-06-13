import express from 'express';
import { getExerciseGif } from '../controllers/exerciseController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Optionally secure the route
router.use(authMiddleware);

// GET /api/exercise/gif?name=Dumbbell%20Curl
router.get('/gif', getExerciseGif);

export default router;
