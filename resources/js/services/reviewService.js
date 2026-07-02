import api from './api';
import { mapReview, mapReviewListResponse } from './mappers/reviewMapper';

const REVIEW_LIST_CACHE_TTL = 30 * 1000;

const pendingReviewListRequests = new Map();
const reviewListCache = new Map();

function requestKey(productId, params = {}) {
    const paramKey = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${String(value)}`)
        .join('|');

    return `${String(productId || '')}|${paramKey}`;
}

const reviewService = {
    async getProductReviews(productId, params = {}) {
        const key = requestKey(productId, params);
        const cached = reviewListCache.get(key);

        if (cached && Date.now() - cached.at < REVIEW_LIST_CACHE_TTL) {
            return cached.data;
        }

        if (pendingReviewListRequests.has(key)) {
            return pendingReviewListRequests.get(key);
        }

        const request = api.get(`/products/${productId}/reviews`, {
            params,
        }).then((res) => {
            const data = mapReviewListResponse(res.data);

            reviewListCache.set(key, {
                data,
                at: Date.now(),
            });

            return data;
        }).finally(() => {
            pendingReviewListRequests.delete(key);
        });

        pendingReviewListRequests.set(key, request);

        return request;
    },

    async createReview(payload) {
        const formData = buildReviewFormData(payload);

        const res = await api.post('/reviews', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        clearReviewListCache();

        return mapReview(res.data?.data || res.data);
    },

    async updateReview(reviewId, payload) {
        const formData = buildReviewFormData(payload);
        const res = await api.post(`/reviews/${reviewId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        clearReviewListCache();

        return mapReview(res.data?.data || res.data);
    },

    async deleteReview(reviewId) {
        const res = await api.delete(`/reviews/${reviewId}`);

        clearReviewListCache();

        return res.data;
    },
};

function clearReviewListCache() {
    reviewListCache.clear();
    pendingReviewListRequests.clear();
}

function buildReviewFormData(payload = {}) {
    const formData = new FormData();

    if (payload.productId) {
        formData.append('product_id', payload.productId);
    }

    if (payload.productVariantId || payload.product_variant_id) {
        formData.append('product_variant_id', payload.productVariantId || payload.product_variant_id);
    }

    if (payload.orderId) {
        formData.append('order_id', payload.orderId);
    }

    formData.append('rating', payload.rating || 5);
    formData.append('comment', payload.comment || '');

    if (Array.isArray(payload.images)) {
        payload.images.forEach((file) => {
            formData.append('images[]', file);
        });
    }

    return formData;
}

export default reviewService;
