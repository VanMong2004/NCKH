import { ChevronLeft, ChevronRight, Home, Loader2, RefreshCcw, Search } from 'lucide-react';
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
    const [featuredPosts, setFeaturedPosts] = useState([]);
    const [featuredIndex, setFeaturedIndex] = useState(0);
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
            setFeaturedPosts(result.featuredPosts || []);
            setMeta(result.meta);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách tin tức');
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
        if (!featuredPosts.length) {
            return blogs;
        }

        const featuredIds = new Set(featuredPosts.map((item) => item.id));
        return blogs.filter((item) => !featuredIds.has(item.id));
    }, [blogs, featuredPosts]);

    useEffect(() => {
        setFeaturedIndex(0);
    }, [featuredPosts.length, filters.keyword, filters.page]);

    const activeFeaturedPost = featuredPosts[featuredIndex] || null;

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
                                    placeholder="Tìm kiếm tin tức theo tiêu đề..."
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-950 px-5 text-sm font-bold text-white hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
                            >
                                Tìm kiếm
                            </button>
                        </form>
                    </section>

                    {loading ? (
                        <BlogLoading />
                    ) : blogs.length === 0 ? (
                        <BlogEmpty keyword={filters.keyword} onReset={resetFilters} />
                    ) : (
                        <div className="mt-6 space-y-7">
                            {activeFeaturedPost ? (
                                <section>
                                    <SectionHeading
                                        title="Bài viết nổi bật"
                                        description="Bài viết được ưu tiên hiển thị trên khu vực tin tức."
                                    />

                                    <div className="mt-4">
                                        <FeaturedSlider
                                            posts={featuredPosts}
                                            activeIndex={featuredIndex}
                                            onSelect={setFeaturedIndex}
                                            onPrev={() =>
                                                setFeaturedIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length)
                                            }
                                            onNext={() => setFeaturedIndex((prev) => (prev + 1) % featuredPosts.length)}
                                        />
                                    </div>
                                </section>
                            ) : null}

                            <section>
                                <SectionHeading
                                    title="Danh sách tin tức"
                                    description={`${meta.total || blogs.length} bài viết đang được hiển thị.`}
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

function FeaturedSlider({ posts, activeIndex, onPrev, onNext, onSelect }) {
    const activePost = posts[activeIndex];

    if (!activePost) return null;

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.5rem]">
                <BlogPostCard blog={activePost} featured />
            </div>

            {posts.length > 1 ? (
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onPrev}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                        <ChevronLeft size={16} />
                        Trước
                    </button>

                    <div className="flex items-center gap-2">
                        {posts.map((post, index) => (
                            <button
                                key={post.id || post.slug}
                                type="button"
                                onClick={() => onSelect(index)}
                                className={[
                                    'h-2.5 w-2.5 rounded-full transition',
                                    index === activeIndex ? 'bg-blue-700' : 'bg-slate-300 dark:bg-slate-700',
                                ].join(' ')}
                                aria-label={`Chuyển đến bài nổi bật ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onNext}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                        Sau
                        <ChevronRight size={16} />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-2 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Tin tức</span>
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
            <p className="mt-4 text-sm font-bold text-blue-950 dark:text-white">Đang tải tin tức...</p>
        </div>
    );
}

function BlogEmpty({ keyword, onReset }) {
    return (
        <section className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Search size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không tìm thấy bài viết phù hợp</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {keyword ? `Không có kết quả với từ khóa "${keyword}".` : 'Hiện chưa có bài viết nào được xuất bản.'}
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Đặt lại
            </button>
        </section>
    );
}
