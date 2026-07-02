import api from './api';

import { mapBlogCategoriesResponse, mapBlogDetailResponse, mapBlogListResponse } from './mappers/blogMapper';

const BLOG_LIST_CACHE_TTL = 60 * 1000;
const BLOG_DETAIL_CACHE_TTL = 2 * 60 * 1000;
const BLOG_CATEGORY_CACHE_TTL = 5 * 60 * 1000;

const pendingBlogListRequests = new Map();
const pendingBlogDetailRequests = new Map();
let pendingBlogCategoryRequest = null;
const blogListCache = new Map();
const blogDetailCache = new Map();
let blogCategoryCache = null;
let blogCategoryCacheAt = 0;

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

    async getCategories() {
        if (blogCategoryCache && Date.now() - blogCategoryCacheAt < BLOG_CATEGORY_CACHE_TTL) {
            return blogCategoryCache;
        }

        if (!pendingBlogCategoryRequest) {
            pendingBlogCategoryRequest = api.get('/blogs/categories')
                .then((res) => {
                    const data = mapBlogCategoriesResponse(res.data);

                    blogCategoryCache = data;
                    blogCategoryCacheAt = Date.now();

                    return data;
                })
                .finally(() => {
                    pendingBlogCategoryRequest = null;
                });
        }

        return pendingBlogCategoryRequest;
    },
};

export default blogService;
