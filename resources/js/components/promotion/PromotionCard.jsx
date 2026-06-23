import { BadgePercent, CalendarDays, Clock3, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromotionCard({ promotion }) {
    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/promotions/${promotion.slug}`} className="block">
                <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800 md:h-48">
                    <img
                        src={promotion.thumbnail || promotion.banner || '/images/no-image.png'}
                        alt={promotion.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.src = '/images/no-image.png';
                        }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
                        <BadgePercent size={13} />
                        {promotion.discountText}
                    </span>

                    <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-blue-950 shadow-sm backdrop-blur">
                        {promotion.statusText}
                    </span>
                </div>
            </Link>

            <div className="p-4">
                <Link to={`/promotions/${promotion.slug}`}>
                    <h3 className="line-clamp-2 min-h-[44px] font-black text-blue-950 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300">
                        {promotion.title}
                    </h3>
                </Link>

                {promotion.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {promotion.description}
                    </p>
                )}

                <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-blue-700 dark:text-blue-300" />
                        <span>
                            {promotion.startDate} - {promotion.endDate}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Package size={15} className="text-blue-700 dark:text-blue-300" />
                        <span>{promotion.totalItems} sản phẩm áp dụng</span>
                    </div>

                    {promotion.countdownSeconds > 0 && (
                        <div className="flex items-center gap-2">
                            <Clock3 size={15} className="text-red-500" />
                            <span>
                                Còn {promotion.countdown.days} ngày {promotion.countdown.hours} giờ
                            </span>
                        </div>
                    )}
                </div>

                <Link
                    to={`/promotions/${promotion.slug}`}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-950 text-sm font-black text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Xem sản phẩm
                </Link>
            </div>
        </article>
    );
}
