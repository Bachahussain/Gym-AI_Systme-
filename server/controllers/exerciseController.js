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

        // 1. Check local cache first
        const searchName = name.toLowerCase().trim();

        const [cached] = await pool.query(
            'SELECT gif_url FROM exercise_gifs_cache WHERE ai_exercise_name = ?',
            [searchName]
        );

        if (cached.length > 0) {
            return res.json({ gifUrl: cached[0].gif_url, source: 'cache' });
        }

        // 2. Check if RapidAPI key is configured
        const rapidApiKey = process.env.RAPIDAPI_KEY;

        if (!rapidApiKey) {
            // No key configured — return a graceful 404 instead of 500
            console.warn('[Exercise] RAPIDAPI_KEY not set. Returning no-gif response.');
            return res.status(404).json({ error: 'Exercise GIF not available (API not configured).' });
        }

        try {
            const tryFetch = async (queryName) => {
                const response = await axios.get(`https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(queryName)}`, {
                    params: { offset: '0', limit: '1' },
                    headers: {
                        'X-RapidAPI-Key': rapidApiKey,
                        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                    }
                });
                return response.data;
            };

            let exercises = await tryFetch(searchName);

            if (!exercises || exercises.length === 0) {
                if (searchName.endsWith('s')) {
                    exercises = await tryFetch(searchName.slice(0, -1));
                }
            }
            if (!exercises || exercises.length === 0) {
                if (searchName.endsWith('es')) {
                    exercises = await tryFetch(searchName.slice(0, -2));
                }
            }
            if (!exercises || exercises.length === 0) {
                const firstWord = searchName.split(' ')[0];
                if (firstWord && firstWord !== searchName) {
                    exercises = await tryFetch(firstWord);
                }
            }

            if (exercises && exercises.length > 0) {
                const apiName = exercises[0].name;
                const apiId = exercises[0].id;

                const imageRes = await axios.get(`https://exercisedb.p.rapidapi.com/image`, {
                    params: { exerciseId: apiId, resolution: '360' },
                    headers: {
                        'X-RapidAPI-Key': rapidApiKey,
                        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                    },
                    responseType: 'arraybuffer'
                });

                const buffer = Buffer.from(imageRes.data, 'binary');
                const base64Image = `data:${imageRes.headers['content-type']};base64,${buffer.toString('base64')}`;

                await pool.query(
                    'INSERT IGNORE INTO exercise_gifs_cache (ai_exercise_name, api_exercise_name, gif_url) VALUES (?, ?, ?)',
                    [searchName, apiName, base64Image]
                );

                return res.json({ gifUrl: base64Image, source: 'api' });
            } else {
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
