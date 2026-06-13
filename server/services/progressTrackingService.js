const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.725,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const roundMetric = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    return Number(value.toFixed(1));
};

const FLOAT_EPSILON = 0.0001;

const isSameNumber = (left, right) => {
    const a = toNumberOrNull(left);
    const b = toNumberOrNull(right);

    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return Math.abs(a - b) <= FLOAT_EPSILON;
};

const normalizeText = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim().toLowerCase();
    return normalized || null;
};

const calculateBmiFromHeight = (height, weight) => {
    const normalizedHeight = toNumberOrNull(height);
    const normalizedWeight = toNumberOrNull(weight);

    if (!normalizedHeight || !normalizedWeight) {
        return null;
    }

    const heightInMeters = normalizedHeight / 100;
    return roundMetric(normalizedWeight / (heightInMeters * heightInMeters));
};

const buildComparisonMetric = (currentValue, previousValue, startingValue) => ({
    current: currentValue ?? null,
    previous: previousValue ?? null,
    starting: startingValue ?? null,
    changeFromPrevious: currentValue !== null && previousValue !== null
        ? roundMetric(currentValue - previousValue)
        : null,
    changeFromStart: currentValue !== null && startingValue !== null
        ? roundMetric(currentValue - startingValue)
        : null,
});

const buildSnapshotMetric = (currentValue, previousValue, startingValue) => ({
    current: currentValue ?? null,
    previous: previousValue ?? null,
    starting: startingValue ?? null,
});

const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
};

export const calculateProfileMetrics = ({ age, gender, height, weight, activityLevel }) => {
    if (!age || !gender || !height || !weight) {
        return null;
    }

    const heightInMeters = Number(height) / 100;
    const bmi = roundMetric(Number(weight) / (heightInMeters * heightInMeters));
    const bmiCategory = getBmiCategory(bmi);

    const normalizedGender = String(gender).toLowerCase();
    let bmr;

    if (normalizedGender === 'male') {
        bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age)) + 5;
    } else {
        bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age)) - 161;
    }

    const multiplier = ACTIVITY_MULTIPLIERS[String(activityLevel).toLowerCase()] || ACTIVITY_MULTIPLIERS.sedentary;

    return {
        bmi,
        bmiCategory,
        bmr: Math.round(bmr),
        tdee: Math.round(bmr * multiplier),
    };
};

export const syncUserProfileWeightMetrics = async (db, userId, weight) => {
    const normalizedWeight = toNumberOrNull(weight);
    if (normalizedWeight === null) {
        return false;
    }

    const [profileRows] = await db.query(
        'SELECT age, gender, height, activity_level FROM user_profiles WHERE user_id = ? LIMIT 1',
        [userId]
    );

    if (profileRows.length === 0) {
        return false;
    }

    const metrics = calculateProfileMetrics({
        age: profileRows[0].age,
        gender: profileRows[0].gender,
        height: profileRows[0].height,
        weight: normalizedWeight,
        activityLevel: profileRows[0].activity_level,
    });

    await db.query(
        `UPDATE user_profiles
         SET weight = ?, bmi = ?, bmi_category = ?, bmr = ?, tdee = ?
         WHERE user_id = ?`,
        [
            normalizedWeight,
            metrics?.bmi ?? null,
            metrics?.bmiCategory ?? null,
            metrics?.bmr ?? null,
            metrics?.tdee ?? null,
            userId,
        ]
    );

    return true;
};

export const addProgressEntryIfChanged = async (
    db,
    { userId, weight, notes = null }
) => {
    const normalizedWeight = toNumberOrNull(weight);
    const normalizedNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;

    if (normalizedWeight === null) {
        return { inserted: false, reason: 'weight_required' };
    }

    const [profileRows] = await db.query(
        `SELECT age, bmi, experience_level, workout_days
         FROM user_profiles
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    if (profileRows.length === 0) {
        return { inserted: false, reason: 'profile_not_found' };
    }

    const profileSnapshot = profileRows[0];
    const normalizedBmi = toNumberOrNull(profileSnapshot.bmi);
    const normalizedAge = toNumberOrNull(profileSnapshot.age);
    const normalizedWorkoutDays = toNumberOrNull(profileSnapshot.workout_days);
    const normalizedExperienceLevel = normalizeText(profileSnapshot.experience_level);

    const [latestRows] = await db.query(
        `SELECT weight, bmi, age, experience_level, workout_days, notes
         FROM progress_tracking
         WHERE user_id = ?
         ORDER BY recorded_at DESC, id DESC
         LIMIT 1`,
        [userId]
    );

    const latestEntry = latestRows[0];
    const latestExperienceLevel = normalizeText(latestEntry?.experience_level);

    // Important: dedupe only on tracked stat fields.
    // If only notes change while stats are identical, we still reuse the previous record.
    const isDuplicate = latestEntry
        && isSameNumber(latestEntry.weight, normalizedWeight)
        && isSameNumber(latestEntry.bmi, normalizedBmi)
        && isSameNumber(latestEntry.age, normalizedAge)
        && isSameNumber(latestEntry.workout_days, normalizedWorkoutDays)
        && latestExperienceLevel === normalizedExperienceLevel;

    if (isDuplicate) {
        return { inserted: false, reason: 'duplicate', reusedRecord: true };
    }

    const [result] = await db.query(
        `INSERT INTO progress_tracking (user_id, weight, bmi, age, experience_level, workout_days, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            normalizedWeight,
            normalizedBmi,
            normalizedAge,
            normalizedExperienceLevel,
            normalizedWorkoutDays,
            normalizedNotes,
        ]
    );

    return { inserted: true, insertId: result.insertId };
};

