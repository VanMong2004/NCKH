import api from './api';

import { mapPromotionDetailResponse, mapPromotionListResponse } from './mappers/promotionMapper';

import { mapProductListResponse } from './mappers/productMapper';

const promotionService = {
    async getPromotions(params = {}) {
        const res = await api.get('/promotions', { params });
        return mapPromotionListResponse(res.data);
    },

    async getPromotionBySlug(slug) {
        const res = await api.get(`/promotions/${slug}`);
        return mapPromotionDetailResponse(res.data);
    },

    async getPromotionProducts(slug, params = {}) {
        const res = await api.get(`/promotions/${slug}/products`, { params });

        const productResult = mapProductListResponse(res.data);

        return {
            ...productResult,
            promotion: res.data?.promotion || null,
            promotionItems: Array.isArray(res.data?.promotion_items) ? res.data.promotion_items : [],
            raw: res.data,
        };
    },
};

export default promotionService;
