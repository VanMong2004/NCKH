import { Star } from 'lucide-react';

export default function ProductReviews({ product }) {
    const reviews = product.reviewsList || product.reviews || [];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-blue-950 dark:text-white">Đánh giá sản phẩm</h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {product.review_count || product.total_reviews || reviews.length || 0} đánh giá
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-amber-600 dark:bg-amber-950/30">
                    <Star size={18} fill="currentColor" />
                    <span className="font-extrabold">
                        {Number(product.rating || product.average_rating || 0).toFixed(1)}
                    </span>
                </div>
            </div>

            {reviews.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    Chưa có đánh giá nào cho sản phẩm này.
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review, index) => (
                        <ReviewItem key={review.id || index} review={review} />
                    ))}
                </div>
            )}
        </section>
    );
}

function ReviewItem({ review }) {
    const name = review.user?.name || review.user_name || 'Người dùng';
    const rating = Number(review.rating || 0);

    return (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-bold text-blue-950 dark:text-white">{name}</p>

                    <div className="mt-1 flex gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} size={14} fill={index < rating ? 'currentColor' : 'none'} />
                        ))}
                    </div>
                </div>

                <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {review.comment || review.content || 'Không có nội dung đánh giá.'}
            </p>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '';

    return new Date(value).toLocaleDateString('vi-VN');
}
