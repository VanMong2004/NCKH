import { CalendarDays, ChevronRight, Eye, Home, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../../layout/MainLayout';
import RelatedPosts from '../components/blog/RelatedPosts';
import blogService from '../services/blogService';

export default function BlogDetail() {
    const { slug } = useParams();

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlog();
    }, [slug]);

    async function loadBlog() {
        try {
            setLoading(true);

            const data = await blogService.getBlogDetail(slug);
            setBlog(data);
        } catch (error) {
            toast.error(error.message || 'Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-4xl px-4 py-20 text-center font-bold text-blue-950 dark:text-white">
                    Đang tải bài viết...
                </div>
            </MainLayout>
        );
    }

    if (!blog) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-4xl px-4 py-20 text-center">
                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">Không tìm thấy bài viết</h1>

                    <Link
                        to="/blog"
                        className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
                    >
                        Quay lại Blog
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-5xl px-4 py-6">
                <Breadcrumb title={blog.title} />

                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="h-[260px] w-full object-cover md:h-[420px]"
                        onError={(e) => {
                            e.currentTarget.src = '/images/no-image.png';
                        }}
                    />

                    <div className="p-6 md:p-8">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {blog.category}
                        </span>

                        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-blue-950 dark:text-white md:text-4xl">
                            {blog.title}
                        </h1>

                        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-2">
                                <UserRound size={16} />
                                {blog.authorName}
                            </span>

                            <span className="flex items-center gap-2">
                                <CalendarDays size={16} />
                                {formatDate(blog.publishedAt)}
                            </span>

                            <span className="flex items-center gap-2">
                                <Eye size={16} />
                                {blog.viewCount} lượt xem
                            </span>
                        </div>

                        {blog.excerpt && (
                            <p className="mt-6 rounded-2xl bg-blue-50 p-5 text-base font-semibold leading-7 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                                {blog.excerpt}
                            </p>
                        )}

                        <div
                            className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-img:rounded-2xl prose-a:text-blue-700"
                            dangerouslySetInnerHTML={{
                                __html: blog.content || '<p>Nội dung đang được cập nhật.</p>',
                            }}
                        />
                    </div>
                </article>

                <RelatedPosts posts={blog.relatedPosts} />
            </main>
        </MainLayout>
    );
}

function Breadcrumb({ title }) {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <Link to="/blog" className="hover:text-blue-950 dark:hover:text-blue-300">
                Bài viết
            </Link>

            <ChevronRight size={14} />

            <span className="line-clamp-1 text-blue-950 dark:text-blue-300">{title}</span>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
}
