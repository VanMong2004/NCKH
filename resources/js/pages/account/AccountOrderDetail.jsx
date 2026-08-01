import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    ChevronRight,
    Circle,
    Clock,
    CreditCard,
    Home,
    Info,
    MapPin,
    Package,
    Pencil,
    Phone,
    ReceiptText,
    RotateCcw,
    Star,
    Trash2,
    Truck,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import reviewService from '../../services/reviewService';
import VatInvoiceRequestModal from '../../components/order/VatInvoiceRequestModal';
import ConfirmDialog from '../../admin/components/ui/ConfirmDialog';

export default function AccountOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [vatInvoiceModalOpen, setVatInvoiceModalOpen] = useState(false);
    const [vatInvoiceRequest, setVatInvoiceRequest] = useState(null);
    const [submittingVatInvoice, setSubmittingVatInvoice] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    useEffect(() => {
        loadOrder();
    }, [id]);

    useEffect(() => {
        const refreshOrder = () => {
            loadOrder();
        };

        window.addEventListener('notification-created', refreshOrder);
        window.addEventListener('notification-updated', refreshOrder);

        return () => {
            window.removeEventListener('notification-created', refreshOrder);
            window.removeEventListener('notification-updated', refreshOrder);
        };
    }, [id]);

    async function loadOrder() {
        try {
            setLoading(true);

            const result = await orderService.getOrderDetail(id);

            setOrder(result);
        } catch (error) {
            toast.error(error.message || 'Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!order?.id) return;

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hủy đơn hàng',
            message: `Bạn có chắc muốn hủy đơn hàng "${order.code}"?`,
            description: 'Đơn hàng sau khi hủy sẽ không thể khôi phục và có thể ảnh hưởng tới trạng thái thanh toán tương ứng.',
            confirmText: 'Hủy đơn hàng',
            type: 'danger',
            onConfirm: async () => {
                await cancelOrder(order.id);
            },
        });

        return;
    }

    async function cancelOrder(orderId) {
        try {
            const result = await orderService.cancelOrder(orderId);

            setOrder(result);

            toast.success('Đã hủy đơn hàng');
        } catch (error) {
            toast.error(error.message || 'Không thể hủy đơn hàng');
        }
    }

    async function handlePayAgain() {
        if (!order?.id) return;

        const method = order.payment?.method || order.raw?.payment_method || '';

        if (method !== 'mock_bank') {
            toast.warning('Phương thức thanh toán này không hỗ trợ tạo thanh toán');
            return;
        }

        try {
            setPaying(true);

            const payment = await paymentService.pay(order.id, method);

            if (payment.redirectUrl) {
                if (method === 'mock_bank') {
                    sessionStorage.setItem(
                        'mock_payment_qr',
                        JSON.stringify({
                            order,
                            payment,
                            callbackUrl: payment.redirectUrl,
                            guestPhone: order.raw?.guest_phone || '',
                            isGuest: false,
                        }),
                    );

                    navigate('/payment/qr', {
                        state: {
                            order,
                            payment,
                            callbackUrl: payment.redirectUrl,
                            guestPhone: order.raw?.guest_phone || '',
                            isGuest: false,
                        },
                    });

                    return;
                }

                window.location.href = payment.redirectUrl;
                return;
            }

            toast.success(payment.message || 'Đã tạo thanh toán');

            loadOrder();
        } catch (error) {
            toast.error(error.message || 'Không thể tạo thanh toán');
        } finally {
            setPaying(false);
        }
    }

    async function openVatInvoiceModal() {
        if (!order?.id) return;
        if (!isOrderPaid(order)) {
            toast.warning('Chỉ đơn hàng đã thanh toán mới được yêu cầu hóa đơn đỏ');
            return;
        }

        try {
            const result = await orderService.getVatInvoiceRequest(order.id);

            setVatInvoiceRequest(result);
            setVatInvoiceModalOpen(true);
        } catch (error) {
            toast.error(error.message || 'Không thể kiểm tra yêu cầu hóa đơn đỏ');
        }
    }

    async function submitVatInvoiceRequest(payload) {
        if (!order?.id) return;

        try {
            setSubmittingVatInvoice(true);

            const result = await orderService.createVatInvoiceRequest(order.id, payload);

            setVatInvoiceRequest(result);
            toast.success('Hệ thống đã tiếp nhận yêu cầu xuất hóa đơn đỏ. Hóa đơn đỏ sẽ được gửi kèm cùng với sản phẩm. Nếu có thắc mắc hãy liên hệ quản trị viên.');
        } catch (error) {
            toast.error(error.message || 'Không thể gửi yêu cầu hóa đơn đỏ');
        } finally {
            setSubmittingVatInvoice(false);
        }
    }

    const canCancel = Boolean(order?.actions?.canCancel);

    const canPayAgain = useMemo(() => Boolean(order?.actions?.canPayAgain), [order]);
    const canRequestVatInvoice = isOrderPaid(order);

    if (loading) {
        return <LoadingBox text="Đang tải chi tiết đơn hàng..." />;
    }

    if (!order) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Không tìm thấy đơn hàng.
            </div>
        );
    }

    return (
        <div>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">
                                Đơn hàng {order.code}
                            </h1>

                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${order.statusClass}`}>
                                {order.statusText}
                            </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Ngày đặt: {formatDate(order.createdAt)}
                        </p>

                        {order.expiredAt && order.status === 'pending' && (
                            <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                <Clock size={15} />
                                Hạn thanh toán: {formatDate(order.expiredAt)}
                            </p>
                        )}

                        {order.cancelReason && (
                            <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300">
                                <AlertCircle size={15} />
                                Lý do hủy: {cancelReasonText(order.cancelReason)}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/account/orders"
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            Quay lại
                        </Link>

                        <button
                            type="button"
                            disabled={!canRequestVatInvoice}
                            onClick={openVatInvoiceModal}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                            Yêu cầu hóa đơn đỏ
                        </button>

                        {canPayAgain && (
                            <button
                                type="button"
                                disabled={paying}
                                onClick={handlePayAgain}
                                className="rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                            >
                                {paying ? 'Đang tạo thanh toán...' : 'Thanh toán'}
                        </button>
                        )}

                        {canCancel && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                            >
                                Hủy đơn
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
                <div className="space-y-6">
                    <OrderItemsCard order={order} onReviewSubmitted={loadOrder} />
                    <ReceiverCard order={order} />
                    <TimelineCard order={order} />
                </div>

                <div className="space-y-6">
                    <PaymentCard order={order} />
                    <SummaryCard order={order} />
                    <PickupCard order={order} />
                </div>
            </section>

            <VatInvoiceRequestModal
                open={vatInvoiceModalOpen}
                existingRequest={vatInvoiceRequest}
                submitting={submittingVatInvoice}
                defaultEmail={order.raw?.guest_email || order.raw?.customer?.email || ''}
                onClose={() => setVatInvoiceModalOpen(false)}
                onSubmit={submitVatInvoiceRequest}
            />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onOpenChange={(open) => {
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open,
                    }));
                }}
            />
        </div>
    );
}

function OrderItemsCard({ order, onReviewSubmitted }) {
    const [reviewingItem, setReviewingItem] = useState(null);
    const [deletingReviewItem, setDeletingReviewItem] = useState(null);
    const canReviewOrder = Boolean(order.actions?.canReviewOrder);

    async function handleDeleteReview() {
        if (!deletingReviewItem?.reviewId) return;

        try {
            await reviewService.deleteReview(deletingReviewItem.reviewId);
            toast.success('Đã xóa đánh giá');
            setDeletingReviewItem(null);

            if (onReviewSubmitted) {
                await onReviewSubmitted();
            }
        } catch (error) {
            toast.error(error.message || 'Không thể xóa đánh giá');
        }
    }

    return (
        <Card title="Sản phẩm trong đơn" icon={Package}>
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {(order.items || []).map((item) => {
                    const originalPrice = Number(item.originalPrice || item.price || 0);
                    const finalPrice = Number(item.finalPrice || item.price || 0);
                    const hasDiscount = originalPrice > finalPrice;

                    const variant = item.variant || item.raw?.variant_snapshot || {};
                    const promotion = item.promotion || item.raw?.promotion_snapshot || null;

                    const canReviewItem = canReviewOrder && item.productId && item.canReview && !item.reviewed;

                    return (
                        <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:flex-row"
                        >
                            <div className="flex min-w-0 flex-1 gap-3">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                                    {item.productSlug ? (
                                        <Link to={`/product/${item.productSlug}`} className="flex h-full w-full items-center justify-center">
                                            <img
                                                src={item.thumbnail || '/images/no-image.png'}
                                                alt={item.productName}
                                                className="max-h-full max-w-full object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/no-image.png';
                                                }}
                                            />
                                        </Link>
                                    ) : (
                                        <img
                                            src={item.thumbnail || '/images/no-image.png'}
                                            alt={item.productName}
                                            className="max-h-full max-w-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/no-image.png';
                                            }}
                                        />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    {item.productSlug ? (
                                        <Link
                                            to={`/product/${item.productSlug}`}
                                            className="line-clamp-2 font-bold text-blue-950 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
                                        >
                                            {item.productName}
                                        </Link>
                                    ) : (
                                        <p className="line-clamp-2 font-bold text-blue-950 dark:text-white">
                                            {item.productName}
                                        </p>
                                    )}

                                    {(variant?.sku || variant?.size || variant?.color) && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {variant?.sku ? `SKU: ${variant.sku}` : ''}
                                            {variant?.sku && (variant?.size || variant?.color) ? ' • ' : ''}
                                            {variant?.size ? `Size ${variant.size}` : ''}
                                            {variant?.size && variant?.color ? ' • ' : ''}
                                            {variant?.color || ''}
                                        </p>
                                    )}

                                    {promotion?.title && (
                                        <p className="mt-1 line-clamp-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {promotion.title}
                                        </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-bold text-blue-950 dark:text-blue-300">
                                            {formatMoney(finalPrice)}
                                        </span>

                                        {hasDiscount && (
                                            <span className="text-xs font-semibold text-slate-400 line-through">
                                                {formatMoney(originalPrice)}
                                            </span>
                                        )}

                                        <span className="text-slate-500 dark:text-slate-400">x {item.quantity}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:w-44 sm:flex-col sm:items-end">
                                <div className="text-right">
                                    <p className="font-extrabold text-blue-950 dark:text-blue-300">
                                        {formatMoney(item.total)}
                                    </p>

                                    {Number(item.discountAmount || 0) > 0 && (
                                        <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            Giảm {formatMoney(Number(item.discountAmount || 0) * Number(item.quantity || 0))}
                                            {formatMoney(Number(item.discountAmount || 0) * Number(item.quantity || 0))}
                                        </p>
                                    )}
                                </div>

                                {canReviewOrder && (
                                    <>
                                        {item.reviewed ? (
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewingItem(item)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                                                >
                                                    <Pencil size={14} />
                                                    Sửa đánh giá
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingReviewItem(item)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                                                >
                                                    <Trash2 size={14} />
                                                    Xóa đánh giá
                                                </button>
                                            </div>
                                        ) : canReviewItem ? (
                                            <button
                                                type="button"
                                                onClick={() => setReviewingItem(item)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-blue-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                                            >
                                                <Pencil size={14} />
                                                Đánh giá
                                            </button>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {reviewingItem && (
                <ReviewModal
                    order={order}
                    item={reviewingItem}
                    onClose={() => setReviewingItem(null)}
                    onSubmitted={async () => {
                        setReviewingItem(null);

                        if (onReviewSubmitted) {
                            await onReviewSubmitted();
                        }
                    }}
                />
            )}

            <ConfirmDialog
                open={Boolean(deletingReviewItem)}
                title="Xác nhận xóa đánh giá"
                message={
                    deletingReviewItem
                        ? `Bạn có chắc muốn xóa đánh giá của sản phẩm "${deletingReviewItem.productName}"?`
                        : ''
                }
                description="Đánh giá sau khi xóa sẽ không thể khôi phục lại."
                confirmText="Xóa đánh giá"
                type="danger"
                onConfirm={handleDeleteReview}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingReviewItem(null);
                    }
                }}
            />
        </Card>
    );
}

function ReviewModal({ order, item, onClose, onSubmitted }) {
    const existingReview = item.raw?.review || item.review || null;
    const isEditing = Boolean(item.reviewId && existingReview);
    const [form, setForm] = useState({
        rating: existingReview?.rating || 5,
        comment: existingReview?.comment || '',
        images: [],
    });

    const [submitting, setSubmitting] = useState(false);

    function handleImageChange(e) {
        const files = Array.from(e.target.files || []);

        if (files.length + form.images.length > 5) {
            toast.warning('Chỉ được tải lên tối đa 5 ảnh');
            return;
        }

        setForm((prev) => ({
            ...prev,
            images: [...prev.images, ...files],
        }));
    }

    function removeImage(index) {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!item.productId) {
            toast.warning('Không tìm thấy mã sản phẩm để đánh giá');
            return;
        }

        if (!form.comment.trim() || form.comment.trim().length < 10) {
            toast.warning('Nội dung đánh giá tối thiểu 10 ký tự');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                orderId: order.id,
                productId: item.productId,
                productVariantId: item.productVariantId,
                rating: form.rating,
                comment: form.comment,
                images: form.images,
            };

            if (isEditing) {
                await reviewService.updateReview(item.reviewId, payload);
                toast.success('Đã cập nhật đánh giá');
            } else {
                await reviewService.createReview(payload);
                toast.success('Đã gửi đánh giá sản phẩm');
            }

            await onSubmitted();
        } catch (error) {
            toast.error(error.message || (isEditing ? 'Không thể cập nhật đánh giá' : 'Không thể gửi đánh giá'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-extrabold text-blue-950 dark:text-white">
                            {isEditing ? 'Sửa đánh giá sản phẩm' : 'Đánh giá sản phẩm'}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                            {item.productName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2 dark:bg-slate-900">
                                <img
                                    src={item.thumbnail || '/images/no-image.png'}
                                    alt={item.productName}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src = '/images/no-image.png';
                                    }}
                                />
                            </div>

                            <div>
                                <p className="font-bold text-blue-950 dark:text-white">{item.productName}</p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Đơn hàng: {order.code}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">Chọn số sao</p>

                        <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, index) => {
                                const value = index + 1;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                rating: value,
                                            }))
                                        }
                                        className="p-1"
                                    >
                                        <Star size={28} fill={value <= form.rating ? 'currentColor' : 'none'} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <textarea
                        value={form.comment}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                comment: e.target.value,
                            }))
                        }
                        rows={5}
                        placeholder="Chia sẻ cảm nhận của bạn về chất lượng sản phẩm, kích thước, màu sắc, trải nghiệm nhận hàng..."
                        className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <div className="mt-4">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                            <Camera size={17} />
                            Thêm ảnh
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>

                        {isEditing && Array.isArray(existingReview?.images) && existingReview.images.length > 0 && form.images.length === 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Ảnh hiện tại của đánh giá
                                </p>

                                <div className="mt-2 flex flex-wrap gap-3">
                                    {existingReview.images.map((image, index) => (
                                        <div
                                            key={`${image}-${index}`}
                                            className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                                        >
                                            <img
                                                src={image}
                                                alt={`review-${index + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Nếu chọn ảnh mới, hệ thống sẽ cập nhật lại bộ ảnh của đánh giá này.
                                </p>
                            </div>
                        )}

                        {form.images.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                                {form.images.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                                    >
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="h-full w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                        >
                            <Upload size={17} />
                            {submitting ? (isEditing ? 'Đang cập nhật...' : 'Đang gửi...') : (isEditing ? 'Lưu đánh giá' : 'Gửi đánh giá')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ReceiverCard({ order }) {
    return (
        <Card title="Thông tin nhận hàng" icon={Truck}>
            <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox label="Người nhận" value={order.receiver?.name} />
                <InfoBox label="Số điện thoại" value={order.receiver?.phone} />
                <div className="sm:col-span-2">
                    <InfoBox label="Địa chỉ" value={order.receiver?.address} />
                </div>
            </div>
        </Card>
    );
}

function PaymentCard({ order }) {
    return (
        <Card title="Thanh toán" icon={CreditCard}>
            {order.payment ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Trạng thái</span>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${order.payment.statusClass}`}
                        >
                            {order.payment.statusText}
                        </span>
                    </div>

                    <InfoBox label="Phương thức thanh toán" value={order.payment.methodText} />
                    <InfoBox label="Số tiền" value={formatMoney(order.payment.amount)} />
                    <InfoBox label="Mã giao dịch" value={order.payment.transactionId} />
                    <InfoBox label="Thời gian tạo" value={formatDate(order.payment.createdAt)} />
                </div>
            ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Chưa có giao dịch thanh toán.
                </div>
            )}
        </Card>
    );
}

function SummaryCard({ order }) {
    const summary = order.summary || {};

    return (
        <Card title="Tổng kết đơn hàng" icon={ReceiptText}>
            <div className="space-y-3 text-sm">
                <Row label="Tạm tính" value={formatMoney(summary.subTotal)} />
                <Row label="Phí vận chuyển" value={formatMoney(summary.shippingFee)} />
                <Row
                    label="Giảm giá"
                    value={Number(summary.discount || 0) > 0 ? `- ${formatMoney(summary.discount)}` : formatMoney(0)}
                    positive={Number(summary.discount || 0) > 0}
                />

                <div className="border-t border-slate-200 pt-3 dark:border-slate-800" />

                <Row label="Tổng cộng" value={formatMoney(summary.grandTotal)} strong />
            </div>
        </Card>
    );
}

function TimelineCard({ order }) {
    const timeline = Array.isArray(order.timeline) ? order.timeline : [];

    return (
        <Card title="Tiến trình đơn hàng" icon={Clock}>
            {timeline.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Chưa có tiến trình đơn hàng.</p>
            ) : (
                <div className="space-y-4">
                    {timeline.map((step, index) => (
                        <div key={`${step.label}-${index}`} className="flex gap-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                    step.done
                                        ? 'bg-blue-950 text-white dark:bg-blue-700'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                            >
                                {step.done ? <CheckCircle2 size={20} /> : <Circle size={18} />}
                            </div>

                            <div>
                                <p className="font-bold text-blue-950 dark:text-white">{step.label}</p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {step.time || 'Đang chờ cập nhật'}
                                </p>

                                {step.note ? (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {step.note}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

function PickupCard({ order }) {
    return (
        <Card title="Hướng dẫn nhận hàng" icon={MapPin}>
            <Guide icon={MapPin}>
                {order.pickup?.location || 'Nhận hàng tại Phòng Công tác Chính trị và Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ hoặc theo thông báo từ cửa hàng.'}
            </Guide>

            <Guide icon={Info}>{order.pickup?.instruction || 'Vui lòng giữ mã đơn hàng khi nhận sản phẩm.'}</Guide>

            <Guide icon={Phone}>Giữ liên lạc để nhân viên xác nhận khi cần.</Guide>
        </Card>
    );
}

function Card({ title, icon: Icon, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
                {Icon && <Icon size={20} className="text-blue-950 dark:text-blue-300" />}
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">{title}</h2>
            </div>

            {children}
        </section>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 break-words font-bold text-blue-950 dark:text-white">{value || '—'}</p>
        </div>
    );
}

function Row({ label, value, strong = false, positive = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>

            <span
                className={`text-right ${
                    strong
                        ? 'text-xl font-extrabold text-blue-950 dark:text-blue-300'
                        : positive
                          ? 'font-bold text-emerald-600 dark:text-emerald-400'
                          : 'font-bold text-blue-950 dark:text-white'
                }`}
            >
                {value}
            </span>
        </div>
    );
}

function Guide({ icon: Icon, children }) {
    return (
        <div className="mb-4 flex gap-3 last:mb-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                <Icon size={18} />
            </div>

            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{children}</p>
        </div>
    );
}

function LoadingBox({ text }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            {text}
        </div>
    );
}

function cancelReasonText(reason) {
    const map = {
        user_cancelled: 'Người dùng hủy',
        expired: 'Hết hạn thanh toán',
        payment_failed: 'Thanh toán thất bại',
    };

    return map[reason] || reason;
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return '—';

    if (typeof value === 'string' && value.includes('/')) {
        return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('vi-VN');
}

function isOrderPaid(order) {
    return order?.payment?.status === 'paid' || order?.raw?.payment_status === 'paid';
}