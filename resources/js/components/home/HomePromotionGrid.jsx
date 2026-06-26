import { BadgePercent, CalendarDays, Clock3, Package, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import SectionHeader from '../ui/SectionHeader';

export default function HomePromotionGrid({ promotions = [] }) {
    const displayPromotions = promotions.slice(0, 3);

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Đợt khuyến mãi" to="/promotions" actionText="Xem tất cả" />

            {displayPromotions.length > 0 ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {displayPromotions.map((promotion) => (
                        <PromotionCard
                            key={promotion.id}
                            promotion={promotion}
                        />
                    ))}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <Sparkles size={22} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Hiện chưa có đợt khuyến mãi đang hiển thị.
                    </p>
                </div>
            )}
        </section>
    );
}

function PromotionCard({ promotion }) {
    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={promotion.thumbnail || promotion.banner || '/images/no-image.png'}
                    alt={promotion.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
                    <BadgePercent size={13} />
                    {promotion.discountText}
                </span>

                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-blue-950 shadow-sm backdrop-blur">
                    {promotion.statusText}
                </span>
            </div>

            <div className="p-3.5">
                <h3 className="line-clamp-2 min-h-[44px] text-base font-black text-blue-950 dark:text-white">
                    {promotion.title}
                </h3>

                {promotion.description && (
                    <p className="mt-2 line-clamp-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
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
