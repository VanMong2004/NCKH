import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ctut_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const response = error.response;

        return Promise.reject({
            message: response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
            errors: response?.data?.errors || {},
            status: response?.status || 500,
            raw: response?.data || null,
        });
    },
);

export default api;
