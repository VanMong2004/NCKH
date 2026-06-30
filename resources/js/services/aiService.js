import api from './api';

import { mapAiChatResponse, mapAiConversationDetailResponse, mapAiConversationsResponse } from './mappers/aiMapper';

const AI_CHAT_TIMEOUT = 120000;

const aiService = {
    async chat(message, conversationId = null) {
        const payload = {
            message,
        };

        if (conversationId) {
            payload.conversation_id = conversationId;
        }

        const res = await api.post('/chat/send', payload, {
            timeout: AI_CHAT_TIMEOUT,
        });

        return mapAiChatResponse(res.data, message);
    },

    async conversations() {
        const res = await api.get('/chat/conversations', {
            timeout: 30000,
        });

        return mapAiConversationsResponse(res.data);
    },

    async currentSession() {
        const res = await api.get('/chat/session/current', {
            timeout: 30000,
        });

        return res.data?.data || res.data || {};
    },

    async currentMessages(limit = 20) {
        const res = await api.get('/chat/session/current/messages', {
            params: {
                limit,
            },
            timeout: 30000,
        });

        return mapAiConversationDetailResponse(res.data);
    },

    async reset() {
        const res = await api.post('/chat/reset', {}, {
            timeout: 30000,
        });

        return mapAiConversationDetailResponse(res.data);
    },

    async translateToVietnamese(text) {
        const res = await api.post('/chat/translate', {
            text,
        }, {
            timeout: 60000,
        });

        return res.data?.data?.translation || '';
    },

    async conversation(conversationId) {
        const res = await api.get(`/chat/conversations/${conversationId}`, {
            timeout: 30000,
        });

        return mapAiConversationDetailResponse(res.data);
    },

    async latestConversation() {
        const detail = await this.currentMessages(20);

        return {
            conversationId: detail.id,
            messages: detail.messages,
        };
    },

    async history() {
        const latest = await this.latestConversation();

        return latest.messages;
    },
};

export default aiService;
