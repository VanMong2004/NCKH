import api from './api';

const categoryService = {
    async getCategories() {
        const res = await api.get('/categories');
        return res.data;
    },
};

export default categoryService;