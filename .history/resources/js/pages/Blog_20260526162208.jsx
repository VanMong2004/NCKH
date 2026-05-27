import {
    ArrowRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Eye,
    Home,
    Loader2,
    Megaphone,
    Newspaper,
    RefreshCcw,
    Search,
    Send,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';
import blogService from '../services/blogService';

const DEFAULT_CATEGORIES = ['Sự kiện', 'Tin tức', 'Chiến dịch'];
const HERO_IMAGE = '/images/system/Rectangle_3897.jpg';

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
        total: 0,
        perPage: 9,
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
            const message = error?.response?.data?.message || error.message || 'Không thể tải bài viết';
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

    const tabs = useMemo(() => {
        const source = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

        return [
            {
                value: '',
                label: 'Tất cả',
                icon: Sparkles,
            },
            ...source.map((item) => ({
                value: item,
                label: getCategoryLabel(item),
                icon: getCategoryIcon(item),
            })),
        ];
    }, [categories]);

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

        return blogs.filter((blog) => !featuredIds.includes(blog.id)).slice(0, 6);
    }, [blogs, featuredPosts]);

    const popularPosts = useMemo(() => {
        const source = blogs.length > 0 ? blogs : featuredPosts;

        return [...source].sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0)).slice(0, 4);
    }, [blogs, featuredPosts]);

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <Breadcrumb />

                    <Hero />

                    <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="min-w-0 space-y-7">
                            <FilterBar
                                tabs={tabs}
                                activeCategory={filters.category}
                                keyword={searchText}
                                categoryLoading={categoryLoading}
                                onTabChange={(category) => updateFilter({ category })}
                                onKeywordChange={setSearchText}
                                onSubmit={handleSearch}
                                onClearSearch={clearSearch}
                            />

                            {loading ? (
                                <BlogSkeleton />
                            ) : blogs.length === 0 ? (
                                <EmptyState
                                    keyword={filters.keyword}
                                    category={filters.category}
                                    onReset={() => {
                                        setSearchText('');
                                        setSearchParams({});
                                    }}
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
                                                <FeaturedCard key={blog.id} blog={blog} />
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <SectionHeading
                                            title="Bài viết mới nhất"
                                            description={`${meta.total || blogs.length} bài viết đang được hiển thị theo bộ lọc hiện tại.`}
                                        />

                                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {(latestPosts.length > 0 ? latestPosts : blogs).map((blog) => (
                                                <LatestCard key={blog.id} blog={blog} />
                                            ))}
                                        </div>
                                    </section>

                                    {meta.lastPage > 1 && (
                                        <Pagination meta={meta} onPageChange={(page) => updateFilter({ page })} />
                                    )}
                                </>
                            )}
                        </div>

                        <aside className="hidden space-y-6 lg:block">
                            <PopularPosts posts={popularPosts} />

                            <NewsletterBox />
                        </aside>
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <nav className="mb-5 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <Link to="/" className="transition hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Blog</span>
        </nav>
    );
}

function Hero() {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{
                    backgroundImage: `url(${HERO_IMAGE})`,
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/30 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/35" />

            <div className="absolute -left-10 bottom-8 h-40 w-40 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute right-12 top-8 h-24 w-24 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-500/10" />

            <div className="relative min-h-[250px] px-6 py-10 sm:px-10 md:min-h-[290px] md:py-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm backdrop-blur dark:border-blue-500/20 dark:bg-slate-900/70 dark:text-blue-300">
                    <Sparkles size={14} />
                    Tin tức - Sự kiện - Chiến dịch
                </div>

                <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight text-blue-950 dark:text-white md:text-5xl">
                    Tin tức, sự kiện & chiến dịch
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                    Cập nhật những thông tin mới nhất về hoạt động, chương trình, chiến dịch và các bài viết nổi bật của
                    nhà trường.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                    <HeroStat value="24/7" label="Cập nhật" />
                    <HeroStat value="3+" label="Nhóm tin" />
                    <HeroStat value="Mới" label="Bài nổi bật" />
                </div>
            </div>
        </section>
    );
}

