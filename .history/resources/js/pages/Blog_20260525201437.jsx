import { ChevronLeft, ChevronRight, Home, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';
import BlogCard from '../components/blog/BlogCard';
import blogService from '../services/blogService';

export default function Blog() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    const filters = {
        keyword: searchParams.get('keyword') || '',
        category: searchParams.get('category') || '',
        page: Number(searchParams.get('page') || 1),
        per_page: 9,
    };

    useEffect(() => {
        loadBlogs();
    }, [searchParams]);

    async function loadBlogs() {
        try {
            setLoading(true);

            const result = await blogService.getBlogs({
                keyword: filters.keyword || undefined,
                category: filters.category || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setBlogs(result.blogs);
            setMeta(result.meta);
        } catch (error) {
            toast.error(error.message || 'Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(next) {
        const params = new URLSearchParams(searchParams);

        Object.entries(next).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        if (!next.page) {
            params.set('page', '1');
        }

        setSearchParams(params);
    }

    function handleSearch(e) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        updateFilter({
            keyword: formData.get('keyword') || '',
        });
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <section className="mb-8 overflow-hidden rounded-3xl bg-blue-950 p-8 text-white">
                    <p className="text-sm font-bold uppercase text-blue-200">Tin tức & sự kiện</p>

                    <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Cập nhật thông tin mới nhất</h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                        Theo dõi tin tức, sự kiện, chiến dịch và các thông báo quan trọng.
                    </p>
                </section>

                <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <form
                        onSubmit={handleSearch}
                        className="flex h-12 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:w-[420px]"
                    >
                        <input
                            name="keyword"
                            defaultValue={filters.keyword}
                            placeholder="Tìm bài viết..."
                            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white"
                        />

                        <button type="submit" className="flex w-12 items-center justify-center bg-blue-950 text-white">
                            <Search size={18} />
                        </button>
                    </form>

                    <select
                        value={filters.category}
                        onChange={(e) =>
                            updateFilter({
                                category: e.target.value,
                            })
                        }
                        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-blue-950 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">Tất cả danh mục</option>
                        <option value="tin-tuc">Tin tức</option>
                        <option value="su-kien">Sự kiện</option>
                        <option value="chien-dich">Chiến dịch</option>
                    </select>
                </section>

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-bold text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                        Đang tải bài viết...
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-700 dark:bg-slate-900">
                        <h2 className="text-xl font-extrabold text-blue-950 dark:text-white">
                            Không tìm thấy bài viết
                        </h2>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Hãy thử thay đổi từ khóa hoặc danh mục.
                        </p>
                    </div>
                ) : (
                    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {blogs.map((blog) => (
                            <BlogCard key={blog.id} blog={blog} />
                        ))}
                    </section>
                )}

                {!loading && meta.lastPage > 1 && (
                    <Pagination meta={meta} onPageChange={(page) => updateFilter({ page })} />
                )}
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Bài viết</span>
        </div>
    );
}

function Pagination({ meta, onPageChange }) {
    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            <PageButton disabled={meta.currentPage <= 1} onClick={() => onPageChange(meta.currentPage - 1)}>
                <ChevronLeft size={16} />
            </PageButton>

            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                {meta.currentPage} / {meta.lastPage}
            </span>

            <PageButton disabled={meta.currentPage >= meta.lastPage} onClick={() => onPageChange(meta.currentPage + 1)}>
                <ChevronRight size={16} />
            </PageButton>
        </div>
    );
}

function PageButton({ children, disabled, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-950 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
            {children}
        </button>
    );
}
