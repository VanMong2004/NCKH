import { ArrowRight, CalendarDays, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogPostCard({ blog, variant = 'featured' }) {
    if (variant === 'popular') {
        return <PopularPostCard blog={blog} />;
    }

    if (variant === 'latest') {
        return <LatestPostCard blog={blog} />;
    }

    return <FeaturedPostCard blog={blog} />;
}

function FeaturedPostCard({ blog }) {
    return (
        <article className="group overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/blog/${blog.slug}`} className="block">
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                    />

                    <div className="absolute left-4 top-4">
                        <CategoryBadge category={blog.category} />
                    </div>
                </div>

                <div className="p-5">
                    <PostMeta blog={blog} />

                    <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {blog.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {blog.excerpt || 'Thông tin đang được cập nhật.'}
                    </p>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-300">
                        Đọc thêm
                        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                    </div>
                </div>
            </Link>
        </article>
    );
}

function LatestPostCard({ blog }) {
    return (
        <article className="group rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/blog/${blog.slug}`} className="flex gap-4">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>

                <div className="min-w-0 flex-1 py-1">
                    <CategoryText category={blog.category} />

                    <h3 className="mt-1 line-clamp-2 text-sm font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {blog.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {blog.excerpt || 'Thông tin đang được cập nhật.'}
                    </p>

                    <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(blog.publishedAt)}
                    </div>
                </div>
            </Link>
        </article>
    );
}

function PopularPostCard({ blog }) {
    return (
        <Link to={`/blog/${blog.slug}`} className="group flex gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                    {blog.title}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Eye size={13} />
                    {blog.viewCount} lượt xem
                </div>
            </div>
        </Link>
    );
}

function CategoryBadge({ category }) {
    return (
        <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
            {getCategoryLabel(category)}
        </span>
    );
}

function CategoryText({ category }) {
    return (
        <p className="text-[11px] font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">
            {getCategoryLabel(category)}
        </p>
    );
}

function PostMeta({ blog }) {
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {formatDate(blog.publishedAt)}
            </span>

            <span className="inline-flex items-center gap-1.5">
                <Eye size={14} />
                {blog.viewCount} lượt xem
            </span>
        </div>
    );
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
    if (normalized.includes('chien dich') || normalized.includes('campaign')) return 'Chiến dịch';

    return value;
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
