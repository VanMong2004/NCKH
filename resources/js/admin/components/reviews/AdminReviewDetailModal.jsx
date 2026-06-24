import { Eye, EyeOff, Loader2, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../ui/ConfirmDialog';
import { getReviewStatusText } from '../../mappers/adminReviewMapper';
import adminReviewService from '../../services/adminReviewService';

export default function AdminReviewDetailModal({ open, reviewId, onClose, onUpdated }) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState('');

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
        if (!open || !reviewId) return;

        loadReview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, reviewId]);

    async function loadReview() {
        try {
            setLoading(true);

            const result = await adminReviewService.getReview(reviewId);

            setReview(result);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết đánh giá');
            onClose?.();
        } finally {
            setLoading(false);
        }
    }

    async function handleShow() {
        if (!review) return;

        try {
            setAction('show');

            const result = await adminReviewService.showReview(review.id);

            setReview(result);
            toast.success('Đã hiển thị đánh giá');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể hiển thị đánh giá');
        } finally {
            setAction('');
        }
    }

    function handleHide() {
        if (!review) return;

        setConfirmDialog({
            open: true,
            title: 'Ẩn đánh giá',
            message: 'Bạn muốn ẩn đánh giá này khỏi website?',
            description:
                'Đánh giá bị ẩn sẽ không hiển thị ở trang sản phẩm, nhưng dữ liệu vẫn được giữ trong hệ thống.',
            confirmText: 'Ẩn đánh giá',
            type: 'warning',
            onConfirm: hideReview,
        });
    }

    async function hideReview() {
        try {
            setAction('hide');

            const result = await adminReviewService.hideReview(review.id);

            setReview(result);
            toast.success('Đã ẩn đánh giá');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể ẩn đánh giá');
        } finally {
            setAction('');
        }
    }

    function handleDelete() {
        if (!review) return;

        setConfirmDialog({
            open: true,
            title: 'Xóa đánh giá',
            message: 'Bạn muốn xóa đánh giá này?',
            description: 'Đánh giá đã xóa sẽ không hiển thị lại được từ màn hình này.',
            confirmText: 'Xóa đánh giá',
            type: 'danger',
            onConfirm: deleteReview,
        });
    }

    async function deleteReview() {
        try {
            setAction('delete');

            const result = await adminReviewService.deleteReview(review.id);

            toast.success(result.message || 'Đã xóa đánh giá');
            onUpdated?.();
            onClose?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa đánh giá');
        } finally {
            setAction('');
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3">
            <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết đánh giá</h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Xem nội dung đánh giá, hình ảnh và xử lý hiển thị.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading || !review ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">Đang tải chi tiết đánh giá...</p>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="space-y-5">
                                <Section title="Nội dung đánh giá">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <RatingStars rating={review.rating} />

                                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
                                                {review.comment || 'Không có nội dung đánh giá.'}
                                            </p>
                                        </div>

                                        <ReviewStatusBadge status={review.status}>
                                            {getReviewStatusText(review.status)}
                                        </ReviewStatusBadge>
                                    </div>
                                </Section>

                                <Section title="Hình ảnh đánh giá" description={`${review.images?.length || 0} ảnh`}>
                                    {review.images?.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {review.images.map((image, index) => (
                                                <a
                                                    key={`${image}-${index}`}
                                                    href={image}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                                                >
                                                    <img
                                                        src={image}
                                                        alt={`Ảnh đánh giá ${index + 1}`}
                                                        className="h-44 w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/images/no-image.png';
                                                        }}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                                            Đánh giá này không có hình ảnh.
                                        </div>
                                    )}
                                </Section>
                            </div>

                            <aside className="space-y-5">
                                <Section title="Thông tin liên quan">
                                    <div className="space-y-3">
                                        <InfoLine label="Sản phẩm" value={review.product?.name || '—'} />
                                        <InfoLine label="Slug sản phẩm" value={review.product?.slug || '—'} />
                                        <InfoLine label="Người đánh giá" value={review.user?.name || '—'} />
                                        <InfoLine label="Email" value={review.user?.email || '—'} />
                                        <InfoLine
                                            label="Mã đơn hàng"
                                            value={review.orderCode || (review.orderId ? `#${review.orderId}` : '—')}
                                        />
                                        <InfoLine label="Ngày gửi" value={review.createdAt || '—'} />
                                        {review.deletedAt && <InfoLine label="Ngày xóa" value={review.deletedAt} />}
                                    </div>
                                </Section>

                                <Section title="Thao tác">
                                    {review.status !== 'deleted' ? (
                                        <div className="space-y-2">
                                            {review.status === 'visible' ? (
                                                <button
                                                    type="button"
                                                    disabled={Boolean(action)}
                                                    onClick={handleHide}
                                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    {action === 'hide' ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <EyeOff size={16} />
                                                    )}
                                                    Ẩn đánh giá
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={Boolean(action)}
                                                    onClick={handleShow}
                                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    {action === 'show' ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                    Hiển thị đánh giá
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={Boolean(action)}
                                                onClick={handleDelete}
                                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                            >
                                                {action === 'delete' ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                                Xóa đánh giá
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950">
                                            Đánh giá đã bị xóa, không còn thao tác hiển thị.
                                        </div>
                                    )}

                                    <p className="mt-3 text-sm text-slate-500">
                                        Ẩn đánh giá sẽ làm đánh giá không hiển thị ngoài website nhưng vẫn giữ dữ liệu.
                                    </p>
                                </Section>
                            </aside>
                        </div>
                    </div>
                )}
            </div>

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

function Section({ title, description, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

function InfoLine({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="max-w-[180px] break-words text-right text-sm font-semibold text-slate-900 dark:text-white">
                {value || '—'}
            </span>
        </div>
    );
}

function RatingStars({ rating }) {
    const value = Number(rating || 0);

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={18}
                    className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
            ))}
        </div>
    );
}

function ReviewStatusBadge({ status, children }) {
    const key = String(status || '').toLowerCase();

    const className =
        key === 'visible'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : key === 'hidden'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300';

    return (
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
            {children}
        </span>
    );
}