export const getUserProgressHistory = async (db, userId) => {
    const [rows] = await db.query(
        `SELECT id,
                weight,
                bmi,
                age,
                experience_level AS experienceLevel,
                workout_days AS workoutDays,
                notes,
                recorded_at AS recordedAt
         FROM progress_tracking
         WHERE user_id = ?
         ORDER BY recorded_at ASC, id ASC`,
        [userId]
    );

    const ascendingEntries = rows.map((row, index) => {
        const previousEntry = index > 0 ? rows[index - 1] : null;
        const currentWeight = toNumberOrNull(row.weight);
        const currentBmi = toNumberOrNull(row.bmi);
        const currentAge = toNumberOrNull(row.age);
        const currentWorkoutDays = toNumberOrNull(row.workoutDays);
        const currentExperienceLevel = row.experienceLevel || null;
        const previousWeight = previousEntry ? toNumberOrNull(previousEntry.weight) : null;
        const previousBmi = previousEntry ? toNumberOrNull(previousEntry.bmi) : null;
        const previousAge = previousEntry ? toNumberOrNull(previousEntry.age) : null;
        const previousWorkoutDays = previousEntry ? toNumberOrNull(previousEntry.workoutDays) : null;
        const previousExperienceLevel = previousEntry ? (previousEntry.experienceLevel || null) : null;

        return {
            id: row.id,
            weight: currentWeight,
            bmi: currentBmi,
            age: currentAge,
            experienceLevel: currentExperienceLevel,
            workoutDays: currentWorkoutDays,
            notes: row.notes || null,
            recordedAt: row.recordedAt,
            changeFromPrevious: previousWeight === null ? null : roundMetric(currentWeight - previousWeight),
            comparisons: {
                weight: {
                    current: currentWeight,
                    previous: previousWeight,
                    changeFromPrevious: previousWeight === null ? null : roundMetric(currentWeight - previousWeight),
                },
                bmi: {
                    current: currentBmi,
                    previous: previousBmi,
                    changeFromPrevious: currentBmi !== null && previousBmi !== null ? roundMetric(currentBmi - previousBmi) : null,
                },
                age: {
                    current: currentAge,
                    previous: previousAge,
                    changeFromPrevious: currentAge !== null && previousAge !== null ? roundMetric(currentAge - previousAge) : null,
                },
                workoutDays: {
                    current: currentWorkoutDays,
                    previous: previousWorkoutDays,
                    changeFromPrevious: currentWorkoutDays !== null && previousWorkoutDays !== null ? roundMetric(currentWorkoutDays - previousWorkoutDays) : null,
                },
                experienceLevel: {
                    current: currentExperienceLevel,
                    previous: previousExperienceLevel,
                },
            },
        };
    });

    const firstEntry = ascendingEntries[0] || null;
    const latestEntry = ascendingEntries[ascendingEntries.length - 1] || null;
    const previousEntry = ascendingEntries.length > 1 ? ascendingEntries[ascendingEntries.length - 2] : null;
    const changeFromStart = firstEntry && latestEntry
        ? roundMetric(latestEntry.weight - firstEntry.weight)
        : 0;
    const changeFromPrevious = latestEntry && previousEntry
        ? roundMetric(latestEntry.weight - previousEntry.weight)
        : null;
    const elapsedDays = firstEntry && latestEntry
        ? Math.floor((new Date(latestEntry.recordedAt) - new Date(firstEntry.recordedAt)) / MS_PER_DAY)
        : 0;

    return {
        entries: [...ascendingEntries].reverse(),
        summary: {
            totalEntries: ascendingEntries.length,
            firstEntry,
            previousEntry,
            latestEntry,
            changeFromStart,
            changeFromPrevious,
            metrics: {
                weight: buildComparisonMetric(
                    latestEntry?.weight ?? null,
                    previousEntry?.weight ?? null,
                    firstEntry?.weight ?? null
                ),
                bmi: buildComparisonMetric(
                    latestEntry?.bmi ?? null,
                    previousEntry?.bmi ?? null,
                    firstEntry?.bmi ?? null
                ),
                age: buildComparisonMetric(
                    latestEntry?.age ?? null,
                    previousEntry?.age ?? null,
                    firstEntry?.age ?? null
                ),
                workoutDays: buildComparisonMetric(
                    latestEntry?.workoutDays ?? null,
                    previousEntry?.workoutDays ?? null,
                    firstEntry?.workoutDays ?? null
                ),
                experienceLevel: buildSnapshotMetric(
                    latestEntry?.experienceLevel ?? null,
                    previousEntry?.experienceLevel ?? null,
                    firstEntry?.experienceLevel ?? null
                ),
            },
            elapsedDays,
            hasHistory: ascendingEntries.length > 1,
            isFirstWeek: ascendingEntries.length < 2 || elapsedDays < 6,
        },
    };
};