import api from './api';

import { mapCartActionResponse, mapCartResponse } from './mappers/cartMapper';

const cartService = {
    async getCart() {
        const res = await api.get('/cart');
        return mapCartResponse(res.data);
    },

    async addToCart(payload) {
        const res = await api.post('/cart', payload);
        return mapCartActionResponse(res.data);
    },

    async updateItem(cartItemId, quantity) {
        const res = await api.put(`/cart/${cartItemId}`, {
            quantity,
        });

        return mapCartActionResponse(res.data);
    },

    async removeItem(cartItemId) {
        const res = await api.delete(`/cart/${cartItemId}`);
        return mapCartActionResponse(res.data);
    },

    async getCount() {
        const res = await api.get('/cart/count');
        return res.data;
    },
};

export default cartService;
