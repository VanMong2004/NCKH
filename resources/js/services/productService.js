import api from './api';

const productService = {
    async getProducts() {
        const res = await api.get('/products');
        return res.data;
    },

    async getProductById(id) {
        const res = await api.get(`/products/${id}`);
        return res.data;
    },
};

export default productService;
