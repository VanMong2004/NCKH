import { ChevronRight, Home, Loader2, RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import BlogHero from '../components/blog/BlogHero';
import BlogPagination from '../components/blog/BlogPagination';
import BlogPostCard from '../components/blog/BlogPostCard';
import MainLayout from '../layout/MainLayout';
import blogService from '../services/blogService';

export default function Blog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [blogs, setBlogs] = useState([]);
    const [featuredPost, setFeaturedPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState(searchParams.get('keyword') || '');
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 9,
        total: 0,
    });

    const filters = useMemo(
        () => ({
            keyword: searchParams.get('keyword') || '',
            page: Number(searchParams.get('page') || 1),
            per_page: 9,
        }),
        [searchParams],
    );

    useEffect(() => {
        setSearchText(filters.keyword);
    }, [filters.keyword]);

    useEffect(() => {
        loadBlogs();
    }, [filters.keyword, filters.page]);

    async function loadBlogs() {
        try {
            setLoading(true);

            const result = await blogService.getBlogs({
                keyword: filters.keyword || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setBlogs(result.blogs || []);
            setFeaturedPost(result.featuredPost || null);
            setMeta(result.meta);
        } catch (error) {
            toast.error(error?.message || 'Khong the tai danh sach tin tuc');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(next) {
        const params = new URLSearchParams(searchParams);

        Object.entries(next).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });

        if (!Object.prototype.hasOwnProperty.call(next, 'page')) {
            params.set('page', '1');
        }

        setSearchParams(params);
    }

    function handleSearch(e) {
        e.preventDefault();

        updateFilter({
            keyword: searchText.trim(),
        });
    }

    function resetFilters() {
        setSearchText('');
        setSearchParams({});
    }

    const gridPosts = useMemo(() => {
        if (!featuredPost) {
            return blogs;
        }

        return blogs.filter((item) => item.id !== featuredPost.id);
    }, [blogs, featuredPost]);

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    <Breadcrumb />
                    <BlogHero />

                    <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Tim kiem tin tuc theo tieu de..."
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-950 px-5 text-sm font-bold text-white hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
                            >
                                Tim kiem
                            </button>
                        </form>
                    </section>

                    {loading ? (
                        <BlogLoading />
                    ) : blogs.length === 0 ? (
                        <BlogEmpty keyword={filters.keyword} onReset={resetFilters} />
                    ) : (
                        <div className="mt-6 space-y-7">
                            {featuredPost ? (
                                <section>
                                    <SectionHeading
                                        title="Bai viet noi bat"
                                        description="Bai viet duoc uu tien hien thi tren khu vuc tin tuc."
                                    />

                                    <div className="mt-4">
                                        <BlogPostCard blog={featuredPost} featured />
                                    </div>
                                </section>
                            ) : null}

                            <section>
                                <SectionHeading
                                    title="Danh sach tin tuc"
                                    description={`${meta.total || blogs.length} bai viet dang duoc hien thi.`}
                                />

                                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {gridPosts.map((blog) => (
                                        <BlogPostCard key={blog.id} blog={blog} />
                                    ))}
                                </div>
                            </section>

                            {meta.lastPage > 1 ? (
                                <BlogPagination meta={meta} onPageChange={(page) => updateFilter({ page })} />
                            ) : null}
                        </div>
                    )}
                </div>
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-2 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chu
            </Link>
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Tin tuc</span>
        </div>
    );
}

function SectionHeading({ title, description }) {
    return (
        <div>
            <h2 className="text-xl font-black text-blue-950 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

function BlogLoading() {
    return (
        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={24} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-bold text-blue-950 dark:text-white">Dang tai tin tuc...</p>
        </div>
    );
}

function BlogEmpty({ keyword, onReset }) {
    return (
        <section className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Search size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Khong tim thay bai viet phu hop</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {keyword ? `Khong co ket qua voi tu khoa "${keyword}".` : 'Hien chua co bai viet nao duoc xuat ban.'}
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Dat lai
            </button>
        </section>
    );
}
