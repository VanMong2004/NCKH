import api from '../../services/api';

import {
    mapAdminReviewDetailResponse,
    mapAdminReviewListResponse,
    mapAdminReviewStatisticsResponse,
} from '../mappers/adminReviewMapper';

const adminReviewService = {
    async getReviews(params = {}) {
        const res = await api.get('/admin/reviews', { params });
        return mapAdminReviewListResponse(res.data);
    },

    async getStatistics() {
        const res = await api.get('/admin/reviews/statistics');
        return mapAdminReviewStatisticsResponse(res.data);
    },

    async getReview(id) {
        const res = await api.get(`/admin/reviews/${id}`);
        return mapAdminReviewDetailResponse(res.data);
    },

    async hideReview(id) {
        const res = await api.patch(`/admin/reviews/${id}/hide`);
        return mapAdminReviewDetailResponse(res.data);
    },

    async showReview(id) {
        const res = await api.patch(`/admin/reviews/${id}/show`);
        return mapAdminReviewDetailResponse(res.data);
    },

    async deleteReview(id) {
        const res = await api.delete(`/admin/reviews/${id}`);
        return res.data;
    },
};

export default adminReviewService;
