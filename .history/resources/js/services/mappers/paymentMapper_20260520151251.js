export function mapPayment(item = {}) {
    return {
        id: item.id,

        orderId: item.order_id,
        method: item.method || item.payment_method || 'cod',
        methodText: paymentMethodText(item.method || item.payment_method),

        status: item.status || item.payment_status || 'pending',
        statusText: paymentStatusText(item.status || item.payment_status),

        amount: Number(item.amount || item.total || 0),
        paymentUrl: item.payment_url || item.redirect_url || '',

        transactionId: item.transaction_id || item.transaction_code || '',
        paidAt: item.paid_at || null,
        createdAt: item.created_at || null,

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
        mock: 'Thanh toán mô phỏng',
        qr: 'QR Code',
        vnpay: 'VNPay',
        momo: 'MoMo',
        bank_transfer: 'Chuyển khoản ngân hàng',
    };

    return map[method] || method || 'COD';
}

export function paymentStatusText(status) {
    const map = {
        pending: 'Đang chờ',
        unpaid: 'Chưa thanh toán',
        success: 'Đã thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || status || 'Chưa thanh toán';
}
