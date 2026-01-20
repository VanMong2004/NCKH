import { Star } from 'lucide-react';

const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Thông tin người dùng */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <img 
          src={review.avatar} 
          alt={review.author}
          className="w-10 h-10 rounded-full object-cover"
        />

        {/* Tên và rating */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{review.author}</h3>
            <span className="text-xs text-gray-500">• {review.date}</span>
          </div>

          {/* Stars - ĐƠN GIẢN */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-300 text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Nội dung đánh giá */}
      <p className="text-gray-600 text-sm leading-relaxed">
        {review.content}
      </p>
    </div>
  );
};

export default ReviewCard;