import { mapPayment } from './paymentMapper';

function toNumber(value) {
    return Number(value || 0);
}

const pickupPaymentText =
    'Thanh toán trực tiếp khi nhận tại Phòng Công tác chính trị - Sinh viên - Khởi nghiệp Trường Đại học Kỹ thuật - Công nghệ Cần Thơ';

function resolveAwaitingReceiptText(fulfillmentMethod) {
    return fulfillmentMethod === 'pickup' ? 'Sẵn sàng nhận tại phòng' : 'Đang giao';
}

export function orderStatusText(status, fulfillmentMethod = 'delivery') {
    const map = {
        pending: 'Chờ xác nhận',
        processing: 'Đang chuẩn bị',
        awaiting_receipt: resolveAwaitingReceiptText(fulfillmentMethod),
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return map[status] || status || 'Đang cập nhật';
}

export function orderStatusClass(status) {
    const map = {
        pending: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50',
        processing: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50',
        awaiting_receipt: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50',
        cancelled: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50',
    };

    return map[status] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700';
}

export function cancelReasonText(reason) {
    const map = {
        user_cancelled: 'Người dùng hủy',
        expired: 'Hết hạn thanh toán',
        payment_timeout: 'Hết hạn thanh toán',
        payment_failed: 'Thanh toán thất bại',
        admin_cancelled: 'Quản trị viên hủy',
    };

    return map[reason] || reason || 'Đang cập nhật';
}

function mapCheckoutOrderItem(item = {}) {
    const originalPrice = toNumber(item.original_price || item.price);
    const discountAmount = toNumber(item.discount_amount);
    const finalPrice = toNumber(item.final_price || item.price);

    return {
        productName: item.product_name || '',
        price: finalPrice,
        originalPrice,
        discountAmount,
        finalPrice,
        quantity: toNumber(item.quantity),
        total: toNumber(item.total || finalPrice * toNumber(item.quantity)),
        promotion: item.promotion || null,
        promotionLoginRequired: Boolean(item.promotion_login_required),
        raw: item,
    };
}

export function mapCheckoutOrderResponse(response = {}) {
    const item = response.data || {};

    return {
        success: Boolean(response.success),
        message: response.message || '',
        id: item.order_id,
        orderId: item.order_id,
        userId: item.user_id,
        code: item.order_code || '',
        orderCode: item.order_code || '',
        guestToken: item.guestToken || item.guest_token || '',
        status: item.status || '',
        statusText: orderStatusText(item.status, item.fulfillment_method || 'delivery'),
        statusClass: orderStatusClass(item.status),
        subTotal: toNumber(item.sub_total),
        shippingFee: toNumber(item.shipping_fee),
        discount: toNumber(item.discount),
        grandTotal: toNumber(item.grand_total),
        paymentMethod: item.payment_method || '',
        actions: mapActions(item.actions),
        items: Array.isArray(item.items) ? item.items.map(mapCheckoutOrderItem) : [],
        raw: item,
    };
}

function mapReceiver(receiver = {}) {
    return {
        name: receiver.name || '',
        phone: receiver.phone || '',
        address: receiver.address || '',
        raw: receiver,
    };
}

function mapActions(actions = {}) {
    return {
        canCancel: Boolean(actions.can_cancel),
        canPayAgain: Boolean(actions.can_pay_again),
        canReviewOrder: Boolean(actions.can_review_order),
        available: Array.isArray(actions.available) ? actions.available : [],
        raw: actions,
    };
}

function mapSummary(summary = {}) {
    return {
        subTotal: toNumber(summary.sub_total),
        shippingFee: toNumber(summary.shipping_fee),
        discount: toNumber(summary.discount),
        grandTotal: toNumber(summary.grand_total),
        raw: summary,
    };
}

function mapOrderItem(item = {}) {
    const originalPrice = toNumber(item.original_price || item.price);
    const discountAmount = toNumber(item.discount_amount);
    const finalPrice = toNumber(item.final_price || item.price);
    const productId = item.product_id || item.product?.id || item.variant?.product_id || item.product_variant?.product_id || item.productVariant?.product_id || item.raw?.product_id || null;
    const productVariantId = item.product_variant_id || item.variant?.id || item.product_variant?.id || item.productVariant?.id || null;
    const reviewId = item.review_id || item.review?.id || null;

    return {
        id: item.id,
        productId,
        productVariantId,
        productName: item.product_name || item.product?.name || '',
        productSlug: item.product_slug || item.product?.slug || '',
        thumbnail: item.thumbnail || item.product?.thumbnail || '',
        variant: item.variant || item.variant_snapshot || null,
        price: finalPrice,
        originalPrice,
        discountAmount,
        finalPrice,
        quantity: toNumber(item.quantity),
        total: toNumber(item.total || finalPrice * toNumber(item.quantity)),
        promotion: item.promotion || item.promotion_snapshot || null,
        reviewId,
        reviewed: Boolean(item.is_reviewed || item.reviewed || reviewId),
        canReview: Boolean(item.can_review),
        raw: item,
    };
}

function mapPickup(pickup = {}) {
    return {
        location: pickup.location || '',
        instruction: pickup.instruction || '',
        raw: pickup,
    };
}

function mapTimelineItem(item = {}) {
    return {
        key: item.key || '',
        label: item.label || '',
        done: Boolean(item.status),
        time: item.time || '',
        note: item.note || '',
        raw: item,
    };
}

function paymentStatusText(status) {
    const map = {
        unpaid: 'Chưa thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || status || 'Chưa có thông tin thanh toán';
}

function paymentMethodText(method) {
    const map = {
        cod: 'Thanh toán khi nhận hàng',
        mock_bank: 'Chuyển khoản ngân hàng',
        cash_on_pickup: pickupPaymentText,
    };

    return map[method] || method || 'Chưa có thông tin thanh toán';
}

function mapOrderDetail(item = {}) {
    const fulfillmentMethod = item.fulfillment_method || '';
    const statusText = orderStatusText(item.status, fulfillmentMethod);

    return {
        id: item.id,
        code: item.order_code || '',
        orderCode: item.order_code || '',
        createdAt: item.created_at || item.timeline?.[0]?.time || '',
        type: item.type || '',
        status: item.status || '',
        statusText,
        statusClass: orderStatusClass(item.status),
        qrCode: item.qr_code || '',
        expiredAt: item.expired_at || '',
        cancelReason: item.cancel_reason || '',
        receiver: mapReceiver(
            item.receiver || {
                name: item.shipping_name,
                phone: item.shipping_phone,
                address: item.shipping_address,
            },
        ),
        payment: item.payment
            ? mapPayment(item.payment)
            : {
                  status: item.payment_status || '',
                  statusText: paymentStatusText(item.payment_status),
                  method: item.payment_method || '',
                  methodText: paymentMethodText(item.payment_method),
              },
        actions: mapActions(item.actions),
        summary: mapSummary(
            item.summary || {
                sub_total: item.sub_total || item.total,
                shipping_fee: item.shipping_fee,
                discount: item.discount_total,
                grand_total: item.grand_total || item.total,
            },
        ),
        items: Array.isArray(item.items) ? item.items.map(mapOrderItem) : [],
        pickup: mapPickup(item.pickup),
        timeline: Array.isArray(item.timeline) ? item.timeline.map(mapTimelineItem) : [],
        raw: item,
    };
}

export function mapOrderDetailResponse(response = {}) {
    return {
        success: Boolean(response.success),
        message: response.message || '',
        ...mapOrderDetail(response.data || {}),
    };
}

export function mapGuestOrderLookupResponse(response = {}) {
    const item = response.data || {};
    const lookupType = item.lookup_type || 'order_code_email';

    return {
        success: Boolean(response.success),
        message: response.message || '',
        lookupType,
        order: lookupType === 'phone_email' ? null : mapOrderDetail(item),
        orders:
            lookupType === 'phone_email'
                ? (Array.isArray(item.orders) ? item.orders : []).map((order) => mapOrderDetail(order))
                : [],
        raw: item,
    };
}

function mapOrderListItem(item = {}) {
    const fulfillmentMethod = item.fulfillment_method || '';

    return {
        id: item.id,
        code: item.order_code || '',
        orderCode: item.order_code || '',
        title: item.title || 'Đơn hàng',
        type: item.type || '',
        status: item.status || '',
        statusText: orderStatusText(item.status, fulfillmentMethod),
        statusClass: orderStatusClass(item.status),
        paymentStatus: item.payment_status || '',
        paymentMethod: item.payment_method || '',
        fulfillmentMethod,
        thumbnail: item.thumbnail || '',
        itemCount: toNumber(item.item_count),
        total: toNumber(item.total),
        qrCode: item.qr_code || '',
        expiredAt: item.expired_at || '',
        cancelReason: item.cancel_reason || '',
        createdAt: item.created_at || '',
        detailUrl: item.detail_url || '',
        actions: mapActions(item.actions),
        raw: item,
    };
}

export function mapOrderListResponse(response = {}) {
    const raw = Array.isArray(response.data) ? response.data : [];

    return {
        success: Boolean(response.success),
        message: response.message || '',
        orders: raw.map(mapOrderListItem),
        meta: {
            currentPage: toNumber(response.meta?.current_page || 1),
            lastPage: toNumber(response.meta?.last_page || 1),
            perPage: toNumber(response.meta?.per_page || 10),
            total: toNumber(response.meta?.total || raw.length),
        },
        raw: response,
    };
}
