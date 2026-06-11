import jwt from 'jsonwebtoken';
const JWT_SECRET = 'your_jwt_secret_key';
import pool from '../../db.js';
import { addProgressEntryIfChanged } from '../../src/services/progressTrackingService.js';

const profileSetup = async (req, res) => {
    // 0. Get user ID first
    const token = req.cookies.token;
    let userEmail;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userEmail = decoded.email;
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const [userRows] = await pool.query('SELECT id, name FROM users WHERE email = ?', [userEmail]);
    if (userRows.length === 0) return res.status(400).json({ error: 'User not found' });
    const userId = userRows[0].id;
    const userName = userRows[0].name;

    // Fetch existing profile to fill missing data
    const [existingRows] = await pool.query('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const existing = existingRows[0] || {};

    // 1. Merge data (Request > Existing > Default)
    const age = req.body.age || existing.age;
    const weight = req.body.weight || existing.weight;
    const height = req.body.height || existing.height;
    const gender = req.body.gender || existing.gender || 'other';
    const goal = req.body.goal || existing.goal || 'maintenance';
    const experience = req.body.experience || existing.experience_level || 'Beginner';
    const days = req.body.days || existing.workout_days || 3;
    const split = req.body.split || existing.preferred_split || 'Full Body';
    const dietary_preference = req.body.dietary_preference || existing.dietary_preference || 'none';
    const medical_conditions = req.body.medical_conditions || existing.medical_conditions || 'none';

    if (!age || !weight || !height) {
        return res.status(400).json({ error: 'Age, Weight, and Height are required for initial setup' });
    }

    const day = parseInt(days) || 3;

    // 2. Calculate Metrics
    const height_m = height / 100;
    const bmi = parseFloat((weight / (height_m * height_m)).toFixed(1));

    let bmi_category = "Normal";
    if (bmi < 18.5) bmi_category = "Underweight";
    else if (bmi >= 25 && bmi < 29.9) bmi_category = "Overweight";
    else if (bmi >= 30) bmi_category = "Obese";

    let bmr;
    if (gender.toLowerCase() === "male") {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    bmr = Math.round(bmr);

    const activity_multipliers = { 'sedentary': 1.2, 'moderate': 1.55, 'active': 1.725 };
    const goalMap = {
        'Fat Loss': 'weight_loss',
        'Athletic Performance': 'maintenance',
        'Bodybuilding': 'muscle_gain',
        'weight_loss': 'weight_loss',
        'maintenance': 'maintenance',
        'muscle_gain': 'muscle_gain'
    };
    const dbGoal = goalMap[goal] || 'maintenance';

    const actMap = { 'Beginner': 'sedentary', 'Intermediate': 'moderate', 'Advanced': 'active', 'sedentary': 'sedentary', 'moderate': 'moderate', 'active': 'active' };
    const dbActivity = actMap[experience] || 'active';
    const tdee = Math.round(bmr * (activity_multipliers[dbActivity] || 1.2));

    try {
        if (existingRows.length === 0) {
            const insertQuery = `INSERT INTO user_profiles 
                (user_id, age, weight, height, gender, goal, activity_level, dietary_preference, medical_conditions, bmi, bmi_category, bmr, tdee, workout_days, preferred_split, experience_level) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            await pool.query(insertQuery, [
                userId, age, weight, height, gender.toLowerCase(), dbGoal, dbActivity, dietary_preference, medical_conditions,
                bmi, bmi_category, bmr, tdee, day, split, experience
            ]);
        } else {
            const updateQuery = `UPDATE user_profiles 
                SET age = ?, weight = ?, height = ?, gender = ?, goal = ?, activity_level = ?, dietary_preference = ?, medical_conditions = ?, 
                    bmi = ?, bmi_category = ?, bmr = ?, tdee = ?, workout_days = ?, preferred_split = ?, experience_level = ?
                WHERE user_id = ?`;
            await pool.query(updateQuery, [
                age, weight, height, gender.toLowerCase(), dbGoal, dbActivity, dietary_preference, medical_conditions,
                bmi, bmi_category, bmr, tdee, day, split, experience, userId
            ]);
        }
        
        // 3. Append a progress record only when the submitted snapshot changed.
        await addProgressEntryIfChanged(pool, { userId, weight });

        res.json({
            success: true,
            name: userName,
            days: day,
            split: split,
            goal: goal
        });

    } catch (err) {
        console.error('Database error in profile setup:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

export default profileSetup;