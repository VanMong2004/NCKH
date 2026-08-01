import api from '../../services/api';
import { mapAdminBlogDetailResponse, mapAdminBlogListResponse } from '../mappers/adminBlogMapper';

const adminBlogService = {
    async getBlogs(params = {}) {
        const res = await api.get('/admin/blogs', { params });
        return mapAdminBlogListResponse(res.data);
    },

    async getBlog(id) {
        const res = await api.get(`/admin/blogs/${id}`);
        return mapAdminBlogDetailResponse(res.data);
    },

    async createBlog(payload) {
        const res = await api.post('/admin/blogs', payload);
        return mapAdminBlogDetailResponse(res.data);
    },

    async updateBlog(id, payload) {
        const res = await api.post(`/admin/blogs/${id}`, payload);
        return mapAdminBlogDetailResponse(res.data);
    },

    async updateStatus(id, status) {
        const res = await api.patch(`/admin/blogs/${id}/status`, { status });
        return mapAdminBlogDetailResponse(res.data);
    },

    async deleteBlog(id) {
        const res = await api.delete(`/admin/blogs/${id}`);
        return res.data;
    },
};

export default adminBlogService;
