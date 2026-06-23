function toNumber(value) {
    return Number(value || 0);
}

function toBoolean(value) {
    return value === true || value === 1 || value === '1';
}

function normalizeImage(url) {
    if (!url) return '';

    const value = String(url).trim();

    if (!value) return '';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

export function formatMoney(value) {
    return toNumber(value).toLocaleString('vi-VN') + ' đ';
}

export function getUserRoleText(role) {
    const map = {
        admin: 'Quản trị viên',
        user: 'Khách hàng',
    };

    return map[role] || role || 'Không rõ';
}

export function getOrderStatusText(status) {
    const map = {
        pending: 'Chờ xử lý',
        paid: 'Đã thanh toán',
        processing: 'Đang xử lý',
        shipped: 'Đã giao hàng',
        completed: 'Hoàn tất',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Không rõ';
}

export function mapAdminUser(item = {}) {
    return {
        id: item.id,
        name: item.name || 'Người dùng',
        email: item.email || '',
        phone: item.phone || '',
        mssv: item.mssv || '',

        role: item.role || 'user',
        roleText: getUserRoleText(item.role),

        avatarUrl: normalizeImage(item.avatar_url),

        ordersCount: toNumber(item.orders_count),
        reviewsCount: toNumber(item.reviews_count),

        isDeleted: toBoolean(item.is_deleted),
        createdAt: item.created_at || '',

        raw: item,
    };
}

export function mapAdminUserDetail(item = {}) {
    return {
        ...mapAdminUser(item),

        addresses: Array.isArray(item.addresses)
            ? item.addresses.map((address) => ({
                  id: address.id,
                  name: address.name || '',
                  phone: address.phone || '',
                  address: address.address || '',
                  isDefault: toBoolean(address.is_default),
                  raw: address,
              }))
            : [],

        recentOrders: Array.isArray(item.recent_orders)
            ? item.recent_orders.map((order) => ({
                  id: order.id,
                  orderCode: order.order_code || '',
                  status: order.status || '',
                  statusText: getOrderStatusText(order.status),
                  total: toNumber(order.total),
                  createdAt: order.created_at || '',
                  raw: order,
              }))
            : [],

        raw: item,
    };
}

export function mapAdminUserListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        users: raw.map(mapAdminUser),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminUserDetailResponse(response = {}) {
    return mapAdminUserDetail(response.data || {});
}
