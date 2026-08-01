import { ChevronLeft, ChevronRight, Home, Loader2, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import PromotionFilters from '../components/promotion/PromotionFilters';
import PromotionGrid from '../components/promotion/PromotionGrid';
import MainLayout from '../layout/MainLayout';
import promotionService from '../services/promotionService';

export default function Promotions() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 8,
        total: 0,
    });

    const filters = useMemo(
        () => ({
            status: searchParams.get('status') || '',
            sort: searchParams.get('sort') || 'latest',
            keyword: searchParams.get('keyword') || '',
            page: Number(searchParams.get('page') || 1),
            per_page: Number(searchParams.get('per_page') || 8),
        }),
        [searchParams],
    );

    useEffect(() => {
        loadPromotions();
    }, [searchParams]);

    async function loadPromotions() {
        try {
            setLoading(true);

            const result = await promotionService.getPromotions({
                status: filters.status || undefined,
                sort: filters.sort || undefined,
                keyword: filters.keyword || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setPromotions(result.promotions || []);
            setMeta(result.meta);
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách khuyến mãi');
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

        if (!Object.prototype.hasOwnProperty.call(next, 'page')) {
            params.set('page', '1');
        }

        setSearchParams(params);
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 py-2 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-4">
                    <Breadcrumb />

                    <PromotionFilters filters={filters} onChange={updateFilter} />

                    {loading ? (
                        <LoadingBlock />
                    ) : promotions.length > 0 ? (
                        <PromotionGrid promotions={promotions} />
                    ) : (
                        <EmptyPromotion onReset={() => setSearchParams({})} />
                    )}

                    {!loading && promotions.length > 0 && (
                        <div className="mx-2 mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-semibold text-blue-950 dark:text-white">
                                Hiển thị {promotions.length} / {meta.total} đợt khuyến mãi
                            </p>

                            <Pagination meta={meta} onPageChange={(page) => updateFilter({ page })} />
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
                Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Khuyến mãi</span>
        </div>
    );
}

function LoadingBlock() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <Loader2 className="mx-auto mb-3 animate-spin" size={28} />
            Đang tải đợt khuyến mãi...
        </div>
    );
}

function EmptyPromotion({ onReset }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-extrabold text-blue-950 dark:text-white">Chưa có đợt khuyến mãi phù hợp</h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Hãy thử đổi bộ lọc hoặc quay lại sau.</p>

            <button
                type="button"
                onClick={onReset}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
            >
                <RefreshCcw size={16} />
                Xóa bộ lọc
            </button>
        </div>
    );
}

function Pagination({ meta, onPageChange }) {
    if (meta.lastPage <= 1) return null;

    const pages = Array.from({ length: meta.lastPage }, (_, index) => index + 1).slice(0, 5);

    return (
        <div className="hidden items-center gap-2 md:flex">
            <PageButton disabled={meta.currentPage <= 1} onClick={() => onPageChange(meta.currentPage - 1)}>
                <ChevronLeft size={16} />
            </PageButton>

            {pages.map((page) => (
                <PageButton key={page} active={page === meta.currentPage} onClick={() => onPageChange(page)}>
                    {page}
                </PageButton>
            ))}

            <PageButton disabled={meta.currentPage >= meta.lastPage} onClick={() => onPageChange(meta.currentPage + 1)}>
                <ChevronRight size={16} />
            </PageButton>
        </div>
    );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                'flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold disabled:opacity-50',
                active
                    ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                    : 'border-slate-200 bg-white text-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
            ].join(' ')}
        >
            {children}
        </button>
    );
}
