import pool from '../db.js';
import bcrypt from 'bcryptjs';
import {
    addProgressEntryIfChanged,
    getUserProgressHistory,
    syncUserProfileWeightMetrics,
} from '../services/progressTrackingService.js';

const getWeekStartDate = () => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const getCurrentDayIndex = () => {
    const now = new Date();
    return (now.getDay() + 6) % 7;
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(`
            SELECT u.name, u.email, p.* 
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.id = ?
        `, [userId]);

        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Streak calculation
        const [logRows] = await pool.query(
            'SELECT DISTINCT DATE(completed_at) as log_date FROM workout_logs WHERE user_id = ? ORDER BY log_date DESC',
            [userId]
        );

        let streak = 0;
        if (logRows.length > 0) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let lastLogDate = new Date(logRows[0].log_date);
            lastLogDate = new Date(lastLogDate.getFullYear(), lastLogDate.getMonth(), lastLogDate.getDate());

            // Check if user has logged today or yesterday to maintain streak
            if (lastLogDate.getTime() === today.getTime() || lastLogDate.getTime() === yesterday.getTime()) {
                streak = 1;
                for (let i = 1; i < logRows.length; i++) {
                    let currentDate = new Date(logRows[i].log_date);
                    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

                    let prevDate = new Date(logRows[i - 1].log_date);
                    prevDate = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());

                    const diffDays = Math.ceil((prevDate - currentDate) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // 3. Weekly Progress
        const now = new Date();
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        const [weeklyRows] = await pool.query(
            'SELECT DISTINCT day_index FROM workout_logs WHERE user_id = ? AND completed_at >= ?',
            [userId, monday]
        );
        const completedDays = weeklyRows.map(row => row.day_index);

        const [planRows] = await pool.query('SELECT workout_days FROM user_profiles WHERE user_id = ?', [userId]);
        const goalDays = (planRows.length > 0 && planRows[0].workout_days) ? planRows[0].workout_days : 3;

        // XP rule: 5 XP per streak day, resets to 0 when streak is broken.
        const xpPerDay = 5;
        const totalXp = streak > 0 ? streak * xpPerDay : 0;

        // 4. Achievement Stats (Weight & Body Progression)
        const progressAnalytics = await getUserProgressHistory(pool, userId);
        const achievementStats = {
            isFirstWeek: progressAnalytics.summary.isFirstWeek,
            initialWeight: progressAnalytics.summary.firstEntry?.weight ?? null,
            previousWeight: progressAnalytics.summary.previousEntry?.weight ?? null,
            currentWeight: progressAnalytics.summary.latestEntry?.weight ?? null,
            weightChange: progressAnalytics.summary.changeFromStart,
            latestChange: progressAnalytics.summary.changeFromPrevious,
            hasHistory: progressAnalytics.summary.hasHistory,
            totalEntries: progressAnalytics.summary.totalEntries,
            elapsedDays: progressAnalytics.summary.elapsedDays,
        };

        res.status(200).json({
            streak: streak,
            weeklyProgress: completedDays.length,
            completedDays: completedDays,
            weeklyGoal: goalDays,
            xpPerDay,
            totalXp,
            progressPercentage: Math.min(100, Math.round((completedDays.length / goalDays) * 100)),
            achievementStats: achievementStats,
            progressHistory: progressAnalytics.entries,
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Internal server error while fetching stats' });
    }
};

export const getProgressHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const progressAnalytics = await getUserProgressHistory(pool, userId);

        res.status(200).json(progressAnalytics);
    } catch (error) {
        console.error('Error fetching progress history:', error);
        res.status(500).json({ message: 'Internal server error while fetching progress history' });
    }
};

export const addProgressEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const { weight, bodyFat, muscleMass, notes } = req.body;

        if (weight === undefined || weight === null || weight === '') {
            return res.status(400).json({ message: 'weight is required' });
        }

        await syncUserProfileWeightMetrics(pool, userId, weight);
        const insertResult = await addProgressEntryIfChanged(pool, {
            userId,
            weight,
            bodyFat,
            muscleMass,
            notes,
        });

        const progressAnalytics = await getUserProgressHistory(pool, userId);

        res.status(insertResult.inserted ? 201 : 200).json({
            inserted: insertResult.inserted,
            reason: insertResult.reason || null,
            reusedPreviousRecord: !insertResult.inserted,
            ...progressAnalytics,
        });
    } catch (error) {
        console.error('Error storing progress entry:', error);
        res.status(500).json({ message: 'Internal server error while storing progress entry' });
    }
};

