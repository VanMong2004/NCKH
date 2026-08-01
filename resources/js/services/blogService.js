import api from './api';

import { mapBlogDetailResponse, mapBlogListResponse } from './mappers/blogMapper';

const BLOG_LIST_CACHE_TTL = 60 * 1000;
const BLOG_DETAIL_CACHE_TTL = 2 * 60 * 1000;

const pendingBlogListRequests = new Map();
const pendingBlogDetailRequests = new Map();
const blogListCache = new Map();
const blogDetailCache = new Map();

function requestKey(params = {}) {
    return Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${String(value)}`)
        .join('|');
}

const blogService = {
    async getBlogs(params = {}) {
        const key = requestKey(params);
        const cached = blogListCache.get(key);

        if (cached && Date.now() - cached.at < BLOG_LIST_CACHE_TTL) {
            return cached.data;
        }

        if (pendingBlogListRequests.has(key)) {
            return pendingBlogListRequests.get(key);
        }

        const request = api.get('/blogs', { params })
            .then((res) => {
                const data = mapBlogListResponse(res.data);

                blogListCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
            .finally(() => {
                pendingBlogListRequests.delete(key);
            });

        pendingBlogListRequests.set(key, request);

        return request;
    },

    async getBlogDetail(slug) {
        const key = String(slug || '');
        const cached = blogDetailCache.get(key);

        if (cached && Date.now() - cached.at < BLOG_DETAIL_CACHE_TTL) {
            return cached.data;
        }

        if (pendingBlogDetailRequests.has(key)) {
            return pendingBlogDetailRequests.get(key);
        }

        const request = api.get(`/blogs/${slug}`)
            .then((res) => {
                const data = mapBlogDetailResponse(res.data);

                blogDetailCache.set(key, {
                    data,
                    at: Date.now(),
                });

                return data;
            })
            .finally(() => {
                pendingBlogDetailRequests.delete(key);
            });

        pendingBlogDetailRequests.set(key, request);

        return request;
    },
};

export default blogService;
