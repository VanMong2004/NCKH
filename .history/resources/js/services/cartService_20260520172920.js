import api from './api';
import { mapCartResponse } from './mappers/cartMapper';

const cartService = {
    async getCart() {
        const res = await api.get('/cart');
        return mapCartResponse(res.data);
    },

    async addToCart(payload) {
        const res = await api.post('/cart', payload);
        return res.data;
    },

    async updateItem(cartItemId, quantity) {
        const res = await api.put(`/cart/${cartItemId}`, { quantity });
        return res.data;
    },

    async removeItem(cartItemId) {
        const res = await api.delete(`/cart/${cartItemId}`);
        return res.data;
    },
};

export default cartService;