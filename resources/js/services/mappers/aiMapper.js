export function mapAiMessage(item = {}) {
    return {
        id: item.id || `${Date.now()}-${Math.random()}`,
        question: item.question || '',
        answer: item.answer || '',
        source: item.source || 'mock',
        createdAt: item.created_at || '',
    };
}

export function mapAiHistoryResponse(response = {}) {
    const raw = response.data || [];

    return Array.isArray(raw) ? raw.map(mapAiMessage).reverse() : [];
}

export function mapAiChatResponse(response = {}) {
    return mapAiMessage(response.data || response);
}
