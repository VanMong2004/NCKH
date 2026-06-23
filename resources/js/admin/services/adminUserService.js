import api from '../../services/api';

import { mapAdminUserDetailResponse, mapAdminUserListResponse } from '../mappers/adminUserMapper';

const adminUserService = {
    async getUsers(params = {}) {
        const res = await api.get('/admin/users', { params });
        return mapAdminUserListResponse(res.data);
    },

    async getUser(id) {
        const res = await api.get(`/admin/users/${id}`);
        return mapAdminUserDetailResponse(res.data);
    },

    async updateRole(id, role) {
        const res = await api.patch(`/admin/users/${id}/role`, {
            role,
        });

        return mapAdminUserDetailResponse(res.data);
    },

    async lockUser(id) {
        const res = await api.delete(`/admin/users/${id}`);
        return res.data;
    },

    async restoreUser(id) {
        const res = await api.patch(`/admin/users/${id}/restore`);
        return mapAdminUserDetailResponse(res.data);
    },
};

export default adminUserService;
