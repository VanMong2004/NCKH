import { ChevronRight, Home, Loader2, RefreshCcw } from 'lucide-react';
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadBlogDetail();
    }, [slug]);

    async function loadBlogDetail() {
        if (!slug) {
            setError('Duong dan bai viet khong hop le.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await blogService.getBlogDetail(slug);
            setBlog(result);
        } catch (err) {
            const message = err?.message || 'Khong the tai chi tiet bai viet';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6 lg:px-8">
                    <Breadcrumb blogTitle={blog?.title} />

                    {loading ? (
                        <BlogDetailLoading />
                    ) : error ? (
                        <BlogDetailError message={error} onRetry={loadBlogDetail} onBack={() => navigate('/blog')} />
                    ) : blog ? (
                        <div className="space-y-6">
                            <BlogDetailHero blog={blog} onBack={() => navigate('/blog')} />

                            <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="h-[260px] bg-slate-100 dark:bg-slate-800 sm:h-[380px]">
                                    <img src={blog.thumbnail} alt={blog.title} className="h-full w-full object-cover" />
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div
                                        className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-blue-950 prose-a:text-blue-700 prose-img:rounded-2xl dark:prose-invert dark:prose-headings:text-white dark:prose-a:text-blue-300"
                                        dangerouslySetInnerHTML={{
                                            __html: blog.content || `<p>${blog.summary || 'Noi dung dang duoc cap nhat.'}</p>`,
                                        }}
                                    />
                                </div>
                            </article>

                            <BlogRelatedPosts posts={blog.latestPosts || []} title="Bai viet moi nhat" />
                        </div>
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
                Trang chu
            </Link>
            <ChevronRight size={14} />
            <Link to="/blog" className="hover:text-blue-950 dark:hover:text-blue-300">
                Tin tuc
            </Link>
            <ChevronRight size={14} />
            <span className="line-clamp-1 max-w-[360px] text-blue-950 dark:text-blue-300">
                {blogTitle || 'Chi tiet bai viet'}
            </span>
        </div>
    );
}

function BlogDetailLoading() {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={26} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-bold text-blue-950 dark:text-white">Dang tai chi tiet bai viet...</p>
        </div>
    );
}

function BlogDetailError({ message, onRetry, onBack }) {
    return (
        <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <RefreshCcw size={24} />
            </div>

            <h1 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Khong the tai bai viet</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {message || 'Bai viet khong ton tai hoac da bi an.'}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                    Ve danh sach tin tuc
                </button>

                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-950 px-5 text-sm font-bold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    Thu lai
                </button>
            </div>
        </section>
    );
}
