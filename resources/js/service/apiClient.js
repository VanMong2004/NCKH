import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động gắn token vào mỗi request nếu có
/*Interceptor giúp:
✅ mọi request dùng chung một luật
✅ không phải nhớ gắn token tay
✅ code service sạch hơn nhiều
*/
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default apiClient;