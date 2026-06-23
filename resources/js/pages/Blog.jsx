import { ChevronRight, Home, Loader2, RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import BlogHero from '../components/blog/BlogHero';
import BlogPagination from '../components/blog/BlogPagination';
import BlogPostCard from '../components/blog/BlogPostCard';
import BlogSidebar from '../components/blog/BlogSidebar';
import BlogToolbar from '../components/blog/BlogToolbar';
import MainLayout from '../layout/MainLayout';
import blogService from '../services/blogService';

const DEFAULT_CATEGORIES = ['Tin tức', 'Sự kiện', 'Chiến dịch'];

export default function Blog() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [blogs, setBlogs] = useState([]);
    const [featuredPost, setFeaturedPost] = useState(null);
    const [categories, setCategories] = useState([]);
    const [searchText, setSearchText] = useState(searchParams.get('keyword') || '');
    const [loading, setLoading] = useState(false);
    const [categoryLoading, setCategoryLoading] = useState(false);

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 9,
        total: 0,
    });

    const filters = useMemo(
        () => ({
            keyword: searchParams.get('keyword') || '',
            category: searchParams.get('category') || '',
            page: Number(searchParams.get('page') || 1),
            per_page: 9,
        }),
        [searchParams],
    );

    useEffect(() => {
        setSearchText(filters.keyword);
    }, [filters.keyword]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadBlogs();
    }, [filters.keyword, filters.category, filters.page]);

    async function loadBlogs() {
        try {
            setLoading(true);

            const result = await blogService.getBlogs({
                keyword: filters.keyword || undefined,
                category: filters.category || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setBlogs(result.blogs || []);
            setFeaturedPost(result.featuredPost || null);
            setMeta(result.meta);
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Không thể tải danh sách bài viết';

            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    async function loadCategories() {
        try {
            setCategoryLoading(true);

            const result = await blogService.getCategories();
            setCategories(result.length > 0 ? result : DEFAULT_CATEGORIES);
        } catch {
            setCategories(DEFAULT_CATEGORIES);
        } finally {
            setCategoryLoading(false);
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

    function clearSearch() {
        setSearchText('');

        updateFilter({
            keyword: '',
        });
    }

    function resetFilters() {
        setSearchText('');
        setSearchParams({});
    }

    const featuredPosts = useMemo(() => {
        const result = [];

        if (featuredPost) {
            result.push(featuredPost);
        }

        blogs.forEach((blog) => {
            const existed = result.some((item) => item.id === blog.id);

            if (!existed && (blog.isFeatured || result.length < 3)) {
                result.push(blog);
            }
        });

        return result.slice(0, 3);
    }, [blogs, featuredPost]);

    const latestPosts = useMemo(() => {
        const featuredIds = featuredPosts.map((item) => item.id);

        const posts = blogs.filter((blog) => !featuredIds.includes(blog.id));

        return posts.length > 0 ? posts : blogs;
    }, [blogs, featuredPosts]);

    const popularPosts = useMemo(() => {
        return [...blogs].sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0)).slice(0, 4);
    }, [blogs]);

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    <Breadcrumb />

                    <BlogHero backgroundImage={featuredPost?.thumbnail} />

                    <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="min-w-0 space-y-7">
                            <BlogToolbar
                                categories={categories}
                                activeCategory={filters.category}
                                keyword={searchText}
                                loading={categoryLoading}
                                onCategoryChange={(category) => updateFilter({ category })}
                                onKeywordChange={setSearchText}
                                onSearch={handleSearch}
                                onClearSearch={clearSearch}
                            />

                            {loading ? (
                                <BlogLoading />
                            ) : blogs.length === 0 ? (
                                <BlogEmpty
                                    keyword={filters.keyword}
                                    category={filters.category}
                                    onReset={resetFilters}
                                />
                            ) : (
                                <>
                                    <section>
                                        <SectionHeading
                                            title="Bài viết nổi bật"
                                            description="Các tin tức, sự kiện và chiến dịch đáng chú ý nhất."
                                        />

                                        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                            {featuredPosts.map((blog) => (
                                                <BlogPostCard key={blog.id} blog={blog} variant="featured" />
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <SectionHeading
                                            title="Bài viết mới nhất"
                                            description={`${meta.total || blogs.length} bài viết đang được hiển thị.`}
                                        />

                                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {latestPosts.map((blog) => (
                                                <BlogPostCard key={blog.id} blog={blog} variant="latest" />
                                            ))}
                                        </div>
                                    </section>

                                    {meta.lastPage > 1 && (
                                        <BlogPagination meta={meta} onPageChange={(page) => updateFilter({ page })} />
                                    )}
                                </>
                            )}
                        </div>

                        <BlogSidebar posts={popularPosts} />
                    </section>
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
                Trang chủ
            </Link>
            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Blog</span>
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
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={24} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-bold text-blue-950 dark:text-white">Đang tải bài viết...</p>
        </div>
    );
}

function BlogEmpty({ keyword, category, onReset }) {
    return (
        <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Search size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không tìm thấy bài viết phù hợp</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Không có kết quả cho bộ lọc hiện tại
                {keyword ? ` với từ khóa “${keyword}”` : ''}
                {category ? ` trong danh mục “${category}”` : ''}.
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Xóa bộ lọc
            </button>
        </section>
    );
}
