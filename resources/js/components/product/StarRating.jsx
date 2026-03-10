import { Star, StarHalf } from "lucide-react";

const StarRating = ({ rating, max = 5 }) => {
  const safeRating = Math.min(Math.max(rating, 0), max);
  const full = Math.floor(safeRating);
  const half = safeRating % 1 >= 0.5;
  const empty = max - full - (half ? 1 : 0);

  return (
    <div className="flex gap-1">
      {[...Array(full)].map((_, i) => (
        <Star key={`f-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      ))}
      {half && <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
      {[...Array(empty)].map((_, i) => (
        <Star key={`e-${i}`} className="w-5 h-5 fill-gray-300 text-gray-300" />
      ))}
    </div>
  );
};
export default StarRating