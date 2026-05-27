export function mapNotification(item = {}) {
    return {
        id: item.id,
        type: item.type || 'general',

        title: item.title || '',
        message: item.message || '',

        actionUrl: item.action_url,

        meta: item.meta || {},

        isRead: item.is_read,

        readAt: item.read_at,
        createdAt: item.created_at,

        icon: getIcon(item.type),

        raw: item,
    };
}

export function mapNotificationResponse(response = {}) {
    const data = response.data || [];

    return {
        notifications: data.map(mapNotification),

        meta: response.meta || {},
    };
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
