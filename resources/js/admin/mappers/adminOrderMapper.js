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
        empty: 'Khởi tạo đơn hàng',
        pending: 'Chờ xác nhận',
        processing: 'Đang chuẩn bị',
        awaiting_receipt: 'Đang chờ nhận hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || map.empty;
}

export function getPaymentStatusText(status) {
    const map = {
        unpaid: 'Chưa thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || status || 'Không rõ';
}

export function getPaymentMethodText(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        mock_bank: 'Chuyển khoản ngân hàng',
        cash_on_pickup: 'Thanh toán tại phòng',
    };

    return map[method] || method || '-';
}

export function getVatInvoiceStatusText(status) {
    const map = {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        fulfilled: 'Đã hoàn tất',
        rejected: 'Đã từ chối',
    };

    return map[status] || status || 'Không có yêu cầu';
}

export function getCancelReasonText(reason) {
    const map = {
        user_cancelled: 'Người dùng hủy',
        admin_cancelled: 'Quản trị viên hủy đơn',
        expired: 'Hết hạn thanh toán',
        payment_timeout: 'Hết hạn thanh toán',
        payment_failed: 'Thanh toán thất bại',
    };

    return map[reason] || reason || '-';
}

export function getNextOrderStatuses(status) {
    const map = {
        pending: ['processing', 'cancelled'],
        processing: ['awaiting_receipt', 'cancelled'],
        awaiting_receipt: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
    };

    return map[status] || [];
}

export function getNextVatInvoiceStatuses(status) {
    const map = {
        pending: ['processing', 'rejected'],
        processing: ['fulfilled', 'rejected'],
        fulfilled: [],
        rejected: [],
    };

    return map[status] || [];
}

export function getFulfillmentMethodText(method) {
    const map = {
        delivery: 'Giao hàng tận nơi',
        pickup: 'Nhận tại Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
    };

    return map[method] || method || '-';
}

export function getDisplayOrderStatusText(status, fulfillmentMethod = '') {
    if (!status) return 'Khởi tạo đơn hàng';

    if (status === 'awaiting_receipt') {
        return fulfillmentMethod === 'pickup' ? 'Sẵn sàng nhận tại phòng' : 'Đang giao';
    }

    return getOrderStatusText(status);
}

export function mapAdminOrder(item = {}) {
    const customer = item.customer || {};
    const fulfillmentMethod = item.fulfillment_method || '';

    return {
        id: item.id,
        orderCode: item.order_code || '',
        status: item.status || '',
        statusText: getDisplayOrderStatusText(item.status, fulfillmentMethod),
        paymentStatus: item.payment_status || '',
        paymentStatusText: getPaymentStatusText(item.payment_status),
        fulfillmentMethod,
        fulfillmentMethodText: getFulfillmentMethodText(fulfillmentMethod),
        paymentMethod: item.payment_method || '',
        paymentMethodText: getPaymentMethodText(item.payment_method),
        vatInvoiceRequest: item.vat_invoice_request
            ? {
                  id: item.vat_invoice_request.id,
                  status: item.vat_invoice_request.status || '',
                  statusText: getVatInvoiceStatusText(item.vat_invoice_request.status),
                  companyName: item.vat_invoice_request.company_name || '',
                  taxCode: item.vat_invoice_request.tax_code || '',
                  invoiceEmail: item.vat_invoice_request.invoice_email || '',
                  adminNote: item.vat_invoice_request.admin_note || '',
                  processedAt: item.vat_invoice_request.processed_at || '',
                  fulfilledAt: item.vat_invoice_request.fulfilled_at || '',
                  createdAt: item.vat_invoice_request.created_at || '',
                  processedBy: item.vat_invoice_request.processed_by || null,
              }
            : null,
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
        allowedNextStatuses: Array.isArray(item.allowed_next_statuses) ? item.allowed_next_statuses : getNextOrderStatuses(item.status),
        raw: item,
    };
}

export function mapAdminOrderDetail(item = {}) {
    const order = mapAdminOrder({
        id: item.id,
        order_code: item.order_code,
        status: item.status,
        fulfillment_method: item.fulfillment_method,
        customer: item.customer,
        payment_status: item.payment_status,
        payment_method: item.payment?.method,
        total: item.summary?.total || item.summary?.grand_total,
        expired_at: item.expired_at,
        cancel_reason: item.cancel_reason,
        created_at: item.created_at,
        item_count: Array.isArray(item.items) ? item.items.reduce((sum, orderItem) => sum + toNumber(orderItem.quantity), 0) : item.item_count,
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
        vatInvoiceRequest: item.vat_invoice_request
            ? {
                  id: item.vat_invoice_request.id,
                  status: item.vat_invoice_request.status || '',
                  statusText: getVatInvoiceStatusText(item.vat_invoice_request.status),
                  companyName: item.vat_invoice_request.company_name || '',
                  taxCode: item.vat_invoice_request.tax_code || '',
                  invoiceEmail: item.vat_invoice_request.invoice_email || '',
                  adminNote: item.vat_invoice_request.admin_note || '',
                  processedAt: item.vat_invoice_request.processed_at || '',
                  fulfilledAt: item.vat_invoice_request.fulfilled_at || '',
                  createdAt: item.vat_invoice_request.created_at || '',
                  processedBy: item.vat_invoice_request.processed_by || null,
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
                  oldStatusText: getDisplayOrderStatusText(history.old_status, item.fulfillment_method),
                  newStatus: history.new_status || '',
                  newStatusText: getDisplayOrderStatusText(history.new_status, item.fulfillment_method),
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
