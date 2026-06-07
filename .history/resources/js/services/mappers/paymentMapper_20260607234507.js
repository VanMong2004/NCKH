function toNumber(value) {
    return Number(value || 0);
}

export function paymentMethodText(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        mock: 'Thanh toán mô phỏng',
        vnpay: 'VNPay',
    };

    return map[method] || method || 'Chưa xác định';
}

export function paymentStatusText(status) {
    const map = {
        pending: 'Đang chờ',
        success: 'Đã thanh toán',
        failed: 'Thất bại',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Chưa tạo thanh toán';
}

export function mapPayment(item = {}) {
    return {
        id: item.id,

        method: item.method || '',
        methodText: paymentMethodText(item.method),

        status: item.status || '',
        statusText: paymentStatusText(item.status),

        amount: toNumber(item.amount),

        transactionId: item.transaction_id || '',

        createdAt: item.created_at || '',

        raw: item,
    };
}

/**
 * POST /api/orders/{order_id}/pay
 *
 * BE trả:
 * data.payment_id
 * data.transaction_id
 * data.redirect_url
 */
export function mapCreatePaymentResponse(response = {}) {
    const data = response.data || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',

        paymentId: data.payment_id,
        transactionId: data.transaction_id || '',

        redirectUrl: data.redirect_url || '',

        // giữ thêm key này để code cũ nếu có dùng paymentUrl vẫn chạy
        paymentUrl: data.redirect_url || '',

        raw: data,
    };
}

export function mapPaymentHistoryResponse(response = {}) {
    const data = response.data?.data || [];

    return {
        transactions: data.map((item) => ({
            id: item.id,
            orderCode: item.order_code,
            amount: Number(item.amount || 0),

            method: paymentMethodText(item.method),

            status: item.status,
            statusText: paymentStatusText(item.status),

            transactionId: item.transaction_id,
            createdAt: item.created_at,

            orderId: item.order_id,
        })),

        meta: {
            currentPage: response.data?.current_page || 1,
            lastPage: response.data?.last_page || 1,
            total: response.data?.total || 0,
        },
    };
}

export function mapPaymentResponse(response = {}) {
    return mapPayment(response.data || {});
}

export function mapPaymentListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapPayment);
}
