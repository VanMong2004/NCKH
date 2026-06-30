import api from './api';
import { mapProductDetailResponse, mapProductListResponse } from './mappers/productMapper';

const pendingListRequests = new Map();
const pendingDetailRequests = new Map();

function requestKey(params = {}) {
    return Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${String(value)}`)
        .join('|');
}

const productService = {
    async getProducts(params = {}) {
        const key = requestKey(params);

        if (pendingListRequests.has(key)) {
            return pendingListRequests.get(key);
        }

        const request = api
            .get('/products', { params })
            .then((res) => mapProductListResponse(res.data))
            .finally(() => {
                pendingListRequests.delete(key);
            });

        pendingListRequests.set(key, request);

        return request;
    },

    async getProductBySlug(slug) {
        const key = String(slug || '');

        if (pendingDetailRequests.has(key)) {
            return pendingDetailRequests.get(key);
        }

        const request = api
            .get(`/products/${slug}`)
            .then((res) => mapProductDetailResponse(res.data))
            .finally(() => {
                pendingDetailRequests.delete(key);
            });

        pendingDetailRequests.set(key, request);

        return request;
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
