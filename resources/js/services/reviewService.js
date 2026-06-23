import api from './api';
import { mapReview, mapReviewListResponse } from './mappers/reviewMapper';

const reviewService = {
    async getProductReviews(productId, params = {}) {
        const res = await api.get(`/products/${productId}/reviews`, {
            params,
        });

        return mapReviewListResponse(res.data);
    },

    async createReview(payload) {
        const formData = buildReviewFormData(payload);

        const res = await api.post('/reviews', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapReview(res.data?.data || res.data);
    },

    async updateReview(reviewId, payload) {
        const formData = buildReviewFormData(payload);

        formData.append('_method', 'PUT');

        const res = await api.post(`/reviews/${reviewId}?_method=PUT`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapReview(res.data?.data || res.data);
    },

    async deleteReview(reviewId) {
        const res = await api.delete(`/reviews/${reviewId}`);

        return res.data;
    },
};

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
