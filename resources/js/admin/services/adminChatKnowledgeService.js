import api from '../../services/api';

import {
    mapAdminChatKnowledgeDetailResponse,
    mapAdminChatKnowledgeListResponse,
} from '../mappers/adminChatKnowledgeMapper';

function cleanParams(params = {}) {
    const result = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            result[key] = value;
        }
    });

    return result;
}

const adminChatKnowledgeService = {
    async getFiles(params = {}) {
        const res = await api.get('/admin/chat/knowledge', {
            params: cleanParams(params),
        });

        return mapAdminChatKnowledgeListResponse(res.data);
    },

    async getFile(id) {
        const res = await api.get(`/admin/chat/knowledge/${id}`);
        return mapAdminChatKnowledgeDetailResponse(res.data);
    },

    async uploadFile(payload = {}) {
        const formData = new FormData();

        if (payload.file) {
            formData.append('file', payload.file);
        }

        formData.append('title', payload.title || '');
        formData.append('description', payload.description || '');

        const res = await api.post('/admin/chat/knowledge/upload', formData, {
            timeout: 180000,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapAdminChatKnowledgeDetailResponse(res.data);
    },

    async toggleFile(id) {
        const res = await api.patch(`/admin/chat/knowledge/${id}/toggle`);
        return mapAdminChatKnowledgeDetailResponse(res.data);
    },

    async deleteFile(id) {
        const res = await api.delete(`/admin/chat/knowledge/${id}`, {
            timeout: 120000,
        });

        return res.data;
    },
};

export default adminChatKnowledgeService;
