function toNumber(value) {
    return Number(value || 0);
}

const pickupPaymentText =
    'Thanh toán trực tiếp khi nhận tại Phòng Công tác chính trị - Sinh viên - Khởi nghiệp Trường Đại học Kỹ thuật - Công nghệ Cần Thơ';

export function paymentMethodText(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        mock_bank: 'Chuyển khoản ngân hàng',
        cash_on_pickup: pickupPaymentText,
    };

    return map[method] || method || 'Chưa có thông tin thanh toán';
}

export function paymentStatusText(status) {
    const map = {
        unpaid: 'Chưa thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || status || 'Chưa có thông tin thanh toán';
}

export function paymentStatusClass(status) {
    const map = {
        unpaid:
            'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50',
        paid:
            'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50',
        failed: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50',
        refunded:
            'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50',
    };

    return (
        map[status] ||
        'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
    );
}

export function mapPayment(item = {}) {
    return {
        id: item.id,
        orderId: item.order_id,
        orderCode: item.order_code || item.order?.order_code || '',
        method: item.method || '',
        methodText: paymentMethodText(item.method),
        status: item.status || '',
        statusText: paymentStatusText(item.status),
        statusClass: paymentStatusClass(item.status),
        amount: toNumber(item.amount),
        transactionId: item.transaction_id || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        raw: item,
    };
}

export function mapCreatePaymentResponse(response = {}) {
    const data = response.data || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',
        paymentId: data.payment_id,
        orderId: data.order_id,
        transactionId: data.transaction_id || '',
        redirectUrl: data.redirect_url || '',
        paymentUrl: data.redirect_url || '',
        raw: data,
    };
}

export function mapPaymentHistoryResponse(response = {}) {
    const raw = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        transactions: raw.map(mapPayment),
        meta: {
            currentPage: toNumber(response.data?.current_page || response.meta?.current_page || 1),
            lastPage: toNumber(response.data?.last_page || response.meta?.last_page || 1),
            total: toNumber(response.data?.total || response.meta?.total || raw.length),
        },
        raw: response,
    };
}

export function mapPaymentResponse(response = {}) {
    return mapPayment(response.data || {});
}

export function mapPaymentListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map(mapPayment);
}
