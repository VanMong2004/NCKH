import api from './api';
import { mapNotification, mapNotificationResponse } from './mappers/notificationMapper';

const notificationService = {
    async getNotifications(params = {}) {
        try {
            const res = await api.get('/notifications', { params });
            return mapNotificationResponse(res.data);
        } catch (error) {
            console.error('Notification error:', error);
            return { notifications: [], meta: {} };
        }
    },

    async getUnreadCount() {
        try {
            const res = await api.get('/notifications/unread-count');
            return res.data?.data?.unread_count || 0;
        } catch {
            return 0;
        }
    },

    async getDetail(id) {
        const res = await api.get(`/notifications/${id}`);
        return mapNotification(res.data?.data || res.data);
    },

    async markRead(id) {
        const res = await api.post(`/notifications/${id}/read`);
        return mapNotification(res.data?.data || res.data);
    },

    async markAllRead() {
        const res = await api.post('/notifications/read-all');
        return res.data;
    },
};

export default notificationService;
