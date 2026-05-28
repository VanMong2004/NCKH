function toNumber(value) {
    return Number(value || 0);
}

export function mapCreatePaymentResponse(response = {}) {
    const data = response.data || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',

        paymentId: data.payment_id,
        transactionId: data.transaction_id || '',
        redirectUrl: data.redirect_url || '',

        // Giữ key này để Checkout.jsx cũ vẫn dùng được nếu đang check payment.paymentUrl
        paymentUrl: data.redirect_url || '',

        raw: data,
    };
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

export function mapPaymentResponse(response = {}) {
    return mapPayment(response.data || {});
}

export function mapPaymentListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapPayment);
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
