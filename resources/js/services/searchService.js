import api from './api';

import {
    mapProductFallbackResponse,
    mapSearchActionResponse,
    mapSearchHistoryResponse,
    mapSearchSuggestionsResponse,
} from './mappers/searchMapper';

function isUnauthenticatedError(error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    return status === 401 || status === 403 || message === 'Unauthenticated.' || message === 'Vui lòng đăng nhập';
}

function isValidationError(error) {
    return error?.response?.status === 400 || error?.response?.status === 422;
}

async function getProductFallback(keyword) {
    const value = String(keyword || '').trim();

    if (value.length < 2) {
        return [];
    }

    try {
        const res = await api.get('/products', {
            params: {
                keyword: value,
                page: 1,
                per_page: 6,
            },
        });

        return mapProductFallbackResponse(res.data);
    } catch {
        return [];
    }
}

const searchService = {
    async suggestions(keyword) {
        const value = String(keyword || '').trim();

        if (value.length < 2) {
            return [];
        }

        try {
            const res = await api.get('/search/suggestions', {
                params: {
                    keyword: value,
                },
            });

            const suggestions = mapSearchSuggestionsResponse(res.data);

            if (suggestions.length > 0) {
                return suggestions;
            }

            return await getProductFallback(value);
        } catch (error) {
            if (isValidationError(error) || isUnauthenticatedError(error)) {
                return await getProductFallback(value);
            }

            return await getProductFallback(value);
        }
    },

    async history() {
        try {
            const res = await api.get('/search/history');

            return mapSearchHistoryResponse(res.data);
        } catch (error) {
            if (isUnauthenticatedError(error)) {
                return [];
            }

            throw error;
        }
    },

    async deleteHistory(id) {
        if (!id) {
            return {
                success: false,
                message: 'Không tìm thấy lịch sử cần xóa.',
            };
        }

        try {
            const res = await api.delete(`/search/history/${id}`);

            return mapSearchActionResponse(res.data);
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

            return mapSearchActionResponse(res.data);
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
