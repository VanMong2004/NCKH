import { Pencil, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../../admin/components/ui/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import reviewService from '../../services/reviewService';

export default function ProductReviews({ product }) {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState({
        averageRating: Number(product.rating || product.averageRating || 0),
        totalReviews: Number(product.reviewCount || product.totalReviews || 0),
        ratingBreakdown: {},
    });

    const [filter, setFilter] = useState({
        rating: '',
        sort: 'latest',
    });

    const [loading, setLoading] = useState(false);
    const [editingReview, setEditingReview] = useState(null);

    useEffect(() => {
        if (product?.id) {
            loadReviews();
        }
    }, [product?.id, filter.rating, filter.sort]);

    async function loadReviews() {
        try {
            setLoading(true);

            const result = await reviewService.getProductReviews(product.id, {
                rating: filter.rating || undefined,
                sort: filter.sort,
                per_page: 10,
            });

            setReviews(result.reviews || []);
            setSummary({
                averageRating: result.averageRating,
                totalReviews: result.totalReviews,
                ratingBreakdown: result.ratingBreakdown,
            });
        } catch (error) {
            toast.error(error.message || 'Không thể tải đánh giá');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">Đánh giá sản phẩm</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {summary.totalReviews} đánh giá từ người mua hàng
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-amber-600 dark:bg-amber-950/30">
                    <Star size={18} fill="currentColor" />
                    <span className="font-extrabold">{Number(summary.averageRating || 0).toFixed(1)}</span>
                </div>
            </div>

            <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
                Bạn chỉ có thể đánh giá sản phẩm tại mục <span className="font-extrabold">Đơn hàng đã hoàn thành</span>.
            </div>

            <ReviewFilters filter={filter} onChange={setFilter} />

            {loading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Đang tải đánh giá...
                </div>
            ) : reviews.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Chưa có đánh giá nào cho sản phẩm này.
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewItem
                            key={review.id}
                            review={review}
                            currentUser={user}
                            onDeleted={loadReviews}
                            onEdit={setEditingReview}
                        />
                    ))}
                </div>
            )}

            {editingReview && (
                <EditReviewModal
                    review={editingReview}
                    onClose={() => setEditingReview(null)}
                    onSubmitted={async () => {
                        setEditingReview(null);
                        await loadReviews();
                    }}
                />
            )}
        </section>
    );
}

function ReviewFilters({ filter, onChange }) {
    return (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
                {['', 5, 4, 3, 2, 1].map((rating) => (
                    <button
                        key={rating || 'all'}
                        type="button"
                        onClick={() =>
                            onChange((prev) => ({
                                ...prev,
                                rating,
                            }))
                        }
                        className={`min-w-max rounded-xl border px-4 py-2 text-sm font-bold ${
                            filter.rating === rating
                                ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                                : 'border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                        }`}
                    >
                        {rating ? `${rating} sao` : 'Tất cả'}
                    </button>
                ))}
            </div>

            <select
                value={filter.sort}
                onChange={(e) =>
                    onChange((prev) => ({
                        ...prev,
                        sort: e.target.value,
                    }))
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
                <option value="latest">Mới nhất</option>
                <option value="highest">Điểm cao nhất</option>
                <option value="lowest">Điểm thấp nhất</option>
            </select>
        </div>
    );
}

function ReviewItem({ review, currentUser, onDeleted, onEdit }) {
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isMine = currentUser && Number(currentUser.id) === Number(review.user?.id);

    async function handleDeleteConfirmed() {
        try {
            setDeleting(true);

            await reviewService.deleteReview(review.id);

            toast.success('Đã xóa đánh giá');
            await onDeleted();
        } catch (error) {
            toast.error(error.message || 'Không thể xóa đánh giá');
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
        }
    }

    return (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-50 font-bold text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                        {review.user?.avatar ? (
                            <img
                                src={review.user.avatar}
                                alt={review.user.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            review.user?.name?.charAt(0) || 'U'
                        )}
                    </div>

                    <div>
                        <p className="font-bold text-blue-950 dark:text-white">{review.user?.name || 'Người dùng'}</p>

                        <div className="mt-1 flex gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Star key={index} size={14} fill={index < review.rating ? 'currentColor' : 'none'} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>

                    {isMine && (
                        <div className="mt-2 flex items-center justify-end gap-3">
                            <button type="button" onClick={() => onEdit(review)} className="inline-flex text-blue-600">
                                <Pencil size={16} />
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setConfirmOpen(true)}
                                className="inline-flex text-red-500 disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {review.comment || 'Không có nội dung đánh giá.'}
            </p>

            {review.images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((url, index) => (
                        <a
                            key={`${url}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                            <img src={url} alt={`Ảnh đánh giá ${index + 1}`} className="h-full w-full object-cover" />
                        </a>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={confirmOpen}
                title="Xác nhận xóa đánh giá"
                message="Bạn có chắc muốn xóa đánh giá này?"
                description="Đánh giá đã xóa sẽ không thể khôi phục lại từ trang người dùng."
                confirmText="Xóa đánh giá"
                type="danger"
                onConfirm={handleDeleteConfirmed}
                onOpenChange={setConfirmOpen}
            />
        </div>
    );
}

function EditReviewModal({ review, onClose, onSubmitted }) {
    const [form, setForm] = useState({
        rating: review.rating || 5,
        comment: review.comment || '',
        images: [],
    });

    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.comment.trim() || form.comment.trim().length < 10) {
            toast.warning('Nội dung đánh giá tối thiểu 10 ký tự');
            return;
        }

        try {
            setSubmitting(true);

            await reviewService.updateReview(review.id, {
                rating: form.rating,
                comment: form.comment,
                images: form.images,
            });

            toast.success('Cập nhật đánh giá thành công');
            await onSubmitted();
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật đánh giá');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
                <h3 className="text-lg font-extrabold text-blue-950 dark:text-white">Chỉnh sửa đánh giá</h3>

                <form onSubmit={handleSubmit} className="mt-4">
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
                                    <Star size={26} fill={value <= form.rating ? 'currentColor' : 'none'} />
                                </button>
                            );
                        })}
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
                        className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <div className="mt-5 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold dark:border-slate-700"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60 dark:bg-blue-700"
                        >
                            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '';

    if (typeof value === 'string' && value.includes('/')) {
        return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
