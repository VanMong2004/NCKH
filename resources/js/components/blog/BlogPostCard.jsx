import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogPostCard({ blog, featured = false }) {
    return (
        <article
            className={[
                'overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900',
                featured ? 'lg:grid lg:grid-cols-[1.15fr_1fr]' : '',
            ].join(' ')}
        >
            <Link to={`/blog/${blog.slug}`} className={featured ? 'contents' : 'block'}>
                <div className={featured ? 'h-full min-h-[260px] bg-slate-100 dark:bg-slate-800' : 'h-52 bg-slate-100 dark:bg-slate-800'}>
                    <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>

                <div className={featured ? 'flex flex-col justify-center p-6 sm:p-8' : 'p-5'}>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <CalendarDays size={14} />
                        {formatDate(blog.publishedAt)}
                    </div>

                    <h3 className="mt-3 text-xl font-black leading-snug text-blue-950 dark:text-white">
                        {blog.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {blog.summary || 'Noi dung dang duoc cap nhat.'}
                    </p>

                    <span className="mt-5 inline-flex w-fit rounded-xl bg-blue-950 px-4 py-2 text-sm font-bold text-white dark:bg-blue-600">
                        Xem chi tiet
                    </span>
                </div>
            </Link>
        </article>
    );
}

function formatDate(value) {
    if (!value) return 'Dang cap nhat';

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
