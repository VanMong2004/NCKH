import { Star } from 'lucide-react';

const RatingSummary = () => {
    const ratingData = [
        { stars: 5, count: 8 },
        { stars: 4, count: 10 },
        { stars: 3, count: 2 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
    ];

    const totalReviews = ratingData.reduce((sum, item) => sum + item.count, 0);

    const overallRating = totalReviews
        ? (ratingData.reduce((sum, item) => sum + item.stars * item.count, 0) / totalReviews).toFixed(1)
        : 0;

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return [1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-5 h-5 ${
                    star <= fullStars || (star === fullStars + 1 && hasHalfStar)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-300 text-gray-300'
                }`}
            />
        ));
    };

    return (
        <div className="rounded-lg p-4">
            {/* Tổng điểm */}
            <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-title">{overallRating}</span>
                    <div className="flex gap-0.5">{renderStars(overallRating)}</div>
                </div>
                <p className="text-sm text-muted">Dựa trên {totalReviews} đánh giá</p>
            </div>

            {/* Phân bố sao */}
            <div className="space-y-2">
                {ratingData.map((item) => {
                    const percentage = totalReviews ? Math.round((item.count / totalReviews) * 100) : 0;

                    return (
                        <div key={item.stars} className="flex items-center gap-2">
                            <span className="text-sm text-body w-4">{item.stars}</span>

                            <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-400 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            <span className="text-sm text-muted w-10 text-right">{percentage}%</span>
                        </div>
                    );
                })}
            </div>

            {/* Nút viết đánh giá */}
            <div className="mt-6 text-center">
                <button className="btn-link text-sm">Viết đánh giá</button>
            </div>
        </div>
    );
};

export default RatingSummary;
