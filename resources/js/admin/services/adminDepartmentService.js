import api from '../../services/api';

import {
    mapAdminDepartmentDetailResponse,
    mapAdminDepartmentListResponse,
    mapDepartmentOptionsResponse,
} from '../mappers/adminDepartmentMapper';

const adminDepartmentService = {
    async getDepartments(params = {}) {
        const res = await api.get('/admin/departments', { params });
        return mapAdminDepartmentListResponse(res.data);
    },

    async getActiveOptions() {
        const res = await api.get('/admin/departments/active-options');
        return mapDepartmentOptionsResponse(res.data);
    },

    async createDepartment(payload) {
        const res = await api.post('/admin/departments', payload);
        return mapAdminDepartmentDetailResponse(res.data);
    },

    async updateDepartment(id, payload) {
        const res = await api.put(`/admin/departments/${id}`, payload);
        return mapAdminDepartmentDetailResponse(res.data);
    },

    async toggleActive(id, isActive) {
        const res = await api.patch(`/admin/departments/${id}/toggle-active`, {
            is_active: Boolean(isActive),
        });
        return mapAdminDepartmentDetailResponse(res.data);
    },

    async deleteDepartment(id) {
        const res = await api.delete(`/admin/departments/${id}`);
        return res.data;
    },
};

export default adminDepartmentService;
