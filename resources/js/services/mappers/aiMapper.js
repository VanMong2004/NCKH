function makeId(prefix = 'ai') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

export function mapAiSource(item = {}) {
    return {
        type: item.type || '',
        fileId: item.file_id || item.fileId || '',
        filename: item.filename || item.name || '',
        quote: item.quote || '',
        raw: item,
    };
}

export function mapAiToolCall(item = {}) {
    return {
        name: item.name || '',
        arguments: item.arguments || {},
        result: item.result || null,
        raw: item,
    };
}

export function mapAiMessage(item = {}) {
    return {
        id: item.id || makeId('msg'),
        question: item.question || '',
        answer: item.answer || '',
        source: item.source || 'openai_rag',
        sources: normalizeArray(item.sources).map(mapAiSource),
        toolCalls: normalizeArray(item.tool_calls || item.toolCalls).map(mapAiToolCall),
        products: normalizeArray(item.products),
        promotions: normalizeArray(item.promotions),
        conversationId: item.conversation_id || item.conversationId || null,
        parentMessageId: item.parent_message_id || item.parentMessageId || null,
        guestToken: item.guest_token || item.guestToken || '',
        createdAt: item.created_at || item.createdAt || '',
        raw: item.raw || item,
    };
}

export function mapAiChatResponse(response = {}, question = '') {
    const data = response.data || response;

    return mapAiMessage({
        id: data.message_id || data.id || makeId('assistant'),
        question,
        answer: data.answer || data.content || '',
        source: 'openai_rag',
        sources: data.sources || [],
        tool_calls: data.tool_calls || [],
        products: data.products || [],
        promotions: data.promotions || [],
        conversation_id: data.conversation_id || null,
        parent_message_id: data.parent_message_id || null,
        guest_token: data.guest_token || '',
        created_at: data.created_at || '',
        raw: data,
    });
}

export function mapAiConversationSummary(item = {}) {
    return {
        id: item.id,
        title: item.title || 'Hội thoại AI',
        lastMessageAt: item.last_message_at || '',
        messagesCount: Number(item.messages_count || 0),
        raw: item,
    };
}

export function mapAiConversationsResponse(response = {}) {
    const raw = response.data || [];

    return Array.isArray(raw) ? raw.map(mapAiConversationSummary) : [];
}

export function mapAiConversationDetailResponse(response = {}) {
    const data = response.data || response;
    const rawMessages = Array.isArray(data.messages) ? data.messages : [];

    const hasParentLinks = rawMessages.some((message) => message.role === 'assistant' && message.parent_message_id);

    if (hasParentLinks) {
        const userPairs = new Map();
        const pairs = [];

        rawMessages.forEach((message) => {
            if (message.role !== 'user') return;

            const pair = {
                id: message.id || makeId('pair'),
                question: message.content || '',
                answer: '',
                source: 'history',
                sources: [],
                toolCalls: [],
                products: [],
                promotions: [],
                conversationId: data.id || null,
                parentMessageId: null,
                guestToken: data.guest_token || '',
                createdAt: message.created_at || '',
                raw: {
                    userMessage: message,
                    assistantMessage: null,
                },
            };

            userPairs.set(Number(message.id), pair);
            pairs.push(pair);
        });

        rawMessages.forEach((message) => {
            if (message.role !== 'assistant') return;

            const parentId = Number(message.parent_message_id || 0);
            const pair = userPairs.get(parentId);

            if (!pair) {
                pairs.push({
                    id: message.id || makeId('pair'),
                    question: '',
                    answer: message.content || '',
                    source: 'history',
                    sources: normalizeArray(message.sources).map(mapAiSource),
                    toolCalls: normalizeArray(message.tool_calls).map(mapAiToolCall),
                    products: normalizeArray(message.products),
                    promotions: normalizeArray(message.promotions),
                    conversationId: data.id || null,
                    parentMessageId: parentId || null,
                    guestToken: data.guest_token || '',
                    createdAt: message.created_at || '',
                    raw: {
                        userMessage: null,
                        assistantMessage: message,
                    },
                });
                return;
            }

            pair.id = `${pair.id}-${message.id || 'assistant'}`;
            pair.answer = message.content || '';
            pair.sources = normalizeArray(message.sources).map(mapAiSource);
            pair.toolCalls = normalizeArray(message.tool_calls).map(mapAiToolCall);
            pair.products = normalizeArray(message.products);
            pair.promotions = normalizeArray(message.promotions);
            pair.parentMessageId = parentId;
            pair.raw.assistantMessage = message;
        });

        return {
            id: data.id || null,
            title: data.title || 'Hội thoại AI',
            guestToken: data.guest_token || '',
            messages: pairs,
            raw: data,
        };
    }

    const pairs = [];
    let currentPair = null;

    rawMessages.forEach((message) => {
        if (message.role === 'user') {
            if (currentPair) {
                pairs.push(currentPair);
            }

            currentPair = {
                id: message.id || makeId('pair'),
                question: message.content || '',
                answer: '',
                source: 'history',
                sources: [],
                toolCalls: [],
                products: [],
                promotions: [],
                conversationId: data.id || null,
                guestToken: data.guest_token || '',
                createdAt: message.created_at || '',
                raw: {
                    userMessage: message,
                    assistantMessage: null,
                },
            };

            return;
        }

        if (message.role === 'assistant') {
            if (!currentPair) {
                currentPair = {
                    id: message.id || makeId('pair'),
                    question: '',
                    answer: message.content || '',
                    source: 'history',
                    sources: normalizeArray(message.sources).map(mapAiSource),
                    toolCalls: normalizeArray(message.tool_calls).map(mapAiToolCall),
                    products: normalizeArray(message.products),
                    promotions: normalizeArray(message.promotions),
                    conversationId: data.id || null,
                    guestToken: data.guest_token || '',
                    createdAt: message.created_at || '',
                    raw: {
                        userMessage: null,
                        assistantMessage: message,
                    },
                };

                pairs.push(currentPair);
                currentPair = null;
                return;
            }

            currentPair.answer = message.content || '';
            currentPair.sources = normalizeArray(message.sources).map(mapAiSource);
            currentPair.toolCalls = normalizeArray(message.tool_calls).map(mapAiToolCall);
            currentPair.products = normalizeArray(message.products);
            currentPair.promotions = normalizeArray(message.promotions);
            currentPair.raw.assistantMessage = message;

            pairs.push(currentPair);
            currentPair = null;
        }
    });

    if (currentPair) {
        pairs.push(currentPair);
    }

    return {
        id: data.id || null,
        title: data.title || 'Hội thoại AI',
        guestToken: data.guest_token || '',
        messages: pairs,
        raw: data,
    };
}

// Giữ hàm cũ để tương thích
export function mapAiHistoryResponse(response = {}) {
    const detail = mapAiConversationDetailResponse(response);

    return detail.messages;
}
