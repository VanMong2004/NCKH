function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

export const contactStatusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'replied', label: 'Đã phản hồi' },
    { value: 'closed', label: 'Đã đóng' },
];

export function getContactStatusText(status) {
    return {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        replied: 'Đã phản hồi',
        closed: 'Đã đóng',
    }[status] || 'Không rõ';
}

export function mapAdminContact(item = {}) {
    return {
        id: item.id,
        fullName: item.full_name || '',
        email: item.email || '',
        phone: item.phone || '',
        subject: item.subject || '',
        subjectText: item.subject_text || item.subject || '',
        message: item.message || '',
        status: item.status || 'pending',
        statusText: item.status_text || getContactStatusText(item.status),
        adminNote: item.admin_note || '',
        repliedAt: item.replied_at || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        isDeleted: toBoolean(item.is_deleted),
        raw: item,
    };
}

export function mapAdminContactListResponse(response = {}) {
    const data = response.data || {};
    const paginator = data.contacts || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        contacts: raw.map(mapAdminContact),
        stats: {
            total: toNumber(data.stats?.total),
            pending: toNumber(data.stats?.pending),
            processing: toNumber(data.stats?.processing),
            replied: toNumber(data.stats?.replied),
            closed: toNumber(data.stats?.closed),
        },
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminContactDetailResponse(response = {}) {
    return mapAdminContact(response.data || {});
}
