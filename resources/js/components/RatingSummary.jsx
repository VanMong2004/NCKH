import { Star } from "lucide-react";

const RatingSummary = () => {
    const ratingData = [
        { stars: 5, percentage: 40 },
        { stars: 4, percentage: 100 },
        { stars: 3, percentage: 0 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 },
    ];

    const overallRating = 4.0;

    const renderStars = (rating) => {
        return [1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-5 h-5 ${
                    star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-300 text-gray-300"
                }`}
            />
        ));
    };

    return (
        <div className="rounded-lg p-2">
  
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-bold">{overallRating}</span>
                    <div className="flex gap-0.5">
                        {renderStars(overallRating)}
                    </div>
                </div>
            </div>


            <div className="space-y-2">
                {ratingData.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-4">
                            {item.stars}
                        </span>

                        {/* Thanh tỉ lệ sao */}
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-400 h-2 rounded-full transition-all"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>

                        <span className="text-sm text-gray-600 w-10 text-right">
                            {item.percentage}%
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <button className="text-blue-500 hover:text-blue-600 font-medium text-sm">
                    Viết đánh giá
                </button>
            </div>
        </div>
    );
};

export default RatingSummary;
