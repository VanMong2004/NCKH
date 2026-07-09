import api from '../../services/api';

import { mapAdminContactDetailResponse, mapAdminContactListResponse } from '../mappers/adminContactMapper';

const adminContactService = {
    async getContacts(params = {}) {
        const res = await api.get('/admin/contacts', { params });
        return mapAdminContactListResponse(res.data);
    },

    async getContact(id) {
        const res = await api.get(`/admin/contacts/${id}`);
        return mapAdminContactDetailResponse(res.data);
    },

    async updateStatus(id, status) {
        const res = await api.patch(`/admin/contacts/${id}/status`, { status });
        return mapAdminContactDetailResponse(res.data);
    },

    async updateNote(id, adminNote) {
        const res = await api.patch(`/admin/contacts/${id}/note`, {
            admin_note: adminNote || '',
        });
        return mapAdminContactDetailResponse(res.data);
    },

    async deleteContact(id) {
        const res = await api.delete(`/admin/contacts/${id}`);
        return res.data;
    },
};

export default adminContactService;
