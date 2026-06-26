import axios from 'axios';

const apiClient = axios.create({
    baseURL: '', // Uses Vite proxy in dev; relative paths work in production too
    withCredentials: true, // Send cookies like JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
