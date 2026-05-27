import { useEffect, useState } from 'react';
import { Camera, Star, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';


import reviewService from '../../services/reviewService';
import { useAuth } from '../contexts/AuthContext';

export default function ProductReviews({ product }) {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState({
        averageRating: Number(product.rating || product.average_rating || 0),
        totalReviews: Number(product.review_count || product.total_reviews || 0),
        ratingBreakdown: {},
    });

    const [filter, setFilter] = useState({
        rating: '',
        sort: 'latest',
    });

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        rating: 5,
        comment: '',
        images: [],
    });

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

            setReviews(result.reviews);

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

        if (!user) {
            toast.warning('Vui lòng đăng nhập để đánh giá sản phẩm');
            return;
        }

        if (!form.comment.trim() || form.comment.trim().length < 10) {
            toast.warning('Nội dung đánh giá tối thiểu 10 ký tự');
            return;
        }

        try {
            setSubmitting(true);

            await reviewService.createReview({
                productId: product.id,
                rating: form.rating,
                comment: form.comment,
                images: form.images,
            });

            toast.success('Đánh giá sản phẩm thành công');

            setForm({
                rating: 5,
                comment: '',
                images: [],
            });

            await loadReviews();
        } catch (error) {
            toast.error(error.message || 'Không thể gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">Đánh giá sản phẩm</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{summary.totalReviews} đánh giá</p>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-amber-600 dark:bg-amber-950/30">
                    <Star size={18} fill="currentColor" />
                    <span className="font-extrabold">{Number(summary.averageRating || 0).toFixed(1)}</span>
                </div>
            </div>

            <ReviewForm
                form={form}
                submitting={submitting}
                onChange={setForm}
                onSubmit={handleSubmit}
                onImageChange={handleImageChange}
                onRemoveImage={removeImage}
            />

            <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

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
                        <ReviewItem key={review.id} review={review} currentUser={user} onDeleted={loadReviews} />
                    ))}
                </div>
            )}
        </section>
    );
}

function ReviewForm({ form, submitting, onChange, onSubmit, onImageChange, onRemoveImage }) {
    return (
        <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
        >
            <h3 className="font-bold text-blue-950 dark:text-white">Viết đánh giá của bạn</h3>

            <div className="mt-3 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;

                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() =>
                                onChange((prev) => ({
                                    ...prev,
                                    rating: value,
                                }))
                            }
                            className="p-1"
                        >
                            <Star size={24} fill={value <= form.rating ? 'currentColor' : 'none'} />
                        </button>
                    );
                })}
            </div>

            <textarea
                value={form.comment}
                onChange={(e) =>
                    onChange((prev) => ({
                        ...prev,
                        comment: e.target.value,
                    }))
                }
                rows={4}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            <div className="mt-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <Camera size={17} />
                    Thêm ảnh
                    <input type="file" accept="image/*" multiple onChange={onImageChange} className="hidden" />
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
                                    onClick={() => onRemoveImage(index)}
                                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
            >
                <Upload size={17} />
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn tất thanh toán.
            </p>
        </form>
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

function ReviewItem({ review, currentUser, onDeleted }) {
    const [deleting, setDeleting] = useState(false);

    const isMine = currentUser && Number(currentUser.id) === Number(review.user?.id);

    async function handleDelete() {
        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

        try {
            setDeleting(true);

            await reviewService.deleteReview(review.id);

            toast.success('Đã xóa đánh giá');
            await onDeleted();
        } catch (error) {
            toast.error(error.message || 'Không thể xóa đánh giá');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                        {review.user?.avatar ? (
                            <img
                                src={review.user.avatar}
                                alt={review.user.name}
                                className="h-full w-full rounded-full object-cover"
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
                        <button
                            type="button"
                            disabled={deleting}
                            onClick={handleDelete}
                            className="ml-3 inline-flex text-red-500 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
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
