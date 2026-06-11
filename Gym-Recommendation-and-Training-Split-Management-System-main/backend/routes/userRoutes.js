import express from 'express';
const router = express.Router();

import profileSetup from "../controllers/userControllers/profile-setup.js";
import {
	addProgressEntry,
	completeWorkoutExercise,
	completeWorkoutDay,
	getAccountSettings,
	getProfile,
	getProgressHistory,
	getUserStats,
	getWorkoutProgress,
	updateAccountSettings,
	upgradeToPro,
} from "../controllers/userControllers/userStatsController.js";

router.post('/profile-setup', profileSetup);
router.get('/stats', getUserStats);
router.get('/stats/history', getProgressHistory);
router.post('/stats/progress', addProgressEntry);
router.get('/workout-progress', getWorkoutProgress);
router.post('/complete-exercise', completeWorkoutExercise);
router.post('/complete-workout', completeWorkoutDay);
router.get('/me', getProfile);
router.get('/account-settings', getAccountSettings);
router.put('/account-settings', updateAccountSettings);
router.post('/upgrade', upgradeToPro);

export default router;