function toNumber(value) {
    return Number(value || 0);
}

function normalizeImage(url) {
    if (!url) return '/images/no-image.png';

    const value = String(url).trim();

    if (!value) return '/images/no-image.png';

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
        return value;
    }

    return `/${value.replace(/^public\//, '')}`;
}

export function formatMoney(value) {
    return toNumber(value).toLocaleString('vi-VN') + ' đ';
}

export function getOrderStatusText(status) {
    const map = {
        pending: 'Chờ xác nhận',
        paid: 'Đã thanh toán',
        processing: 'Đang xử lý',
        shipped: 'Đang giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Không rõ';
}

export function getPaymentStatusText(status) {
    const map = {
        pending: 'Chờ thanh toán',
        success: 'Thanh toán thành công',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || status || 'Không rõ';
}

export function getPaymentMethodText(method) {
    const map = {
        cod: 'COD',
        bank_transfer: 'Chuyển khoản',
        momo: 'MoMo',
        vnpay: 'VNPay',
        mock: 'Thanh toán thử',
    };

    return map[method] || method || '-';
}

export function getCancelReasonText(reason) {
    const map = {
        user_cancelled: 'Người dùng hủy',
        admin_cancelled: 'Admin hủy đơn',
        expired: 'Hết hạn thanh toán',
        payment_timeout: 'Hết hạn thanh toán',
        payment_failed: 'Thanh toán thất bại',
    };

    return map[reason] || reason || '-';
}

export function getNextOrderStatuses(status, paymentMethod = '') {
    const map = {
        pending:
            paymentMethod && paymentMethod !== 'cod'
                ? [
                      'paid',
                      'cancelled',
                  ]
                : [
                      'processing',
                      'cancelled',
                  ],

        paid: [
            'processing',
            'cancelled',
        ],

        processing: [
            'shipped',
            'cancelled',
        ],

        shipped: [
            'completed',
        ],

        completed: [],

        cancelled: [],
    };

    return map[status] || [];
}

export function mapAdminOrder(item = {}) {
    const customer = item.customer || {};

    return {
        id: item.id,
        orderCode: item.order_code || '',
        status: item.status || '',
        statusText: getOrderStatusText(item.status),

        paymentStatus: item.payment_status || '',
        paymentStatusText: getPaymentStatusText(item.payment_status),
        paymentMethod: item.payment_method || '',
        paymentMethodText: getPaymentMethodText(item.payment_method),

        thumbnail: normalizeImage(item.thumbnail),

        customer: {
            userId: customer.user_id || null,
            name: customer.name || 'Khách hàng',
            email: customer.email || '',
            phone: customer.phone || '',
        },

        itemCount: toNumber(item.item_count),
        total: toNumber(item.total),

        expiredAt: item.expired_at || '',
        cancelReason: item.cancel_reason || '',
        cancelReasonText: getCancelReasonText(item.cancel_reason),
        createdAt: item.created_at || '',
        allowedNextStatuses: Array.isArray(item.allowed_next_statuses)
            ? item.allowed_next_statuses
            : getNextOrderStatuses(item.status, item.payment_method),

        raw: item,
    };
}

export function mapAdminOrderDetail(item = {}) {
    const order = mapAdminOrder({
        id: item.id,
        order_code: item.order_code,
        status: item.status,
        customer: item.customer,
        payment_status: item.payment?.status,
        payment_method: item.payment?.method,
        total: item.summary?.total || item.summary?.grand_total,
        expired_at: item.expired_at,
        cancel_reason: item.cancel_reason,
        created_at: item.created_at,
        item_count: Array.isArray(item.items)
            ? item.items.reduce((sum, orderItem) => sum + toNumber(orderItem.quantity), 0)
            : item.item_count,
        thumbnail: item.thumbnail,
        allowed_next_statuses: item.allowed_next_statuses,
    });

    return {
        ...order,

        receiver: {
            name: item.receiver?.name || '',
            phone: item.receiver?.phone || '',
            address: item.receiver?.address || '',
        },

        payment: item.payment
            ? {
                  id: item.payment.id,
                  method: item.payment.method || '',
                  methodText: getPaymentMethodText(item.payment.method),
                  status: item.payment.status || '',
                  statusText: getPaymentStatusText(item.payment.status),
                  amount: toNumber(item.payment.amount),
                  transactionId: item.payment.transaction_id || '',
              }
            : null,

        summary: {
            subTotal: toNumber(item.summary?.sub_total),
            shippingFee: toNumber(item.summary?.shipping_fee),
            discount: toNumber(item.summary?.discount),
            grandTotal: toNumber(item.summary?.grand_total),
            total: toNumber(item.summary?.total),
        },

        items: Array.isArray(item.items)
            ? item.items.map((orderItem) => ({
                  id: orderItem.id,
                  productVariantId: orderItem.product_variant_id,
                  productName: orderItem.product_name || '',
                  thumbnail: normalizeImage(orderItem.thumbnail),

                  variant: orderItem.variant || {},

                  price: toNumber(orderItem.price),
                  originalPrice: toNumber(orderItem.original_price),
                  discountAmount: toNumber(orderItem.discount_amount),
                  finalPrice: toNumber(orderItem.final_price),

                  quantity: toNumber(orderItem.quantity),
                  total: toNumber(orderItem.total),

                  promotion: orderItem.promotion || null,

                  raw: orderItem,
              }))
            : [],

        statusHistories: Array.isArray(item.status_histories)
            ? item.status_histories.map((history) => ({
                  id: history.id,
                  oldStatus: history.old_status || '',
                  oldStatusText: getOrderStatusText(history.old_status),
                  newStatus: history.new_status || '',
                  newStatusText: getOrderStatusText(history.new_status),
                  note: history.note || '',
                  changedBy: history.changed_by || null,
                  createdAt: history.created_at || '',
                  raw: history,
              }))
            : [],

        raw: item,
    };
}

export function mapAdminOrderListResponse(response = {}) {
    const paginator = response.data || {};
    const raw = Array.isArray(paginator.data) ? paginator.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        orders: raw.map(mapAdminOrder),
        meta: {
            currentPage: toNumber(paginator.current_page || 1),
            lastPage: toNumber(paginator.last_page || 1),
            perPage: toNumber(paginator.per_page || raw.length || 10),
            total: toNumber(paginator.total || raw.length),
        },
        raw: response,
    };
}

export function mapAdminOrderDetailResponse(response = {}) {
    return mapAdminOrderDetail(response.data || {});
}
