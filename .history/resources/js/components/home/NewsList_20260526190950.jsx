import { CalendarDays, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

import SectionHeader from '../ui/SectionHeader';

export default function NewsList({ news = [] }) {
    return (
        <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Tin tức & sự kiện" to="/blog" actionText="Xem Blog" />

            {news.length > 0 ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {news.map((item) => (
                        <Link
                            key={item.id || item.slug}
                            to={`/blog/${item.slug}`}
                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/30"
                        >
                            <div className="h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = '/images/no-image.png';
                                    }}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>

                            <div className="p-4">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                    <Newspaper size={12} />
                                    {item.category || 'Tin tức'}
                                </div>

                                <h3 className="mt-3 line-clamp-2 text-sm font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                                    {item.title}
                                </h3>

                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    {item.description || 'Thông tin đang được cập nhật.'}
                                </p>

                                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                    <CalendarDays size={13} />
                                    {formatDate(item.date)}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Chưa có tin tức mới.</p>
                </div>
            )}
        </section>
    );
}

function formatDate(value) {
    if (!value) return 'Đang cập nhật';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}
