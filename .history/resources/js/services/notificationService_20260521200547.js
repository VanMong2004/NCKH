import api from './api';
import { mapNotification, mapNotificationResponse } from './mappers/notificationMapper';

const notificationService = {
    async getNotifications(params = {}) {
        const res = await api.get('/notifications', {
            params,
        });

        return mapNotificationResponse(res.data);
    },

    async getUnreadCount() {
        const res = await api.get('/notifications/unread-count');

        return res.data?.data?.unread_count || 0;
    },

    async getDetail(id) {
        const res = await api.get(`/notifications/${id}`);

        return mapNotification(res.data?.data);
    },

    async markRead(id) {
        const res = await api.post(`/notifications/${id}/read`);

        return mapNotification(res.data?.data);
    },

    async markAllRead() {
        return api.post('/notifications/read-all');
    },
};

export default notificationService;
