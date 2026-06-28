import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : 'https://gym-ai-systme--hussainllc11.replit.app'),
    withCredentials: true, // Send cookies like JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
