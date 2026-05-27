import api from './api';

import { mapPaymentListResponse, mapPaymentResponse } from './mappers/paymentMapper';

const paymentService = {
    async pay(orderId, method = 'mock') {
        const res = await api.post(`/orders/${orderId}/pay`, { method });
        return mapPaymentResponse(res.data);
    },

    async callback(params) {
        const res = await api.get('/payment/callback', { params });
        return res.data;
    },

    async getOrderPayments(orderId, params = {}) {
        const res = await api.get(`/orders/${orderId}/payments`, { params });
        return mapPaymentListResponse(res.data);
    },

    async getPaymentDetail(id) {
        const res = await api.get(`/orders/payments/${id}`);
        return mapPaymentResponse(res.data);
    },
};

export default paymentService;
