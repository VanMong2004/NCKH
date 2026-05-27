import api from './api';

import { mapCheckoutOrderResponse, mapOrderDetailResponse, mapOrderListResponse } from './mappers/orderMapper';

const orderService = {
async checkout(payload) {
    const res = await api.post('/orders/checkout', payload);
    return mapCheckoutOrderResponse(res.data);
}
    async getMyOrders(params = {}) {
        const res = await api.get('/orders', { params });
        return mapOrderListResponse(res.data);
    },

    async getOrderDetail(id) {
        const res = await api.get(`/orders/${id}`);
        return mapOrderDetailResponse(res.data);
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

export default orderService;
