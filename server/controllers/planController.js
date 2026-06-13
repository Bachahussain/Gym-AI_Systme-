import pool from '../db.js';
import { generateAiPlan, calculateFitnessMetrics } from '../services/aiService.js';
import { addProgressEntryIfChanged } from '../services/progressTrackingService.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: calculate days since last plan
// ─────────────────────────────────────────────────────────────────────────────
function daysSince(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/plan/eligibility
// Returns whether the user can generate a new plan and how many days remain.
// Frontend calls this before opening the plan modal.
// ─────────────────────────────────────────────────────────────────────────────
export const checkPlanEligibility = async (req, res) => {
    try {
        const userId = req.user.id;

        const [historyRows] = await pool.query(
            'SELECT created_at FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        // No plans yet → new user, always eligible
        return res.status(200).json({
            canGenerate: true,
            isNewUser: false,
            daysRemaining: 0,
            message: 'You can generate a new plan at will!'
        });

    } catch (error) {
        console.error('[checkPlanEligibility] Error:', error);
        res.status(500).json({ message: 'Internal server error while checking eligibility' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate-complete-plan
// Generates a new AI plan for the user.
// - New users  → calls /generate-plan/new on the AI service
// - Returning users → enforces 7-day cooldown, calls /generate-plan/existing
//   with past plan context (prefers last 1-week plan, falls back to 2-week)
// ─────────────────────────────────────────────────────────────────────────────
export const generateCompletePlan = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch user profile
        const [profileRows] = await pool.query(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [userId]
        );
        if (profileRows.length === 0) {
            return res.status(404).json({
                message: 'User profile not found. Please complete profile setup first.'
            });
        }

        let profile = profileRows[0];

        // 2. Check PRO status
        if (!profile.is_pro) {
            return res.status(403).json({
                message: 'AI Plan Generation is a premium feature. Please upgrade to PRO to unlock.',
                is_pro: false
            });
        }

        // 3. Apply optional runtime weight/workout_days/goal override without losing history.
        const { weight: newWeight, workout_days: newWorkoutDays, goal: newGoal } = req.body;
        const parsedWeight = newWeight !== undefined && newWeight !== null && newWeight !== ''
            ? parseFloat(newWeight)
            : null;
        const parsedWorkoutDays = newWorkoutDays !== undefined && newWorkoutDays !== null && newWorkoutDays !== ''
            ? parseInt(newWorkoutDays, 10)
            : null;
        // Map display name → DB enum if needed
        const goalAliasMap = { 'Fat Loss': 'weight_loss', 'Bodybuilding': 'muscle_gain', 'Athletic Performance': 'maintenance' };
        const parsedGoal = newGoal ? (goalAliasMap[newGoal] ?? newGoal) : null;

        profile = {
            ...profile,
            weight: parsedWeight ?? profile.weight,
            workout_days: parsedWorkoutDays ?? profile.workout_days,
            goal: parsedGoal ?? profile.goal,
        };

        // 4. Fetch plan history to determine new vs existing user + gather context
        //    - past_1_week: most recent plan (created within last 7-14 days)
        //    - past_2_weeks: plan before that (for broader context)
        const [historyRows] = await pool.query(
            `SELECT plan_json, created_at 
             FROM workout_plans 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 2`,
            [userId]
        );

        const isNewUser = historyRows.length === 0;

        // 5. Cooldown removed as requested by the user, allowing recalibration on will.

        // 6. Build base fitness payload (shared for both new and existing)
        const fitnessData = {
            age: profile.age,
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            goal: profile.goal,
            activity_level: profile.activity_level,
            dietary_preference: profile.dietary_preference || 'none',
            medical_conditions: profile.medical_conditions || 'none',
            workout_days: profile.workout_days || 3
        };

        // 7. Generate plan using internal AI service
        console.log(`[Plan] Generating plan for user ${userId} (New: ${isNewUser})`);
        
        const past1WeekPlan = historyRows[0] ? JSON.stringify(historyRows[0].plan_json) : null;
        const past2WeeksPlan = historyRows[1] ? JSON.stringify(historyRows[1].plan_json) : null;

        const aiInput = {
            ...fitnessData,
            past_1_week_plan: past1WeekPlan,
            past_2_weeks_plan: past2WeeksPlan
        };

        const metrics = calculateFitnessMetrics(aiInput);
        aiResponse = await generateAiPlan(aiInput, metrics);

        if (aiResponse.error) {
            throw new Error(aiResponse.error);
        }

        // Add metrics to aiResponse for downstream compatibility
        aiResponse = { ...aiResponse, ...metrics };

        // 8. Enforce correct day count (safety net regardless of AI output)
        const requestedDays = fitnessData.workout_days;
        const workoutPlan = (aiResponse.weekly_workout_plan || []).slice(0, requestedDays);
        const dietPlan = (aiResponse.weekly_diet_plan || []).slice(0, 7);

        if ((aiResponse.weekly_workout_plan || []).length !== requestedDays) {
            console.warn(
                `[Plan] AI returned ${(aiResponse.weekly_workout_plan || []).length} workout days, ` +
                `expected ${requestedDays}. Trimmed to ${workoutPlan.length}.`
            );
        }

        // 9. Save plans to DB in a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const today = new Date();
            const weekStartDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - today.getDay() + 1
            ).toISOString().split('T')[0];

            // Determine plan version for this week
            const [versionRows] = await connection.query(
                'SELECT MAX(plan_version) as maxVersion FROM workout_plans WHERE user_id = ? AND week_start_date = ?',
                [userId, weekStartDate]
            );
            const planVersion = (versionRows[0].maxVersion || 0) + 1;

            // Save workout plan
            await connection.query(
                `INSERT INTO workout_plans (user_id, week_start_date, plan_version, plan_json) VALUES (?, ?, ?, ?)`,
                [userId, weekStartDate, planVersion, JSON.stringify(workoutPlan)]
            );

            // Save diet plan
            await connection.query(
                `INSERT INTO diet_plans (user_id, week_start_date, plan_version, plan_json) VALUES (?, ?, ?, ?)`,
                [userId, weekStartDate, planVersion, JSON.stringify(dietPlan)]
            );

            // Sync calculated metrics back to user profile
            await connection.query(
                `UPDATE user_profiles
                 SET weight = ?, workout_days = ?, bmi = ?, bmi_category = ?, bmr = ?, tdee = ?
                 WHERE user_id = ?`,
                [
                    profile.weight,
                    profile.workout_days,
                    aiResponse.bmi,
                    aiResponse.bmi_category,
                    aiResponse.bmr,
                    aiResponse.tdee,
                    userId,
                ]
            );

            if (parsedWeight !== null) {
                await addProgressEntryIfChanged(connection, { userId, weight: parsedWeight });
            }

            await connection.commit();
            connection.release();

            // Reset this week's workout progress so the new plan starts clean
            await pool.query(
                'DELETE FROM workout_logs WHERE user_id = ? AND week_start_date = ?',
                [userId, weekStartDate]
            );
            await pool.query(
                'DELETE FROM workout_exercise_logs WHERE user_id = ? AND week_start_date = ?',
                [userId, weekStartDate]
            );

            return res.status(200).json({
                message: 'Plan generated successfully',
                is_new_user: isNewUser,
                metrics: {
                    bmi: aiResponse.bmi,
                    bmiCategory: aiResponse.bmi_category,
                    bmr: aiResponse.bmr,
                    tdee: aiResponse.tdee,
                    recommendedCalories: aiResponse.recommended_calories
                },
                workoutPlan,
                dietPlan
            });

        } catch (dbError) {
            await connection.rollback();
            connection.release();
            console.error('[Plan] DB error during plan save:', dbError);
            return res.status(500).json({ message: 'Failed to save generated plan to database' });
        }

    } catch (error) {
        console.error('[generateCompletePlan] Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error during plan generation' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/my-plans
// Returns the latest workout and diet plans for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyPlans = async (req, res) => {
    try {
        const userId = req.user.id;

        const [workoutRows] = await pool.query(
            'SELECT plan_json, week_start_date, plan_version, created_at FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        const [dietRows] = await pool.query(
            'SELECT plan_json, week_start_date, plan_version FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (workoutRows.length === 0 || dietRows.length === 0) {
            return res.status(404).json({ message: 'No plans found for this user.' });
        }

        res.status(200).json({
            workoutPlan: workoutRows[0].plan_json,
            dietPlan: dietRows[0].plan_json,
            weekStartDate: workoutRows[0].week_start_date,
            version: workoutRows[0].plan_version,
            generatedAt: workoutRows[0].created_at
        });

    } catch (error) {
        console.error('[getMyPlans] Error:', error);
        res.status(500).json({ message: 'Internal server error while fetching plans' });
    }
};
