function toNumber(value) {
    return Number(value || 0);
}

export function getChatConversationStatusText(status) {
    const map = {
        active: 'Đang hoạt động',
        expired: 'Đã hết hạn',
        closed: 'Đã đóng',
    };

    return map[status] || 'Không rõ';
}

export function mapAdminChatConversation(item = {}) {
    return {
        id: item.id,
        title: item.title || 'Hội thoại AI',
        status: item.status || '',
        statusText: getChatConversationStatusText(item.status),
        user: item.user || null,
        guestToken: item.guest_token || '',
        messagesCount: toNumber(item.messages_count),
        summary: item.summary || '',
        lastMessageAt: item.last_message_at || '',
        expiredAt: item.expired_at || '',
        createdAt: item.created_at || '',
        messages: Array.isArray(item.messages) ? item.messages.map(mapAdminChatMessage) : [],
        raw: item,
    };
}

export function mapAdminChatMessage(item = {}) {
    return {
        id: item.id,
        parentMessageId: item.parent_message_id || null,
        role: item.role || '',
        content: item.content || '',
        sources: Array.isArray(item.sources) ? item.sources : [],
        toolCalls: Array.isArray(item.tool_calls) ? item.tool_calls : [],
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
        products: Array.isArray(item.products) ? item.products : [],
        createdAt: item.created_at || '',
        raw: item,
    };
}

export function mapAdminChatConversationListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        conversations: raw.map(mapAdminChatConversation),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminChatConversationDetailResponse(response = {}) {
    return mapAdminChatConversation(response.data || {});
}

export function mapAdminChatConversationStatisticsResponse(response = {}) {
    const data = response.data || {};

    return {
        totalSessions: toNumber(data.total_sessions),
        activeSessions: toNumber(data.active_sessions),
        expiredSessions: toNumber(data.expired_sessions),
        closedSessions: toNumber(data.closed_sessions),
        totalMessages: toNumber(data.total_messages),
        userMessages: toNumber(data.user_messages),
        assistantMessages: toNumber(data.assistant_messages),
        raw: response,
    };
}
