import api from '../../services/api';

import {
    mapAdminPromotionDetailResponse,
    mapAdminPromotionItemsResponse,
    mapAdminPromotionListResponse,
    normalizeAdminPromotionItemPayload,
    normalizeAdminPromotionPayload,
} from '../mappers/adminPromotionMapper';

const adminPromotionService = {
    async getPromotions(params = {}) {
        const res = await api.get('/admin/promotions', { params });
        return mapAdminPromotionListResponse(res.data);
    },

    async getPromotion(id) {
        const res = await api.get(`/admin/promotions/${id}`);
        return mapAdminPromotionDetailResponse(res.data);
    },

    async createPromotion(payload) {
        const res = await api.post('/admin/promotions', normalizeAdminPromotionPayload(payload));
        return mapAdminPromotionDetailResponse(res.data);
    },

    async updatePromotion(id, payload) {
        const res = await api.put(`/admin/promotions/${id}`, normalizeAdminPromotionPayload(payload));
        return mapAdminPromotionDetailResponse(res.data);
    },

    async deletePromotion(id) {
        const res = await api.delete(`/admin/promotions/${id}`);
        return res.data;
    },

    async publishSocial(id) {
        const res = await api.post(`/admin/promotions/${id}/publish-social`);
        return res.data;
    },

    async getPromotionItems(promotionId) {
        const res = await api.get(`/admin/promotions/${promotionId}/items`);
        return mapAdminPromotionItemsResponse(res.data);
    },

    async createPromotionItem(promotionId, payload) {
        const res = await api.post(
            `/admin/promotions/${promotionId}/items`,
            normalizeAdminPromotionItemPayload(payload),
        );
        return res.data;
    },

    async createPromotionItemsBulk(promotionId, payload) {
        const res = await api.post(`/admin/promotions/${promotionId}/items/bulk`, payload);
        return res.data;
    },

    async updatePromotionItem(itemId, payload) {
        const res = await api.put(`/admin/promotion-items/${itemId}`, normalizeAdminPromotionItemPayload(payload));
        return res.data;
    },

    async deletePromotionItem(itemId) {
        const res = await api.delete(`/admin/promotion-items/${itemId}`);
        return res.data;
    },
};

export default adminPromotionService;
