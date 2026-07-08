import api from '../../services/api';

import { mapAdminProductDetailResponse, mapAdminProductListResponse } from '../mappers/adminProductMapper';

const pendingListRequests = new Map();
const pendingDetailRequests = new Map();

function requestKey(params = {}) {
    return Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${String(value)}`)
        .join('|');
}

const adminProductService = {
    async getProducts(params = {}) {
        const key = requestKey(params);

        if (pendingListRequests.has(key)) {
            return pendingListRequests.get(key);
        }

        const request = api
            .get('/admin/products', { params })
            .then((res) => mapAdminProductListResponse(res.data))
            .finally(() => {
                pendingListRequests.delete(key);
            });

        pendingListRequests.set(key, request);

        return request;
    },

    async getProduct(id) {
        const key = String(id || '');

        if (pendingDetailRequests.has(key)) {
            return pendingDetailRequests.get(key);
        }

        const request = api
            .get(`/admin/products/${id}`)
            .then((res) => mapAdminProductDetailResponse(res.data))
            .finally(() => {
                pendingDetailRequests.delete(key);
            });

        pendingDetailRequests.set(key, request);

        return request;
    },

    async createProduct(payload) {
        const formData = buildProductFormData(payload, {
            includeImages: true,
        });

        const res = await api.post('/admin/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapAdminProductDetailResponse(res.data);
    },

    async updateProduct(id, payload) {
        const formData = buildProductFormData(payload, {
            includeImages: Array.isArray(payload.images) && payload.images.length > 0,
        });

        const res = await api.post(`/admin/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapAdminProductDetailResponse(res.data);
    },

    async deleteProduct(id) {
        const res = await api.delete(`/admin/products/${id}`);
        return res.data;
    },

    async toggleProductSale(id, isActive) {
        const res = await api.post(`/admin/products/${id}/toggle-sale`, {
            is_active: Boolean(isActive),
        });
        return res.data;
    },

    async toggleVariantSale(id, isActive) {
        const res = await api.post(`/admin/products/variants/${id}/toggle-sale`, {
            is_active: Boolean(isActive),
        });
        return res.data;
    },

    async generateFacebookCaption(id, payload = {}) {
        const res = await api.post(`/admin/products/${id}/facebook-caption`, payload);
        return res.data;
    },

    async postFacebook(id, payload = {}) {
        const res = await api.post(`/admin/products/${id}/post-facebook`, payload);
        return res.data;
    },
};

function normalizeBoolean(value) {
    return value === true || value === 1 || value === '1';
}

function buildProductFormData(payload = {}, options = {}) {
    const formData = new FormData();

    formData.append('name', payload.name || '');
    formData.append('description', payload.description || '');
    formData.append('category_id', payload.category_id || '');
    formData.append('department_id', payload.department_id || '');
    formData.append('author', payload.author || '');

    formData.append('is_active', normalizeBoolean(payload.is_active) ? '1' : '0');
    formData.append('is_featured', normalizeBoolean(payload.is_featured) ? '1' : '0');

    if (options.includeImages && Array.isArray(payload.images)) {
        payload.images.forEach((file) => {
            if (file instanceof File) {
                formData.append('images[]', file);
            }
        });
    }

    if (Array.isArray(payload.variants)) {
        payload.variants.forEach((variant, index) => {
            if (variant.id) {
                formData.append(`variants[${index}][id]`, variant.id);
            }

            formData.append(`variants[${index}][sku]`, variant.sku || '');
            formData.append(`variants[${index}][size]`, variant.size || '');
            formData.append(`variants[${index}][color]`, variant.color || '');
            formData.append(`variants[${index}][price]`, variant.price ?? 0);
            formData.append(`variants[${index}][stock]`, variant.stock ?? 0);
        });
    }

    return formData;
}

export default adminProductService;
