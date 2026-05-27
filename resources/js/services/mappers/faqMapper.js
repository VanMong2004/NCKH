export function mapFaq(item = {}) {
    return {
        id: item.id,
        category: item.category || 'Chung',
        question: item.question || '',
        answer: item.answer || '',
        raw: item,
    };
}

export function mapFaqListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        faqs: raw.map(mapFaq),
        success: Boolean(response.success ?? true),
        message: response.message || '',
    };
}

export function mapFaqCategoriesResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.filter(Boolean).map((item) => String(item));
}
