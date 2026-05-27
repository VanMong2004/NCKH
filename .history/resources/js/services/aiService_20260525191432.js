import api from './api';

import { mapAiChatResponse, mapAiHistoryResponse } from './mappers/aiMapper';

const aiService = {
    async chat(message) {
        const res = await api.post('/ai/chat', {
            message,
        });

        return mapAiChatResponse(res.data);
    },

    async history() {
        const res = await api.get('/ai/history');

        return mapAiHistoryResponse(res.data);
    },
};

export default aiService;
