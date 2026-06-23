import api from '../../services/api';

import { mapAdminProductDetailResponse, mapAdminProductListResponse } from '../mappers/adminProductMapper';

const adminProductService = {
    async getProducts(params = {}) {
        const res = await api.get('/admin/products', { params });
        return mapAdminProductListResponse(res.data);
    },

    async getProduct(id) {
        const res = await api.get(`/admin/products/${id}`);
        return mapAdminProductDetailResponse(res.data);
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
