import api from './api';

function isUnauthenticatedError(error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    return status === 401 || message === 'Unauthenticated.';
}

const searchService = {
    async suggestions(keyword) {
        const value = String(keyword || '').trim();

        if (value.length < 2) {
            return [];
        }

        try {
            const res = await api.get('/search/suggestions', {
                params: { keyword: value },
            });

            return res.data?.data || [];
        } catch (error) {
            if (isUnauthenticatedError(error)) {
                return [];
            }

            throw error;
        }
    },

    async history() {
        try {
            const res = await api.get('/search/history');
            return res.data?.data || [];
        } catch (error) {
            if (isUnauthenticatedError(error)) {
                return [];
            }

            throw error;
        }
    },

    async deleteHistory(id) {
        try {
            const res = await api.delete(`/search/history/${id}`);
            return res.data;
        } catch (error) {
            if (isUnauthenticatedError(error)) {
                return {
                    success: false,
                    message: 'Bạn cần đăng nhập để xóa lịch sử tìm kiếm.',
                };
            }

            throw error;
        }
    },

    async clearHistory() {
        try {
            const res = await api.delete('/search/history');
            return res.data;
        } catch (error) {
            if (isUnauthenticatedError(error)) {
                return {
                    success: false,
                    message: 'Bạn cần đăng nhập để xóa lịch sử tìm kiếm.',
                };
            }

            throw error;
        }
    },
};

export default searchService;
