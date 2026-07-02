import api from './api';

import { mapPromotionDetailResponse, mapPromotionListResponse } from './mappers/promotionMapper';

import { mapProductListResponse } from './mappers/productMapper';

const PROMOTION_LIST_CACHE_TTL = 60 * 1000;
const PROMOTION_DETAIL_CACHE_TTL = 2 * 60 * 1000;
const PROMOTION_PRODUCTS_CACHE_TTL = 60 * 1000;

const pendingPromotionListRequests = new Map();
const pendingPromotionDetailRequests = new Map();
const pendingPromotionProductRequests = new Map();
const promotionListCache = new Map();
const promotionDetailCache = new Map();
const promotionProductCache = new Map();

function requestKey(params = {}) {
    return Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${String(value)}`)
        .join('|');
}

const promotionService = {
    async getPromotions(params = {}) {
        const key = requestKey(params);
        const cached = promotionListCache.get(key);

        if (cached && Date.now() - cached.at < PROMOTION_LIST_CACHE_TTL) {
            return cached.data;
        }

        if (pendingPromotionListRequests.has(key)) {
            return pendingPromotionListRequests.get(key);
        }

        const request = api.get('/promotions', { params })
            .then((res) => {
                const data = mapPromotionListResponse(res.data);

                promotionListCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
            .finally(() => {
                pendingPromotionListRequests.delete(key);
            });

        pendingPromotionListRequests.set(key, request);

        return request;
    },

    async getPromotionBySlug(slug) {
        const key = String(slug || '');
        const cached = promotionDetailCache.get(key);

        if (cached && Date.now() - cached.at < PROMOTION_DETAIL_CACHE_TTL) {
            return cached.data;
        }

        if (pendingPromotionDetailRequests.has(key)) {
            return pendingPromotionDetailRequests.get(key);
        }

        const request = api.get(`/promotions/${slug}`)
            .then((res) => {
                const data = mapPromotionDetailResponse(res.data);

                promotionDetailCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
            .finally(() => {
                pendingPromotionDetailRequests.delete(key);
            });

        pendingPromotionDetailRequests.set(key, request);

        return request;
    },

    async getPromotionProducts(slug, params = {}) {
        const key = `${String(slug || '')}|${requestKey(params)}`;
        const cached = promotionProductCache.get(key);

        if (cached && Date.now() - cached.at < PROMOTION_PRODUCTS_CACHE_TTL) {
            return cached.data;
        }

        if (pendingPromotionProductRequests.has(key)) {
            return pendingPromotionProductRequests.get(key);
        }

        const request = api.get(`/promotions/${slug}/products`, { params })
            .then((res) => {
                const productResult = mapProductListResponse(res.data);
                const data = {
                    ...productResult,
                    promotion: res.data?.promotion || null,
                    promotionItems: Array.isArray(res.data?.promotion_items) ? res.data.promotion_items : [],
                    raw: res.data,
                };

                promotionProductCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
            .finally(() => {
                pendingPromotionProductRequests.delete(key);
            });

        pendingPromotionProductRequests.set(key, request);

        return request;
    },
};

export default promotionService;
