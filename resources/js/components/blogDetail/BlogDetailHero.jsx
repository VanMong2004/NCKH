import { ArrowLeft, CalendarDays, Clock3, Share2, Tag, UserRound } from 'lucide-react';

export default function BlogDetailHero({ blog, readingTime = 1, onBack, onShare }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute right-10 top-6 h-28 w-28 rounded-full bg-sky-200/70 blur-2xl dark:bg-sky-500/10" />

            <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_430px] lg:p-9">
                <div className="flex min-w-0 flex-col justify-center">
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-950 transition hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                        >
                            <ArrowLeft size={16} />
                            Quay lại
                        </button>

                        <button
                            type="button"
                            onClick={onShare}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <Share2 size={16} />
                            Chia sẻ
                        </button>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <Tag size={14} />
                        {getCategoryLabel(blog.category)}
                    </div>

                    <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-blue-950 dark:text-white md:text-5xl">
                        {blog.title}
                    </h1>

                    {blog.excerpt ? (
                        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                            {blog.excerpt}
                        </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <MetaPill icon={UserRound} text={blog.authorName || 'CTUT'} />
                        <MetaPill icon={CalendarDays} text={formatDate(blog.publishedAt)} />
                        <MetaPill icon={Clock3} text={`${readingTime} phút đọc`} />
                    </div>
                </div>

                <div className="relative min-h-[260px] overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-sm dark:bg-slate-800 lg:min-h-[360px]">
                    <img src={blog.thumbnail} alt={blog.title} className="h-full w-full object-cover" />

                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                </div>
            </div>
        </section>
    );
}

function MetaPill({ icon: Icon, text }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <Icon size={14} className="text-blue-700 dark:text-blue-300" />
            {text || 'Đang cập nhật'}
        </span>
    );
}

function formatDate(value) {
    if (!value) return 'Đang cập nhật';

    if (String(value).includes('/')) {
        return String(value).split(' ')[0];
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

function getCategoryLabel(category) {
    const value = String(category || '').trim();

    if (!value) return 'Tin tức';

    const normalized = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ');

    if (normalized.includes('tin tuc') || normalized.includes('news')) return 'Tin tức';
    if (normalized.includes('su kien') || normalized.includes('event')) return 'Sự kiện';
    if (normalized.includes('khuyen mai') || normalized.includes('promotion')) return 'Khuyến mãi';

    return value;
}
