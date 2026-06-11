import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_KEY = process.env.X_INTERNAL_KEY || 'your_jwt_secret_key';

export const aiClient = axios.create({
    baseURL: AI_SERVICE_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_KEY
    },
    timeout: 120000 // 2 minutes — AI generation can be slow
});

/**
 * Calls the AI microservice for a NEW user (no previous plan history).
 * @param {Object} fitnessData - User's base fitness profile
 */
export const generateNewUserPlan = async (fitnessData) => {
    try {
        const response = await aiClient.post('/generate-plan/new', fitnessData);
        return response.data;
    } catch (error) {
        console.error('[AI Client] Error calling /generate-plan/new:', error.message);
        if (error.response) {
            throw new Error(`AI Service Error: ${error.response.data?.detail || error.message}`);
        }
        throw new Error('Failed to connect to AI microservice.');
    }
};

/**
 * Calls the AI microservice for an EXISTING user (has previous plans).
 * Sends past plan context so the AI generates a progressive, non-repetitive plan.
 *
 * @param {Object} fitnessData - User base fitness profile
 * @param {string|null} past1WeekPlan  - JSON string of the most recent 1-week plan (preferred)
 * @param {string|null} past2WeeksPlan - JSON string of the past 2-week plan (fallback)
 */
export const generateExistingUserPlan = async (fitnessData, past1WeekPlan, past2WeeksPlan) => {
    try {
        const payload = {
            ...fitnessData,
            ...(past1WeekPlan   ? { past_1_week_plan: past1WeekPlan }   : {}),
            ...(past2WeeksPlan  ? { past_2_weeks_plan: past2WeeksPlan } : {})
        };

        const response = await aiClient.post('/generate-plan/existing', payload);
        return response.data;
    } catch (error) {
        console.error('[AI Client] Error calling /generate-plan/existing:', error.message);
        if (error.response) {
            throw new Error(`AI Service Error: ${error.response.data?.detail || error.message}`);
        }
        throw new Error('Failed to connect to AI microservice.');
    }
};
