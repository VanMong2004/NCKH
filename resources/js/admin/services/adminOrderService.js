import api from '../../services/api';

import { mapAdminOrderDetailResponse, mapAdminOrderListResponse } from '../mappers/adminOrderMapper';

const adminOrderService = {
    async getOrders(params = {}) {
        const res = await api.get('/admin/orders', { params });
        return mapAdminOrderListResponse(res.data);
    },

    async getOrder(id) {
        const res = await api.get(`/admin/orders/${id}`);
        return mapAdminOrderDetailResponse(res.data);
    },

    async updateStatus(id, payload) {
        const res = await api.patch(`/admin/orders/${id}/status`, {
            status: payload.status,
            cancel_reason: payload.cancel_reason || undefined,
            note: payload.note || undefined,
        });

        return mapAdminOrderDetailResponse(res.data);
    },

    async updateVatInvoiceStatus(id, payload) {
        const res = await api.patch(`/admin/orders/${id}/vat-invoice-status`, {
            status: payload.status,
            admin_note: payload.admin_note || undefined,
        });

        return mapAdminOrderDetailResponse(res.data);
    },
};

export default adminOrderService;
