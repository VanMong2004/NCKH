import api from './api';

import {
    mapNotificationActionResponse,
    mapNotificationDetailResponse,
    mapNotificationResponse,
    mapUnreadCountResponse,
} from './mappers/notificationMapper';

const notificationService = {
    async getNotifications(params = {}) {
        try {
            const res = await api.get('/notifications', { params });
            return mapNotificationResponse(res.data);
        } catch (error) {
            console.error('Notification error:', error);

            return {
                notifications: [],
                meta: {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: 10,
                    total: 0,
                },
                success: false,
                message: error?.message || 'Không thể tải thông báo',
                raw: null,
            };
        }
    },

    async getUnreadCount() {
        try {
            const res = await api.get('/notifications/unread-count');
            return mapUnreadCountResponse(res.data);
        } catch {
            return 0;
        }
    },

    async getDetail(id) {
        const res = await api.get(`/notifications/${id}`);
        return mapNotificationDetailResponse(res.data);
    },

    async markRead(id) {
        const res = await api.put(`/notifications/${id}/read`);
        return mapNotificationDetailResponse(res.data);
    },

    async markAllRead() {
        const res = await api.put('/notifications/read-all');
        return mapNotificationActionResponse(res.data);
    },
};

export default notificationService;
