import axios from 'axios';

import guestTokenService from './guestTokenService';

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ctut_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const guestToken = guestTokenService.getToken();

    if (guestToken) {
        config.headers['X-Guest-Token'] = guestToken;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const response = error.response;
        const isTimeout = error.code === 'ECONNABORTED';
        const isCanceled = axios.isCancel(error) || error.code === 'ERR_CANCELED';

        return Promise.reject({
            message: response?.data?.message
                || (isTimeout ? 'Yêu cầu quá thời gian phản hồi. Vui lòng thử lại.' : null)
                || (isCanceled ? 'Yêu cầu đã bị hủy.' : null)
                || 'Có lỗi xảy ra. Vui lòng thử lại.',
            errors: response?.data?.errors || {},
            status: response?.status || (isTimeout ? 408 : 0),
            raw: response?.data || null,
            canceled: isCanceled,
            timeout: isTimeout,
        });
    },
);

export default api;
