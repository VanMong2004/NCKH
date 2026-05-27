function toNumber(value) {
    return Number(value || 0);
}

export function mapPayment(item = {}) {
    return {
        id: item.id,

        method: item.method || '',
        methodText: paymentMethodText(item.method),

        status: item.status || '',
        statusText: paymentStatusText(item.status),

        amount: toNumber(item.amount),

        transactionId: item.transaction_id || null,

        paymentUrl: item.payment_url || null,

        qrCode: item.qr_code || null,

        createdAt: item.created_at || '',

        raw: item,
    };
}

/**
 * POST /api/orders/{order_id}/pay
 *
 * Controller trả:
 * {
 *   message: "...",
 *   data: {...}
 * }
 */
export function mapPaymentResponse(response = {}) {
    return mapPayment(response.data);
}

/**
 * GET /api/orders/{order_id}/payments
 */
export function mapPaymentListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapPayment);
}

export function paymentMethodText(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        bank_transfer: 'Chuyển khoản ngân hàng',
        momo: 'Ví MoMo',
        vnpay: 'VNPay',
        mock: 'Thanh toán mô phỏng',
    };

    return map[method] || method || 'Chưa xác định';
}

export function paymentStatusText(status) {
    const map = {
        pending: 'Đang chờ',
        success: 'Đã thanh toán',
        failed: 'Thất bại',
        cancelled: 'Đã hủy',
        cod_pending: 'Chờ thanh toán',
        cod_paid: 'Đã thanh toán',
    };

    return map[status] || status || 'Đang cập nhật';
}
