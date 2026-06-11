import express from 'express';
import { generateCompletePlan, getMyPlans, checkPlanEligibility } from '../controllers/planController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// All plan routes require authentication
router.use(authMiddleware);

// Check if user is eligible to generate a new plan (7-day cooldown status)
// Frontend calls this before opening the plan generation modal
router.get('/plan/eligibility', checkPlanEligibility);

// Generate a new AI plan (handles both new & returning users internally)
router.post('/generate-complete-plan', generateCompletePlan);

// Get the user's latest workout + diet plans
router.get('/my-plans', getMyPlans);

export default router;
