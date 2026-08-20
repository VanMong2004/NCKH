import api from '../../services/api';

import {
    mapAdminChatApprovedAnswerDetailResponse,
    mapAdminChatApprovedAnswerListResponse,
} from '../mappers/adminChatApprovedAnswerMapper';

function cleanParams(params = {}) {
    const result = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            result[key] = value;
        }
    });

    return result;
}

const adminChatApprovedAnswerService = {
    async getAnswers(params = {}) {
        const res = await api.get('/admin/chat/approved-answers', {
            params: cleanParams(params),
        });

        return mapAdminChatApprovedAnswerListResponse(res.data);
    },

    async getAnswer(id) {
        const res = await api.get(`/admin/chat/approved-answers/${id}`);
        return mapAdminChatApprovedAnswerDetailResponse(res.data);
    },

    async createAnswer(payload = {}) {
        const res = await api.post('/admin/chat/approved-answers', payload);
        return mapAdminChatApprovedAnswerDetailResponse(res.data);
    },

    async updateAnswer(id, payload = {}) {
        const res = await api.put(`/admin/chat/approved-answers/${id}`, payload);
        return mapAdminChatApprovedAnswerDetailResponse(res.data);
    },

    async toggleAnswer(id) {
        const res = await api.post(`/admin/chat/approved-answers/${id}/toggle`);
        return mapAdminChatApprovedAnswerDetailResponse(res.data);
    },

    async deleteAnswer(id) {
        const res = await api.delete(`/admin/chat/approved-answers/${id}`);
        return res.data;
    },

    async promoteMessage(messageId) {
        const res = await api.post(`/admin/chat/messages/${messageId}/promote-to-answer`);
        return mapAdminChatApprovedAnswerDetailResponse(res.data);
    },
};

export default adminChatApprovedAnswerService;
