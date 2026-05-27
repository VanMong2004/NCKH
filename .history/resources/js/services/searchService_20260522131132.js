import api from './api';

const searchService = {
    async suggestions(keyword) {
        const res = await api.get('/search/suggestions', {
            params: { keyword },
        });

        return res.data?.data || [];
    },

    async history() {
        const res = await api.get('/search/history');
        return res.data?.data || [];
    },

    async deleteHistory(id) {
        const res = await api.delete(`/search/history/${id}`);
        return res.data;
    },

    async clearHistory() {
        const res = await api.delete('/search/history');
        return res.data;
    },
};

export default searchService;
