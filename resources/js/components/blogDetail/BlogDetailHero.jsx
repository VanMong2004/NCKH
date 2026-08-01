import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';

export default function BlogDetailHero({ blog, onBack }) {
    return (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
                <ArrowLeft size={16} />
                Quay lại danh sách tin tức
            </button>

            <h1 className="mt-5 text-3xl font-black leading-tight text-blue-950 dark:text-white sm:text-4xl">
                {blog.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <MetaPill icon={CalendarDays} text={formatDate(blog.publishedAt)} />
                <MetaPill icon={UserRound} text={blog.authorName || 'Ban quản trị CTUT UniShop'} />
            </div>

            {blog.summary ? (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    {blog.summary}
                </p>
            ) : null}
        </section>
    );
}

function MetaPill({ icon: Icon, text }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
            <Icon size={15} className="text-blue-700 dark:text-blue-300" />
            {text || 'Đang cập nhật'}
        </span>
    );
}

function formatDate(value) {
    if (!value) return 'Đang cập nhật';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}
