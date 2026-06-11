import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const rapidApiKey = process.env.RAPIDAPI_KEY;

async function test() {
    try {
        console.log("Searching for bicep curl...");
        const response = await axios.get(`https://exercisedb.p.rapidapi.com/exercises/name/bicep%20curl`, {
            params: { offset: '0', limit: '1' },
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
            }
        });
        
        const apiId = response.data[0].id;
        console.log("Found ID:", apiId);

        console.log("Fetching image...");
        const imageRes = await axios.get(`https://exercisedb.p.rapidapi.com/image`, {
            params: { exerciseId: apiId, resolution: '360' },
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
            },
            responseType: 'arraybuffer'
        });

        console.log("Image Status:", imageRes.status);
        console.log("Content-Type:", imageRes.headers['content-type']);
        
        const buffer = Buffer.from(imageRes.data);
        const b64 = buffer.toString('base64');
        console.log("Base64 preview:", b64.substring(0, 50));
        
    } catch (err) {
        console.error("ERROR:", err.response ? err.response.status : err.message);
        if (err.response) console.error(err.response.data.toString());
    }
}

test();
