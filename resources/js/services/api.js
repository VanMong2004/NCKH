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
        const errors = response?.data?.errors || {};
        const firstError = Object.values(errors).flat().find(Boolean);
        const rateLimitMessage = response?.status === 429 ? getRateLimitMessage(error.config?.url || '') : null;

        return Promise.reject({
            message: response?.data?.message
                || firstError
                || rateLimitMessage
                || (isTimeout ? 'Yêu cầu quá thời gian phản hồi. Vui lòng thử lại.' : null)
                || (isCanceled ? 'Yêu cầu đã bị hủy.' : null)
                || 'Đã xảy ra lỗi, vui lòng thử lại',
            errors,
            status: response?.status || (isTimeout ? 408 : 0),
            raw: response?.data || null,
            canceled: isCanceled,
            timeout: isTimeout,
        });
    },
);

function getRateLimitMessage(url = '') {
    if (url.includes('/auth/login')) {
        return 'Bạn đăng nhập quá nhiều lần, vui lòng thử lại sau ít phút.';
    }

    if (url.includes('/contact')) {
        return 'Bạn đã gửi liên hệ quá nhanh, vui lòng thử lại sau ít phút.';
    }

    if (url.includes('/orders/checkout') || url.includes('/pay')) {
        return 'Bạn thao tác đặt hàng quá nhanh, vui lòng thử lại sau ít phút.';
    }

    if (url.includes('/chat/')) {
        return 'Bạn đang gửi tin nhắn quá nhanh, vui lòng thử lại sau ít phút.';
    }

    return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
}

export default api;
