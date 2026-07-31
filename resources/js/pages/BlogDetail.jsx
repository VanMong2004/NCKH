import { ArrowLeft, CalendarDays, ChevronRight, Home, Loader2, RefreshCcw, Share2, Tag, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import BlogDetailHero from '../components/blogDetail/BlogDetailHero';
import BlogRelatedPosts from '../components/blogDetail/BlogRelatedPosts';
import MainLayout from '../layout/MainLayout';
import blogService from '../services/blogService';

export default function BlogDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });

        loadBlogDetail();
    }, [slug]);

    async function loadBlogDetail() {
        if (!slug) {
            setError('Đường dẫn bài viết không hợp lệ.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await blogService.getBlogDetail(slug);
            setBlog(result);
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Không thể tải chi tiết bài viết';

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleShare() {
        const shareUrl = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: blog?.title || 'Bài viết',
                    text: blog?.excerpt || '',
                    url: shareUrl,
                });

                return;
            }

            await navigator.clipboard.writeText(shareUrl);
            toast.success('Đã sao chép liên kết bài viết');
        } catch {
            toast.info('Không thể chia sẻ bài viết lúc này');
        }
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    <Breadcrumb blogTitle={blog?.title} />

                    {loading ? (
                        <BlogDetailLoading />
                    ) : error ? (
                        <BlogDetailError message={error} onRetry={loadBlogDetail} onBack={() => navigate('/blog')} />
                    ) : blog ? (
                        <>
                            <BlogDetailHero blog={blog} onBack={() => navigate('/blog')} onShare={handleShare} />

                            <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
                                <article className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-9">
                                    <ArticleContent blog={blog} />

                                    <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
                                        <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-black text-blue-950 dark:text-white">Bạn muốn xem thêm tin tức?</p>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    Quay lại danh sách để theo dõi các bài viết mới nhất.
                                                </p>
                                            </div>

                                            <Link
                                                to="/blog"
                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                                            >
                                                <ArrowLeft size={16} />
                                                Quay lại Blog
                                            </Link>
                                        </div>
                                    </div>
                                </article>

                                <aside className="space-y-6">
                                    <ArticleInfoCard blog={blog} onShare={handleShare} />
                                    <BlogRelatedPosts posts={blog.relatedPosts || []} title="Bài viết liên quan" compact />
                                </aside>
                            </section>

                            <div className="mt-7 lg:hidden">
                                <BlogRelatedPosts posts={blog.relatedPosts || []} title="Có thể bạn quan tâm" />
                            </div>
                        </>
                    ) : null}
                </div>
            </main>
        </MainLayout>
    );
}

function Breadcrumb({ blogTitle }) {
    return (
        <div className="mb-2 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link to="/blog" className="transition hover:text-blue-950 dark:hover:text-blue-300">
                Blog
            </Link>
            <ChevronRight size={14} />
            <span className="line-clamp-1 max-w-[360px] text-blue-950 dark:text-blue-300">
                {blogTitle || 'Chi tiết bài viết'}
            </span>
        </div>
    );
}

function ArticleContent({ blog }) {
    if (!blog.content) {
        return (
            <div>
                <h2 className="text-2xl font-black text-blue-950 dark:text-white">{blog.title}</h2>
                <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                    {blog.excerpt || 'Nội dung bài viết đang được cập nhật.'}
                </p>
            </div>
        );
    }

    return (
        <div
            className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-blue-950 prose-a:font-bold prose-a:text-blue-700 prose-img:rounded-2xl prose-img:shadow-sm dark:prose-invert dark:prose-headings:text-white dark:prose-a:text-blue-300"
            dangerouslySetInnerHTML={{ __html: blog.content }}
        />
    );
}

function ArticleInfoCard({ blog, onShare }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-blue-950 dark:text-white">Thông tin bài viết</h2>

            <div className="mt-5 space-y-4">
                <InfoRow icon={UserRound} label="Tác giả" value={blog.authorName || 'CTUT'} />
                <InfoRow icon={Tag} label="Danh mục" value={getCategoryLabel(blog.category)} />
                <InfoRow icon={CalendarDays} label="Ngày đăng" value={formatDate(blog.publishedAt)} />
            </div>

            <button
                type="button"
                onClick={onShare}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
            >
                <Share2 size={16} />
                Chia sẻ bài viết
            </button>
        </section>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={17} />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-black text-blue-950 dark:text-white">{value || 'Đang cập nhật'}</p>
            </div>
        </div>
    );
}

function BlogDetailLoading() {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={26} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải chi tiết bài viết...</p>
        </div>
    );
}

function BlogDetailError({ message, onRetry, onBack }) {
    return (
        <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <RefreshCcw size={24} />
            </div>

            <h1 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không thể tải bài viết</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {message || 'Bài viết không tồn tại hoặc đã bị gỡ khỏi hệ thống.'}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                    <ArrowLeft size={16} />
                    Về danh sách Blog
                </button>

                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    <RefreshCcw size={16} />
                    Thử lại
                </button>
            </div>
        </section>
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
