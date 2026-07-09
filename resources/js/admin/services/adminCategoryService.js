import api from '../../services/api';

import {
    mapAdminCategoryDetailResponse,
    mapAdminCategoryListResponse,
    mapCategoryOptionsResponse,
} from '../mappers/adminCategoryMapper';

const adminCategoryService = {
    async getCategories(params = {}) {
        const res = await api.get('/admin/categories', { params });
        return mapAdminCategoryListResponse(res.data);
    },

    async getActiveOptions() {
        const res = await api.get('/admin/categories/active-options');
        return mapCategoryOptionsResponse(res.data);
    },

    async createCategory(payload) {
        const res = await api.post('/admin/categories', payload);
        return mapAdminCategoryDetailResponse(res.data);
    },

    async updateCategory(id, payload) {
        const res = await api.put(`/admin/categories/${id}`, payload);
        return mapAdminCategoryDetailResponse(res.data);
    },

    async toggleActive(id, isActive) {
        const res = await api.patch(`/admin/categories/${id}/toggle-active`, {
            is_active: Boolean(isActive),
        });
        return mapAdminCategoryDetailResponse(res.data);
    },

    async deleteCategory(id) {
        const res = await api.delete(`/admin/categories/${id}`);
        return res.data;
    },
};

export default adminCategoryService;
