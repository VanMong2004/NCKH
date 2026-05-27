import { CalendarDays, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogCard({ blog }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/blog/${blog.slug}`}>
                <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />
            </Link>

            <div className="p-5">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {blog.category}
                </span>

                <Link to={`/blog/${blog.slug}`}>
                    <h2 className="mt-3 line-clamp-2 text-lg font-extrabold text-blue-950 hover:text-blue-700 dark:text-white">
                        {blog.title}
                    </h2>
                </Link>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{blog.excerpt}</p>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDate(blog.publishedAt)}
                    </span>

                    <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {blog.viewCount}
                    </span>
                </div>
            </div>
        </article>
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
