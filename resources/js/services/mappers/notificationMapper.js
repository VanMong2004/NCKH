export function mapNotification(item = {}) {
    return {
        id: item.id,
        type: item.type || '',
        title: item.title || '',
        message: item.message || '',
        actionUrl: item.action_url || '',
        meta: item.meta || {},
        isRead: Boolean(item.is_read),
        readAt: item.read_at || '',
        createdAt: item.created_at || '',
        icon: item.icon || getIcon(item.type),
        color: item.color || 'blue',
        timeAgo: item.time_ago || '',
        raw: item,
    };
}

export function mapNotificationResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        notifications: raw.map(mapNotification),
        meta: {
            currentPage: Number(response.meta?.current_page || 1),
            lastPage: Number(response.meta?.last_page || 1),
            perPage: Number(response.meta?.per_page || raw.length || 10),
            total: Number(response.meta?.total || raw.length || 0),
        },
        success: Boolean(response.success),
        message: response.message || '',
        raw: response,
    };
}

export function mapNotificationDetailResponse(response = {}) {
    return mapNotification(response.data || {});
}

export function mapUnreadCountResponse(response = {}) {
    return Number(response.data?.unread_count || 0);
}

export function mapNotificationActionResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        data: response.data || null,
        raw: response,
    };
}

export function notificationTypeText(type) {
    const map = {
        order: 'Đơn hàng',
        payment: 'Thanh toán',
        promotion: 'Khuyến mãi',
        pickup: 'Nhận hàng',
        general: 'Thông báo',
    };

    return map[type] || 'Thông báo';
}

function getIcon(type) {
    const map = {
        order: '📦',
        payment: '💳',
        promotion: '🏷️',
        pickup: '🚚',
        general: '🔔',
    };

    return map[type] || '🔔';
}
