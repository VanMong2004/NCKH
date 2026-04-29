const CART_STORAGE_KEY = 'shopping_cart';

const cartService = {
    async getCart() {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    async saveCart(cartItems) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        return cartItems;
    },

    async clearCart() {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
    },

// Phần dưới này là khi be có API mới mở, phía trên chỉ là làm tạm lưu vào storage thôi
    //  async getCart() {
    //     const res = await apiClient.get('/cart');
    //     return res.data;
    // },

    // async addItem(payload) {
    //     const res = await apiClient.post('/cart/items', payload);
    //     return res.data;
    // },

    // async updateItem(cartItemId, payload) {
    //     const res = await apiClient.put(`/cart/items/${cartItemId}`, payload);
    //     return res.data;
    // },

    // async removeItem(cartItemId) {
    //     const res = await apiClient.delete(`/cart/items/${cartItemId}`);
    //     return res.data;
    // },

    // async clearCart() {
    //     const res = await apiClient.delete('/cart');
    //     return res.data;
    // },
};

export default cartService;