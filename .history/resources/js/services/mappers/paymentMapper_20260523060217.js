export function mapPayment(item = {}) {
    return {
        id: item.id,

        method: item.method || 'cod',

        methodText: paymentMethodText(item.method),

        status: item.status || 'pending',

        statusText: paymentStatusText(item.status),

        amount: Number(item.amount || 0),

        transactionId: item.transaction_id || item.transactionId || null,

        paymentUrl: item.payment_url || item.redirect_url || item.url || null,

        qrCode: item.qr_code || null,

        createdAt: item.created_at || '',

        raw: item,
    };
}

export function mapPaymentResponse(response = {}) {
    return mapPayment(response.data || response.payment || response);
}

export function mapPaymentListResponse(response = {}) {
    const raw = response.data || response.payments || [];

    return Array.isArray(raw) ? raw.map(mapPayment) : [];
}

export function paymentMethodText(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        bank_transfer: 'Chuyển khoản ngân hàng',
        momo: 'Ví MoMo',
        vnpay: 'VNPay',
        mock: 'Thanh toán mô phỏng',
    };

    return map[method] || method;
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

    return map[status] || status;
}
