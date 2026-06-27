import pool from '../db.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const getExerciseGif = async (req, res) => {
    try {
        const { name } = req.query;
        console.log(`\n[API] Received request for GIF: "${name}"`);
        if (!name) {
            return res.status(400).json({ error: 'Exercise name is required' });
        }

        // 1. Check local cache first (exact match or similar)
        const searchName = name.toLowerCase().trim();
        
        const [cached] = await pool.query(
            'SELECT gif_url FROM exercise_gifs_cache WHERE ai_exercise_name = ?',
            [searchName]
        );

        if (cached.length > 0) {
            return res.json({ gifUrl: cached[0].gif_url, source: 'cache' });
        }

        // 2. Not in cache, fetch from RapidAPI ExerciseDB
        const rapidApiKey = process.env.RAPIDAPI_KEY;
        
        if (!rapidApiKey) {
            console.warn("RAPIDAPI_KEY not set. Cannot fetch exercise GIFs.");
            return res.status(500).json({ error: 'Exercise API is not configured.' });
        }

        try {
            // Helper function to fetch from RapidAPI
            const tryFetch = async (queryName) => {
                const res = await axios.get(`https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(queryName)}`, {
                    params: { offset: '0', limit: '1' },
                    headers: {
                        'X-RapidAPI-Key': rapidApiKey,
                        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                    }
                });
                return res.data;
            };

            // First get the exercise metadata to find the exact ID
            let exercises = await tryFetch(searchName);

            // If not found, try singular forms and partial matches
            if (!exercises || exercises.length === 0) {
                if (searchName.endsWith('s')) {
                    exercises = await tryFetch(searchName.slice(0, -1)); // Remove 's'
                }
            }
            if (!exercises || exercises.length === 0) {
                if (searchName.endsWith('es')) {
                    exercises = await tryFetch(searchName.slice(0, -2)); // Remove 'es'
                }
            }
            if (!exercises || exercises.length === 0) {
                // Try last word only (often the main movement e.g. 'curl', 'squat', 'press')
                const words = searchName.split(' ');
                if (words.length > 1) {
                    const lastWord = words[words.length - 1];
                    exercises = await tryFetch(lastWord);
                }
            }
            if (!exercises || exercises.length === 0) {
                // Try last two words as a last resort (e.g. 'bench press')
                const words = searchName.split(' ');
                if (words.length > 2) {
                    const lastTwo = words[words.length - 2] + ' ' + words[words.length - 1];
                    exercises = await tryFetch(lastTwo);
                }
            }
            
            if (exercises && exercises.length > 0) {
                const apiName = exercises[0].name;
                const apiId = exercises[0].id;

                // 3. The API no longer returns gifUrl directly. We must fetch the image binary.
                const imageRes = await axios.get(`https://exercisedb.p.rapidapi.com/image`, {
                    params: { exerciseId: apiId, resolution: '360' }, // Try 360, fallback handled by API if not allowed
                    headers: {
                        'X-RapidAPI-Key': rapidApiKey,
                        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                    },
                    responseType: 'arraybuffer' // Get binary data
                });

                // Convert binary buffer to base64 Data URI
                const buffer = Buffer.from(imageRes.data, 'binary');
                const base64Image = `data:${imageRes.headers['content-type']};base64,${buffer.toString('base64')}`;

                // 4. Save the base64 string to cache to save quota and network bandwidth!
                await pool.query(
                    'INSERT IGNORE INTO exercise_gifs_cache (ai_exercise_name, api_exercise_name, gif_url) VALUES (?, ?, ?)',
                    [searchName, apiName, base64Image]
                );

                return res.json({ gifUrl: base64Image, source: 'api' });
            } else {
                // Return a 404 if no exercise matched
                return res.status(404).json({ error: 'Exercise GIF not found' });
            }

        } catch (apiError) {
            console.error('[Exercise API] Error fetching from RapidAPI:', apiError.message);
            if (apiError.response && apiError.response.status === 429) {
                 return res.status(429).json({ error: 'API Rate Limit Exceeded' });
            }
            return res.status(502).json({ error: 'Failed to fetch exercise from external API' });
        }

    } catch (error) {
        console.error('[getExerciseGif] Internal Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
