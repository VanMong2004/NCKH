import { Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
                <Link
                    to={`/product/${product.slug}`}
                    className="flex aspect-square items-center justify-center bg-slate-50 p-4 dark:bg-slate-800"
                >
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = '/images/no-image.png';
                        }}
                        className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                </Link>

                {product.label && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">
                        {product.label}
                    </span>
                )}

                <button
                    type="button"
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm transition hover:bg-blue-950 hover:text-white dark:bg-slate-950/90 dark:text-slate-300"
                    aria-label="Thêm vào yêu thích"
                >
                    <Heart size={17} />
                </button>
            </div>

            <div className="p-3 sm:p-4">
                <Link to={`/product/${product.slug}`}>
                    <h3 className="line-clamp-2 min-h-[42px] text-sm font-bold text-blue-950 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300 sm:text-base">
                        {product.name}
                    </h3>
                </Link>

                <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{product.categoryName}</p>

                <p className="mt-2 text-sm font-extrabold text-blue-950 dark:text-blue-300 sm:text-base">
                    {product.priceText}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                        <Star size={14} fill="currentColor" />
                        {Number(product.rating || 0).toFixed(1)}
                    </span>

                    <span className="text-slate-400 dark:text-slate-500">({product.reviews})</span>

                    <span className="text-slate-300 dark:text-slate-700">|</span>

                    <span className="text-slate-500 dark:text-slate-400">Đã bán {product.sold}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                        className={`text-xs font-bold ${
                            product.inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}
                    >
                        {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                    </span>

                    <Link
                        to={`/product/${product.slug}`}
                        className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        Chi tiết
                    </Link>
                </div>
            </div>
        </article>
    );
}
