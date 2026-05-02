import api from './api';

const paymentService = {
    // 💳 PAY
    async pay(orderId) {
        const res = await api.post(`/orders/${orderId}/pay`);
        return res.data; // { status, message }
    },

    // 🔁 CALLBACK (rarely dùng ở FE)
    async callback(params) {
        const res = await api.get('/payment/callback', {
            params,
        });
        return res.data;
    },
};

export default paymentService;
