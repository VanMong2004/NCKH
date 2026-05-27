import api from './api';

import { mapFaqCategoriesResponse, mapFaqListResponse } from './mappers/faqMapper';

const faqService = {
    async getFaqs(params = {}) {
        const res = await api.get('/faqs', { params });
        return mapFaqListResponse(res.data);
    },

    async getCategories() {
        const res = await api.get('/faqs/categories');
        return mapFaqCategoriesResponse(res.data);
    },
};

export default faqService;
