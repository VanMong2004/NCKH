import api from './api';

import { mapCreatePaymentResponse, mapPaymentHistoryResponse, mapPaymentListResponse, mapPaymentResponse } from './mappers/paymentMapper';

const paymentService = {
    async pay(orderId, method = 'mock') {
        const res = await api.post(`/orders/${orderId}/pay`, { method });
        return mapCreatePaymentResponse(res.data);
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
        const res = await api.get(`/payments/${id}`);
        return mapPaymentResponse(res.data);
    },

    async getPaymentHistory(params = {}) {
        const res = await api.get('/payments', {
            params,
        });
console.log('PAYMENT RESPONSE', res.data);
        return mapPaymentHistoryResponse(res.data);
    },
};

export default paymentService;
