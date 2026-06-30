import api from '../../services/api';

import {
    mapAdminChatConversationDetailResponse,
    mapAdminChatConversationListResponse,
    mapAdminChatConversationStatisticsResponse,
} from '../mappers/adminChatConversationMapper';

const adminChatConversationService = {
    async getConversations(params = {}) {
        const res = await api.get('/admin/chat/conversations', { params });
        return mapAdminChatConversationListResponse(res.data);
    },

    async getStatistics() {
        const res = await api.get('/admin/chat/conversations/statistics');
        return mapAdminChatConversationStatisticsResponse(res.data);
    },

    async getConversation(id) {
        const res = await api.get(`/admin/chat/conversations/${id}`);
        return mapAdminChatConversationDetailResponse(res.data);
    },

    async closeConversation(id) {
        const res = await api.patch(`/admin/chat/conversations/${id}/close`);
        return mapAdminChatConversationDetailResponse(res.data);
    },
};

export default adminChatConversationService;
