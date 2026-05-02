import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔐 attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ❌ handle error global
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Có lỗi xảy ra';

        return Promise.reject(error.response?.data?.message || 'Có lỗi xảy ra');
    },
);

export default api;
