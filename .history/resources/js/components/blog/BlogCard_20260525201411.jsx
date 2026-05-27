import { CalendarDays, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogCard({ blog }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/blog/${blog.slug}`} className="block h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
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
                    <h3 className="mt-3 line-clamp-2 text-lg font-extrabold text-blue-950 hover:text-blue-700 dark:text-white">
                        {blog.title}
                    </h3>
                </Link>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{blog.excerpt}</p>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(blog.publishedAt)}
                    </span>

                    <span className="flex items-center gap-1.5">
                        <Eye size={14} />
                        {blog.viewCount}
                    </span>
                </div>
            </div>
        </article>import api from './api';

import {
    mapBlogDetailResponse,
    mapBlogListResponse,
} from './mappers/blogMapper';

const blogService = {
    async getBlogs(params = {}) {
        const res = await api.get('/blogs', { params });
        return mapBlogListResponse(res.data);
    },

    async getBlogDetail(slug) {
        const res = await api.get(`/blogs/${slug}`);
        return mapBlogDetailResponse(res.data);
    },
};

export default blogService;
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
