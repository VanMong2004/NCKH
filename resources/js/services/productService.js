import api from './api';
import { mapProductDetailResponse, mapProductListResponse } from './mappers/productMapper';

const PRODUCT_LIST_CACHE_TTL = 30 * 1000;
const PRODUCT_DETAIL_CACHE_TTL = 2 * 60 * 1000;

const pendingListRequests = new Map();
const pendingDetailRequests = new Map();
const listCache = new Map();
const detailCache = new Map();

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
        const cached = listCache.get(key);

        if (cached && Date.now() - cached.at < PRODUCT_LIST_CACHE_TTL) {
            return cached.data;
        }

        if (pendingListRequests.has(key)) {
            return pendingListRequests.get(key);
        }

        const request = api
            .get('/products', { params })
            .then((res) => {
                const data = mapProductListResponse(res.data);

                listCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
            .finally(() => {
                pendingListRequests.delete(key);
            });

        pendingListRequests.set(key, request);

        return request;
    },

    async getProductBySlug(slug) {
        const key = String(slug || '');
        const cached = detailCache.get(key);

        if (cached && Date.now() - cached.at < PRODUCT_DETAIL_CACHE_TTL) {
            return cached.data;
        }

        if (pendingDetailRequests.has(key)) {
            return pendingDetailRequests.get(key);
        }

        const request = api
            .get(`/products/${slug}`)
            .then((res) => {
                const data = mapProductDetailResponse(res.data);

                detailCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
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
