import { Camera, Pencil, Star, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

import reviewService from '../../services/reviewService';

export default function OrderDetailItems({ order, onReviewSubmitted }) {
    const items = order.items || [];

    const [reviewingItem, setReviewingItem] = useState(null);

    const canReviewOrder = order.status === 'completed';

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Sản phẩm trong đơn hàng</h2>

            <div className="space-y-3">
                {items.map((item) => {
                    const canReviewItem = canReviewOrder && item.productId && !item.reviewed;

                    return (
                        <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:flex-row"
                        >
                            <div className="flex gap-3 sm:flex-1">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                                    <img
                                        src={item.thumbnail || '/images/no-image.png'}
                                        alt={item.productName}
                                        className="max-h-full max-w-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/no-image.png';
                                        }}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 font-bold text-blue-950 dark:text-white">
                                        {item.productName}
                                    </p>

                                    {(item.variant?.size || item.variant?.color || item.variant?.sku) && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {item.variant?.sku && <>SKU: {item.variant.sku}</>}
                                            {item.variant?.sku && (item.variant?.size || item.variant?.color) && ' · '}
                                            {item.variant?.size && <>Size: {item.variant.size}</>}
                                            {item.variant?.size && item.variant?.color && ' · '}
                                            {item.variant?.color && <>Màu: {item.variant.color}</>}
                                        </p>
                                    )}

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        SL: {item.quantity} · {formatMoney(item.price)}
                                    </p>

                                    {item.promotion?.title && (
                                        <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {item.promotion.title}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:w-44 sm:flex-col sm:items-end">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-blue-950 dark:text-blue-300">
                                        {formatMoney(item.total)}
                                    </p>

                                    {Number(item.discountAmount || 0) > 0 && (
                                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            Đã giảm{' '}
                                            {formatMoney(Number(item.discountAmount) * Number(item.quantity || 0))}
                                        </p>
                                    )}
                                </div>

                                {canReviewOrder && (
                                    <>
                                        {item.reviewed ? (
                                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                <Star size={14} fill="currentColor" />
                                                Đã đánh giá
                                            </span>
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
        </section>
    );
}

function ReviewModal({ order, item, onClose, onSubmitted }) {
    const [form, setForm] = useState({
        rating: 5,
        comment: '',
        images: [],
    });

    const [submitting, setSubmitting] = useState(false);

    function handleImageChange(e) {
        const files = Array.from(e.target.files || []);

        if (files.length + form.images.length > 5) {
            toast.warning('Chỉ được tải tối đa 5 ảnh');
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

            await reviewService.createReview({
                orderId: order.id,
                productId: item.productId,
                rating: form.rating,
                comment: form.comment,
                images: form.images,
            });

            toast.success('Đánh giá sản phẩm thành công');
            await onSubmitted();
        } catch (error) {
            toast.error(error.message || 'Không thể gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-extrabold text-blue-950 dark:text-white">Đánh giá sản phẩm</h3>

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
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
