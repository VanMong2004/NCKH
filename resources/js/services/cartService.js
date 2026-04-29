import api from './api';

const cartService = {
    // 🛒 GET CART
    async getCart() {
        const res = await api.get('/cart');
        return res.data;
    },

    // ➕ ADD TO CART
    async addToCart(payload) {
        const res = await api.post('/cart/add', payload);
        return res.data;
    },

    // 🔄 UPDATE ITEM
    async updateItem(payload) {
        const res = await api.put('/cart/update', payload);
        return res.data;
    },

    // ❌ REMOVE ITEM
    async removeItem(payload) {
        const res = await api.delete('/cart/remove', {
            data: payload,
        });
        return res.data;
    },
};

export default cartService;
