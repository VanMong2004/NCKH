import api from '../../services/api';
import { mapAdminPolicyDetailResponse, mapAdminPolicyListResponse } from '../mappers/adminPolicyMapper';

const adminPolicyService = {
    async getPolicies(params = {}) {
        const res = await api.get('/admin/policies', { params });
        return mapAdminPolicyListResponse(res.data);
    },

    async getPolicy(id) {
        const res = await api.get(`/admin/policies/${id}`);
        return mapAdminPolicyDetailResponse(res.data);
    },

    async createPolicy(payload) {
        const res = await api.post('/admin/policies', payload);
        return mapAdminPolicyDetailResponse(res.data);
    },

    async updatePolicy(id, payload) {
        const res = await api.put(`/admin/policies/${id}`, payload);
        return mapAdminPolicyDetailResponse(res.data);
    },

    async toggleActive(id) {
        const res = await api.patch(`/admin/policies/${id}/toggle-active`);
        return mapAdminPolicyDetailResponse(res.data);
    },

    async deletePolicy(id) {
        const res = await api.delete(`/admin/policies/${id}`);
        return res.data;
    },
};

export default adminPolicyService;
