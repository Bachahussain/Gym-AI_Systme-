import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000', // Node.js backend URL
    withCredentials: true, // Send cookies like JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
