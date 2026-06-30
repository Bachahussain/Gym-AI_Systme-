import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.MODE === 'development' ? 'http://localhost:3000' : 'https://gym-ai-backend-production-ff49.up.railway.app',
    withCredentials: true, // Send cookies like JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
