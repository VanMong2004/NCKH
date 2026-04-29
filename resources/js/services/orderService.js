import api from './api';

const orderService = {
    // 🚀 CHECKOUT
    async checkout(payload) {
        const res = await api.post('/checkout', payload);
        return res.data; // { message, data }
    },

    // 📦 USER ORDERS
    async getMyOrders() {
        const res = await api.get('/orders');
        return res.data;
    },

    // 🔍 ORDER DETAIL
    async getOrderDetail(id) {
        const res = await api.get(`/orders/${id}`);
        return res.data;
    },

    // ❌ CANCEL ORDER
    async cancelOrder(id) {
        const res = await api.post(`/orders/${id}/cancel`);
        return res.data;
    },

    // ✅ CONFIRM RECEIVED
    async confirmReceived(id) {
        const res = await api.post(`/orders/${id}/confirm`);
        return res.data;
    },
};

export default orderService;
