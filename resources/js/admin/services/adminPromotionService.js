import api from '../../services/api';

import {
    mapAdminPromotionDetailResponse,
    mapAdminPromotionItemsResponse,
    mapAdminPromotionListResponse,
    mapAvailablePromotionProductsResponse,
    normalizeAdminPromotionItemPayload,
    normalizeAdminPromotionPayload,
    normalizePromotionBulkItemsPayload,
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
        const formData = buildPromotionFormData(payload);

        const res = await api.post('/admin/promotions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapAdminPromotionDetailResponse(res.data);
    },

    async updatePromotion(id, payload) {
        const formData = buildPromotionFormData(payload);

        /*
         * Dùng POST + _method=PUT để upload file ổn định hơn.
         * Laravel sẽ hiểu request này là PUT nhờ _method.
         */
        formData.append('_method', 'PUT');

        const res = await api.post(`/admin/promotions/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapAdminPromotionDetailResponse(res.data);
    },

    async deletePromotion(id) {
        const res = await api.delete(`/admin/promotions/${id}`);
        return res.data;
    },

    async generateFacebookCaption(id, payload = {}) {
        const res = await api.post(`/admin/promotions/${id}/facebook-caption`, payload);
        return res.data;
    },

    async publishSocial(id, payload = {}) {
        const res = await api.post(`/admin/promotions/${id}/publish-social`, payload);
        return res.data;
    },

    async getPromotionItems(promotionId) {
        const res = await api.get(`/admin/promotions/${promotionId}/items`);
        return mapAdminPromotionItemsResponse(res.data);
    },

    async getAvailableProducts(promotionId, params = {}) {
        const res = await api.get(`/admin/promotions/${promotionId}/available-products`, {
            params,
        });

        return mapAvailablePromotionProductsResponse(res.data);
    },

    async createPromotionItem(promotionId, payload) {
        const res = await api.post(
            `/admin/promotions/${promotionId}/items`,
            normalizeAdminPromotionItemPayload(payload),
        );

        return res.data;
    },

    async createPromotionItemsBulk(promotionId, payload) {
        const res = await api.post(
            `/admin/promotions/${promotionId}/items/bulk`,
            normalizePromotionBulkItemsPayload(payload),
        );

        return res.data;
    },

    async updatePromotionItem(itemId, payload) {
        const res = await api.put(`/admin/promotions/items/${itemId}`, normalizeAdminPromotionItemPayload(payload));

        return res.data;
    },

    async deletePromotionItem(itemId) {
        const res = await api.delete(`/admin/promotions/items/${itemId}`);
        return res.data;
    },
};

function buildPromotionFormData(payload = {}) {
    const normalized = normalizeAdminPromotionPayload(payload);
    const formData = new FormData();

    formData.append('title', normalized.title);
    formData.append('slug', normalized.slug);
    formData.append('description', normalized.description || '');
    formData.append('start_date', normalized.start_date);
    formData.append('end_date', normalized.end_date);
    formData.append('status', normalized.status);
    formData.append('is_active', normalized.is_active ? '1' : '0');

    if (payload.bannerFile instanceof File) {
        formData.append('banner', payload.bannerFile);
    }

    if (payload.thumbnailFile instanceof File) {
        formData.append('thumbnail', payload.thumbnailFile);
    }

    return formData;
}

export default adminPromotionService;
