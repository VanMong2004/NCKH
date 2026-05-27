export function mapNotification(item = {}) {
    return {
        id: item.id,
        type: item.type || 'general',
        title: item.title || 'Thông báo',
        message: item.message || '',
        actionUrl: item.action_url || '',
        meta: item.meta || {},
        isRead: Boolean(item.is_read),
        readAt: item.read_at || '',
        createdAt: item.created_at || '',
        icon: getIcon(item.type),
        raw: item,
    };
}

export function mapNotificationResponse(response = {}) {
    const raw = response.data || response.notifications || [];

    return {
        notifications: Array.isArray(raw) ? raw.map(mapNotification) : [],
        meta: response.meta || {},
    };
}

export function notificationTypeText(type) {
    const map = {
        order: 'Đơn hàng',
        payment: 'Thanh toán',
        campaign: 'Chiến dịch',
        pickup: 'Nhận hàng',
        general: 'Thông báo',
    };

    return map[type] || 'Thông báo';
}

function getIcon(type) {
    const map = {
        order: '📦',
        payment: '💳',
        campaign: '📢',
        pickup: '🚚',
        general: '🔔',
    };

    return map[type] || '🔔';
}
