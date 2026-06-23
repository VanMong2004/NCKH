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

    async conversation(conversationId) {
        const res = await api.get(`/chat/conversations/${conversationId}`, {
            timeout: 30000,
        });

        return mapAiConversationDetailResponse(res.data);
    },

    async latestConversation() {
        const conversations = await this.conversations();

        if (!conversations.length) {
            return {
                conversationId: null,
                messages: [],
            };
        }

        const latest = conversations[0];
        const detail = await this.conversation(latest.id);

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