export const completeWorkoutDay = async (req, res) => {
    try {
        const userId = req.user.id;
        const { dayIndex } = req.body;

        if (dayIndex === undefined) {
            return res.status(400).json({ message: 'dayIndex is required' });
        }

        const weekStartDate = getWeekStartDate().toISOString().split('T')[0];

        const [existingDayRows] = await pool.query(
            `SELECT id
             FROM workout_logs
             WHERE user_id = ? AND week_start_date = ? AND day_index = ?
             LIMIT 1`,
            [userId, weekStartDate, dayIndex]
        );

        if (existingDayRows.length === 0) {
            await pool.query(
                'INSERT INTO workout_logs (user_id, day_index, week_start_date) VALUES (?, ?, ?)',
                [userId, dayIndex, weekStartDate]
            );
        }

        res.status(200).json({ message: 'Workout day completed successfully' });
    } catch (error) {
        console.error('Error logging workout completion:', error);
        res.status(500).json({ message: 'Internal server error while logging completion' });
    }
};

export const getWorkoutProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const weekStartDate = getWeekStartDate().toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        const [exerciseRows] = await pool.query(
            `SELECT day_index AS dayIndex, exercise_index AS exerciseIndex
             FROM workout_exercise_logs
             WHERE user_id = ? AND week_start_date = ?`,
            [userId, weekStartDate]
        );

        const [dayRows] = await pool.query(
            `SELECT DISTINCT day_index AS dayIndex
             FROM workout_logs
             WHERE user_id = ? AND week_start_date = ?`,
            [userId, weekStartDate]
        );

        // Which day (if any) has the user started exercising on TODAY
        const [todayRows] = await pool.query(
            `SELECT DISTINCT day_index AS dayIndex
             FROM workout_exercise_logs
             WHERE user_id = ? AND DATE(completed_at) = ?
             LIMIT 1`,
            [userId, today]
        );
        const todayActiveDay = todayRows.length > 0 ? todayRows[0].dayIndex : null;

        res.status(200).json({
            weekStartDate,
            currentDayIndex: getCurrentDayIndex(),
            completedExercises: exerciseRows,
            completedDays: dayRows.map(row => row.dayIndex),
            todayActiveDay,
        });
    } catch (error) {
        console.error('Error fetching workout progress:', error);
        res.status(500).json({ message: 'Internal server error while fetching workout progress' });
    }
};

