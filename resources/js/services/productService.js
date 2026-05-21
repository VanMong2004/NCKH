import api from './api';
import { mapProductDetailResponse, mapProductListResponse } from './mappers/productMapper';

const productService = {
    async getProducts(params = {}) {
        const res = await api.get('/products', { params });
        return mapProductListResponse(res.data);
    },

    async getProductBySlug(slug) {
        const res = await api.get(`/products/${slug}`);
        return mapProductDetailResponse(res.data);
    },

    async getProductVariants(id) {
        const res = await api.get(`/products/${id}/variants`);
        return res.data?.data || res.data;
    },

    async getProductReviews(id) {
        const res = await api.get(`/products/${id}/reviews`);
        return res.data?.data || res.data || [];
    },
};

export default productService;
