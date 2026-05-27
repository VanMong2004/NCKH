import api from './api';

import { mapBlogDetailResponse, mapBlogListResponse } from './mappers/blogMapper';

const blogService = {
    async getBlogs(params = {}) {
        const res = await api.get('/blogs', { params });
        return mapBlogListResponse(res.data);
    },

    async getBlogDetail(slug) {
        const res = await api.get(`/blogs/${slug}`);
        return mapBlogDetailResponse(res.data);
    },
};

export default blogService;