export const completeWorkoutExercise = async (req, res) => {
    try {
        const userId = req.user.id;
        const { dayIndex, exerciseIndex, totalExercises } = req.body;

        if (dayIndex === undefined || exerciseIndex === undefined || totalExercises === undefined) {
            return res.status(400).json({ message: 'dayIndex, exerciseIndex and totalExercises are required' });
        }

        const day = Number(dayIndex);
        const exercise = Number(exerciseIndex);
        const total = Number(totalExercises);

        if (!Number.isInteger(day) || !Number.isInteger(exercise) || !Number.isInteger(total) || total <= 0) {
            return res.status(400).json({ message: 'Invalid exercise completion payload' });
        }

        const weekStartDate = getWeekStartDate().toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const currentDayIdx = getCurrentDayIndex();

        await pool.query(
            `INSERT IGNORE INTO workout_exercise_logs (user_id, week_start_date, day_index, exercise_index)
             VALUES (?, ?, ?, ?)`,
            [userId, weekStartDate, day, exercise]
        );

        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS completedCount
             FROM workout_exercise_logs
             WHERE user_id = ? AND week_start_date = ? AND day_index = ?`,
            [userId, weekStartDate, day]
        );

        const completedCount = countRows[0].completedCount;
        const isDayCompleted = completedCount >= total;

        if (isDayCompleted) {
            const [existingDayRows] = await pool.query(
                `SELECT id
                 FROM workout_logs
                 WHERE user_id = ? AND week_start_date = ? AND day_index = ?
                 LIMIT 1`,
                [userId, weekStartDate, day]
            );

            if (existingDayRows.length === 0) {
                await pool.query(
                    'INSERT INTO workout_logs (user_id, day_index, week_start_date) VALUES (?, ?, ?)',
                    [userId, day, weekStartDate]
                );
            }
        }

        res.status(200).json({
            message: 'Exercise marked as completed',
            dayIndex: day,
            exerciseIndex: exercise,
            completedCount,
            totalExercises: total,
            isDayCompleted,
            currentDayIndex: currentDayIdx,
        });
    } catch (error) {
        console.error('Error completing workout exercise:', error);
        res.status(500).json({ message: 'Internal server error while completing exercise' });
    }
};

export const upgradeToPro = async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query('UPDATE user_profiles SET is_pro = 1 WHERE user_id = ?', [userId]);
        res.status(200).json({ message: 'Successfully upgraded to PRO tier!' });
    } catch (error) {
        console.error('Error upgrading to PRO:', error);
        res.status(500).json({ message: 'Internal server error during upgrade' });
    }
};

export const getAccountSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            'SELECT name, email FROM users WHERE id = ? LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching account settings:', error);
        return res.status(500).json({ message: 'Internal server error while fetching account settings' });
    }
};

export const updateAccountSettings = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const {
            name,
            email,
            currentPassword,
            newPassword,
        } = req.body;

        const nextName = typeof name === 'string' ? name.trim() : '';
        const nextEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const wantsPasswordUpdate = Boolean(newPassword && String(newPassword).trim());

        if (!nextName && !nextEmail && !wantsPasswordUpdate) {
            return res.status(400).json({ message: 'No account changes submitted' });
        }

        await connection.beginTransaction();

        const [userRows] = await connection.query(
            'SELECT id, name, email, password FROM users WHERE id = ? LIMIT 1',
            [userId]
        );

        if (userRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = userRows[0];

        if (nextEmail && nextEmail !== currentUser.email) {
            const [emailRows] = await connection.query(
                'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
                [nextEmail, userId]
            );
            if (emailRows.length > 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        let hashedNewPassword = null;
        if (wantsPasswordUpdate) {
            if (!currentPassword) {
                await connection.rollback();
                return res.status(400).json({ message: 'Current password is required to set a new password' });
            }

            const isMatch = await bcrypt.compare(String(currentPassword), currentUser.password);
            if (!isMatch) {
                await connection.rollback();
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            hashedNewPassword = await bcrypt.hash(String(newPassword), salt);
        }

        const fields = [];
        const values = [];

        if (nextName) {
            fields.push('name = ?');
            values.push(nextName);
        }
        if (nextEmail) {
            fields.push('email = ?');
            values.push(nextEmail);
        }
        if (hashedNewPassword) {
            fields.push('password = ?');
            values.push(hashedNewPassword);
        }

        if (fields.length > 0) {
            values.push(userId);
            await connection.query(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
        }

        await connection.commit();

        const [updatedRows] = await connection.query(
            'SELECT name, email FROM users WHERE id = ? LIMIT 1',
            [userId]
        );

        return res.status(200).json({
            message: 'Account settings updated successfully',
            user: updatedRows[0],
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating account settings:', error);
        return res.status(500).json({ message: 'Internal server error while updating account settings' });
    } finally {
        connection.release();
    }
};
