import api from './api';

import { mapCheckoutOrderResponse, mapOrderDetailResponse, mapOrderListResponse } from './mappers/orderMapper';

const orderService = {
    async checkout(payload) {
        const res = await api.post('/orders/checkout', payload);
        return mapCheckoutOrderResponse(res.data);
    },

    async getMyOrders(params = {}) {
        const res = await api.get('/orders', { params });
        return mapOrderListResponse(res.data);
    },

    async getOrderDetail(id) {
        const res = await api.get(`/orders/${id}`);
        return mapOrderDetailResponse(res.data);
    },

    async downloadBill(id, filename = null) {
        const res = await api.get(`/orders/${id}/bill`, {
            responseType: 'blob',
        });

        downloadBlob(res.data, filename || `bill-${id}.pdf`);
    },

    async getVatInvoiceRequest(id) {
        const res = await api.get(`/orders/${id}/vat-invoice-request`);

        return res.data?.data || null;
    },

    async createVatInvoiceRequest(id, payload) {
        const res = await api.post(`/orders/${id}/vat-invoice-request`, payload);

        return res.data?.data || null;
    },

    async cancelOrder(id) {
        const res = await api.post(`/orders/${id}/cancel`);
        return mapOrderDetailResponse(res.data);
    },

    async confirmOrder(id) {
        const res = await api.post(`/orders/${id}/confirm`);
        return mapOrderDetailResponse(res.data);
    },
};

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
}

export default orderService;
