import { Star } from 'lucide-react';

export default function RecentReviews({ reviews }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-950">Đánh giá gần đây</h2>
                <a href="#" className="text-sm font-bold text-blue-700">
                    Xem tất cả đánh giá
                </a>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                {reviews.map((review) => (
                    <article key={review.id} className="flex gap-4">
                        <img
                            src={review.image}
                            alt={review.product}
                            className="h-24 w-24 rounded-xl bg-slate-50 object-contain"
                        />

                        <div>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="font-bold text-blue-950">{review.product}</h3>
                                <span className="text-xs text-slate-400">{review.date}</span>
                            </div>

                            <div className="mt-2 flex text-orange-400">
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <Star key={item} size={14} fill="currentColor" />
                                ))}
                            </div>

                            <p className="mt-2 text-sm text-slate-600">{review.text}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