function HeroStat({ value, label }) {
    return (
        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-lg font-black text-blue-950 dark:text-white">{value}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

function FilterBar({
    tabs,
    activeCategory,
    keyword,
    categoryLoading,
    onTabChange,
    onKeywordChange,
    onSubmit,
    onClearSearch,
}) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
                    {categoryLoading ? (
                        <div className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <Loader2 size={16} className="animate-spin" />
                            Đang tải
                        </div>
                    ) : (
                        tabs.map((tab) => (
                            <CategoryTab
                                key={tab.value || 'all'}
                                tab={tab}
                                active={activeCategory === tab.value}
                                onClick={() => onTabChange(tab.value)}
                            />
                        ))
                    )}
                </div>

                <form onSubmit={onSubmit} className="relative min-w-0 xl:w-[340px]">
                    <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        placeholder="Tìm kiếm bài viết..."
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/10"
                    />

                    {keyword ? (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <X size={15} />
                        </button>
                    ) : null}

                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        <ArrowRight size={16} />
                    </button>
                </form>
            </div>
        </section>
    );
}

function CategoryTab({ tab, active, onClick }) {
    const Icon = tab.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-5 text-sm font-bold transition',
                active
                    ? 'border-blue-950 bg-blue-950 text-white shadow-md shadow-blue-950/20 dark:border-blue-500 dark:bg-blue-600'
                    : 'border-slate-200 bg-white text-blue-950 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-blue-500/40 dark:hover:bg-slate-800',
            ].join(' ')}
        >
            <Icon size={16} />
            {tab.label}
        </button>
    );
}

function SectionHeading({ title, description }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <h2 className="text-xl font-black text-blue-950 dark:text-white">{title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    );
}

function FeaturedCard({ blog }) {
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

function LatestCard({ blog }) {
    return (
        <article className="group rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/blog/${blog.slug}`} className="flex gap-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
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

function PopularPosts({ posts }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-blue-950 dark:text-white">Bài viết phổ biến</h2>

            <div className="mt-5 space-y-4">
                {posts.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có bài viết phổ biến.</p>
                ) : (
                    posts.map((post) => (
                        <Link key={post.id} to={`/blog/${post.slug}`} className="group flex gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={post.thumbnail}
                                    alt={post.title}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="line-clamp-2 text-sm font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                                    {post.title}
                                </h3>

                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Eye size={13} />
                                    {post.viewCount} lượt xem
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}

function NewsletterBox() {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Send size={20} />
            </div>

            <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Đăng ký nhận tin</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Theo dõi các bài viết, sự kiện và chiến dịch mới nhất.
            </p>

            <div className="mt-4 space-y-3">
                <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/10"
                />

                <button
                    type="button"
                    onClick={() => toast.info('Chức năng đăng ký nhận tin sẽ được kết nối sau.')}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
                >
                    <Send size={16} />
                    Đăng ký
                </button>
            </div>
        </section>
    );
}

function Pagination({ meta, onPageChange }) {
    const currentPage = Number(meta.currentPage || 1);
    const lastPage = Number(meta.lastPage || 1);

    return (
        <div className="flex flex-col items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Trang <span className="font-black text-blue-950 dark:text-white">{currentPage}</span> / {lastPage}
            </p>

            <div className="flex items-center gap-2">
                <PageButton disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
                    <ChevronLeft size={16} />
                    Trước
                </PageButton>

                <PageButton disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)}>
                    Sau
                    <ChevronRight size={16} />
                </PageButton>
            </div>
        </div>
    );
}

function PageButton({ children, disabled, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-950 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}

function EmptyState({ keyword, category, onReset }) {
    return (
        <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Search size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không tìm thấy bài viết phù hợp</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Không có kết quả cho bộ lọc hiện tại
                {keyword ? ` với từ khóa “${keyword}”` : ''}
                {category ? ` trong danh mục “${getCategoryLabel(category)}”` : ''}.
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

function BlogSkeleton() {
    return (
        <div className="space-y-7">
            <div>
                <div className="h-6 w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="h-48 animate-pulse bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-3 p-5">
                                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="h-5 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="h-28 w-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 space-y-3 py-1">
                            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
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

function getCategoryIcon(category) {
    const value = normalizeCategory(category);

    if (value.includes('su kien') || value.includes('event')) return CalendarDays;
    if (value.includes('chien dich') || value.includes('campaign')) return Megaphone;

    return Newspaper;
}

function getCategoryLabel(category) {
    const value = String(category || '').trim();

    if (!value) return 'Tin tức';

    const normalized = normalizeCategory(value);

    if (normalized.includes('tin tuc') || normalized.includes('news')) return 'Tin tức';
    if (normalized.includes('su kien') || normalized.includes('event')) return 'Sự kiện';
    if (normalized.includes('chien dich') || normalized.includes('campaign')) return 'Chiến dịch';

    return value
        .replaceAll('-', ' ')
        .replaceAll('_', ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeCategory(category) {
    return String(category || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ')
        .trim();
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
