import {
    ChevronRight,
    HelpCircle,
    Home,
    Loader2,
    MessageCircleQuestion,
    RefreshCcw,
    Search,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import FaqAccordion from '../components/faq/FaqAccordion';
import FaqHelpCard from '../components/faq/FaqHelpCard';
import FaqToolbar from '../components/faq/FaqToolbar';
import MainLayout from '../layout/MainLayout';
import faqService from '../services/faqService';

const DEFAULT_CATEGORIES = ['Chung', 'Đơn hàng', 'Thanh toán', 'Khuyến mãi', 'Tài khoản'];

export default function Faq() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [faqs, setFaqs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [expandedId, setExpandedId] = useState(null);

    const [loadingFaqs, setLoadingFaqs] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [error, setError] = useState('');

    const filters = useMemo(
        () => ({
            keyword: searchParams.get('keyword') || '',
            category: searchParams.get('category') || '',
        }),
        [searchParams],
    );

    useEffect(() => {
        setKeyword(filters.keyword);
    }, [filters.keyword]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadFaqs();
    }, [filters.keyword, filters.category]);

    async function loadFaqs() {
        try {
            setLoadingFaqs(true);
            setError('');

            const result = await faqService.getFaqs({
                keyword: filters.keyword || undefined,
                category: filters.category || undefined,
            });

            const list = result.faqs || [];

            setFaqs(list);
            setExpandedId(list[0]?.id || null);
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Không thể tải danh sách câu hỏi thường gặp';

            setError(message);
            toast.error(message);
        } finally {
            setLoadingFaqs(false);
        }
    }

    async function loadCategories() {
        try {
            setLoadingCategories(true);

            const result = await faqService.getCategories();
            setCategories(result.length > 0 ? result : DEFAULT_CATEGORIES);
        } catch {
            setCategories(DEFAULT_CATEGORIES);
        } finally {
            setLoadingCategories(false);
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

        setSearchParams(params);
    }

    function handleSearch(e) {
        e.preventDefault();

        updateFilter({
            keyword: keyword.trim(),
        });
    }

    function clearSearch() {
        setKeyword('');

        updateFilter({
            keyword: '',
        });
    }

    function resetFilters() {
        setKeyword('');
        setSearchParams({});
    }

    const activeCategoryLabel = filters.category || 'Tất cả danh mục';

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    <Breadcrumb />

                    <FaqHero />

                    <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
                        <div className="min-w-0 space-y-6">
                            <FaqToolbar
                                categories={categories}
                                activeCategory={filters.category}
                                keyword={keyword}
                                loading={loadingCategories}
                                onCategoryChange={(category) => updateFilter({ category })}
                                onKeywordChange={setKeyword}
                                onSearch={handleSearch}
                                onClearSearch={clearSearch}
                            />

                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                            <MessageCircleQuestion size={13} />
                                            {activeCategoryLabel}
                                        </div>

                                        <h2 className="mt-3 text-2xl font-black text-blue-950 dark:text-white">
                                            Câu hỏi thường gặp
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                            Tìm nhanh câu trả lời cho các vấn đề phổ biến khi sử dụng hệ thống.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-blue-950 dark:bg-slate-950 dark:text-white">
                                        {faqs.length} câu hỏi
                                    </div>
                                </div>

                                <div className="mt-5">
                                    {loadingFaqs ? (
                                        <FaqLoading />
                                    ) : error ? (
                                        <FaqError message={error} onRetry={loadFaqs} />
                                    ) : faqs.length === 0 ? (
                                        <FaqEmpty
                                            keyword={filters.keyword}
                                            category={filters.category}
                                            onReset={resetFilters}
                                        />
                                    ) : (
                                        <FaqAccordion
                                            faqs={faqs}
                                            expandedId={expandedId}
                                            onToggle={(id) => {
                                                setExpandedId((current) => (current === id ? null : id));
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-6">
                            <FaqSummaryCard total={faqs.length} category={filters.category} />

                            <FaqHelpCard />
                        </aside>
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

            <span className="text-blue-950 dark:text-blue-300">FAQ</span>
        </div>
    );
}

function FaqHero() {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:p-10">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute -bottom-12 left-10 h-40 w-40 rounded-full bg-sky-100 blur-3xl dark:bg-sky-500/10" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-center">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <Sparkles size={14} />
                        Trung tâm hỗ trợ
                    </div>

                    <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-blue-950 dark:text-white md:text-5xl">
                        Câu hỏi thường gặp
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                        Tra cứu nhanh các câu hỏi liên quan đến tài khoản, đơn hàng, thanh toán, khuyến mãi và chính
                        sách hỗ trợ.
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                        <HelpCircle size={24} />
                    </div>

                    <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">
                        Không tìm thấy câu trả lời?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Gửi yêu cầu hỗ trợ để được phản hồi chi tiết hơn.
                    </p>

                    <Link
                        to="/contact"
                        className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        Liên hệ hỗ trợ
                    </Link>
                </div>
            </div>
        </section>
    );
}

function FaqSummaryCard({ total, category }) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-blue-950 dark:text-white">Thống kê FAQ</h2>

            <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{total}</p>

                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Câu hỏi đang hiển thị
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-sm font-black text-blue-950 dark:text-white">Danh mục hiện tại</p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{category || 'Tất cả danh mục'}</p>
                </div>
            </div>
        </section>
    );
}

function FaqLoading() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                    <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
            ))}
        </div>
    );
}

function FaqError({ message, onRetry }) {
    return (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <RefreshCcw size={22} />
            </div>

            <h3 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Không thể tải FAQ</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Thử lại
            </button>
        </section>
    );
}

function FaqEmpty({ keyword, category, onReset }) {
    return (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Search size={22} />
            </div>

            <h3 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Không tìm thấy câu hỏi phù hợp</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Không có FAQ phù hợp
                {keyword ? ` với từ khóa “${keyword}”` : ''}
                {category ? ` trong danh mục “${category}”` : ''}.
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Xóa bộ lọc
            </button>
        </section>
    );
}
