export function mapFaq(item = {}) {
    return {
        id: item.id,
        category: item.category || '',
        question: item.question || '',
        answer: item.answer || '',
        raw: item,
    };
}

export function mapFaqListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        faqs: raw.map(mapFaq),
        success: Boolean(response.success),
        message: response.message || '',
        raw: response,
    };
}

export function mapFaqCategoriesResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map((item) => String(item));
}
