import api from './api';

import {
    mapCategoryDetailResponse,
    mapCategoryListResponse,
    mapCategoryProductsResponse,
    mapCategoryTreeResponse,
} from './mappers/categoryMapper';

const categoryService = {
    async getCategories(params = {}) {
        const res = await api.get('/categories', { params });
        return mapCategoryListResponse(res.data);
    },

    async getTree() {
        const res = await api.get('/categories/tree');
        return mapCategoryTreeResponse(res.data);
    },

    async getCategory(id) {
        const res = await api.get(`/categories/${id}`);
        return mapCategoryDetailResponse(res.data);
    },

    async getCategoryProducts(id, params = {}) {
        const res = await api.get(`/categories/${id}/products`, { params });
        return mapCategoryProductsResponse(res.data);
    },
};

export default categoryService;
