import { ListFilter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProductGrid from '../components/product/ProductGrid';
import MobileFilterModal from '../components/shop/MobileFilterModal';
import ProductPagination from '../components/shop/ProductPagination';
import ProductSidebar from '../components/shop/ProductSidebar';
import MainLayout from '../layout/MainLayout';
import productService from '../services/productService';

const PRODUCT_PER_PAGE = 12;

const defaultFilters = {
    keyword: '',
    category_id: '',
    min_price: '',
    max_price: '',
    sizes: '',
    colors: '',
    rating: '',
    in_stock: '',
    sort: 'newest',
    page: 1,
};

const defaultMeta = {
    currentPage: 1,
    lastPage: 1,
    perPage: PRODUCT_PER_PAGE,
    total: 0,
};

const defaultFilterOptions = {
    categories: [],
    sizes: [],
    colors: [],
    priceRange: {
        min: 0,
        max: 0,
    },
};

export default function Shop() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialFilters = parseFiltersFromUrl(location.search);

    const [openFilter, setOpenFilter] = useState(false);
    const [filters, setFilters] = useState(initialFilters);
    const [draftFilters, setDraftFilters] = useState(initialFilters);
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(defaultMeta);
    const [filterOptions, setFilterOptions] = useState(defaultFilterOptions);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const requestIdRef = useRef(0);

    const hasActiveFilter = useMemo(() => {
        return Boolean(
            filters.keyword ||
                filters.category_id ||
                filters.min_price ||
                filters.max_price ||
                filters.sizes ||
                filters.colors ||
                filters.rating ||
                filters.in_stock,
        );
    }, [filters]);

    useEffect(() => {
        const nextFilters = parseFiltersFromUrl(location.search);

        setFilters((current) => (isSameFilter(current, nextFilters) ? current : nextFilters));
        setDraftFilters((current) => (isSameFilter(current, nextFilters) ? current : nextFilters));
    }, [location.search]);

    useEffect(() => {
        loadProducts(filters);
    }, [filters]);

    async function loadProducts(currentFilters) {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        try {
            setLoading(true);
            setError('');

            const params = cleanParams({
                ...currentFilters,
                per_page: PRODUCT_PER_PAGE,
            });

            const result = await productService.getProducts(params);

            if (requestId !== requestIdRef.current) {
                return;
            }

            setProducts(result.products || []);
            setMeta(result.meta || defaultMeta);
            setFilterOptions(result.filters || defaultFilterOptions);
        } catch (err) {
            if (requestId !== requestIdRef.current || err.canceled) {
                return;
            }

            console.error(err);
            setProducts([]);
            setError(err.message || 'Không thể tải danh sách sản phẩm.');
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }

    function handleDraftChange(name, value) {
        setDraftFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1,
        }));
    }

    function handleApplyFilters() {
        updateUrl({
            ...draftFilters,
            page: 1,
        });

        setOpenFilter(false);
    }

    function handlePageChange(page) {
        const nextFilters = {
            ...filters,
            page,
        };

        updateUrl(nextFilters);

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    function handleReset() {
        setDraftFilters(defaultFilters);
        updateUrl(defaultFilters);
        setOpenFilter(false);
    }

    function updateUrl(nextFilters) {
        const params = new URLSearchParams();

        Object.entries(cleanParams(nextFilters)).forEach(([key, value]) => {
            params.set(key, value);
        });

        const query = params.toString();

        navigate(query ? `/shop?${query}` : '/shop');
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
                <section className="grid gap-5 md:grid-cols-[260px_1fr] lg:gap-6">
                    <div className="hidden md:block">
                        <ProductSidebar
                            filters={draftFilters}
                            filterOptions={filterOptions}
                            onChange={handleDraftChange}
                            onApply={handleApplyFilters}
                            onReset={handleReset}
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:hidden">
                            <button
                                type="button"
                                onClick={() => setOpenFilter(true)}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                <ListFilter size={17} />
                                Tìm kiếm và lọc sản phẩm
                            </button>
                        </div>

                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <p className="font-semibold text-slate-500 dark:text-slate-400">
                                Tìm thấy <span className="text-blue-950 dark:text-blue-300">{meta.total}</span> sản phẩm
                            </p>

                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="font-bold text-red-500 hover:text-red-600"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>

                        {loading && <ProductSkeleton />}

                        {!loading && error && (
                            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
                                <p className="font-bold text-red-600 dark:text-red-400">{error}</p>

                                <button
                                    type="button"
                                    onClick={() => loadProducts(filters)}
                                    className="mt-4 rounded-xl bg-blue-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    Tải lại
                                </button>
                            </div>
                        )}

                        {!loading && !error && products.length > 0 && (
                            <>
                                <ProductGrid products={products} />
                                <ProductPagination meta={meta} onPageChange={handlePageChange} />
                            </>
                        )}

                        {!loading && !error && products.length === 0 && (
                            <EmptyState hasActiveFilter={hasActiveFilter} onReset={handleReset} />
                        )}
                    </div>
                </section>
            </main>

            <MobileFilterModal
                open={openFilter}
                onClose={() => setOpenFilter(false)}
                filters={draftFilters}
                filterOptions={filterOptions}
                onChange={handleDraftChange}
                onApply={handleApplyFilters}
                onReset={handleReset}
            />
        </MainLayout>
    );
}

function ProductSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="aspect-square animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ hasActiveFilter, onReset }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-bold text-blue-950 dark:text-white">Không tìm thấy sản phẩm phù hợp</p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Hãy thử thay đổi từ khóa, danh mục hoặc khoảng giá.
            </p>

            {hasActiveFilter && (
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-5 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Xóa bộ lọc
                </button>
            )}
        </div>
    );
}

function parseFiltersFromUrl(search) {
    const params = new URLSearchParams(search);

    return {
        keyword: params.get('keyword') || '',
        category_id: params.get('category_id') || '',
        min_price: params.get('min_price') || '',
        max_price: params.get('max_price') || '',
        sizes: params.get('sizes') || '',
        colors: params.get('colors') || '',
        rating: params.get('rating') || '',
        in_stock: params.get('in_stock') || '',
        sort: params.get('sort') || 'newest',
        page: toPositiveNumber(params.get('page'), 1),
    };
}

function isSameFilter(current, next) {
    return (
        current.keyword === next.keyword &&
        current.category_id === next.category_id &&
        current.min_price === next.min_price &&
        current.max_price === next.max_price &&
        current.sizes === next.sizes &&
        current.colors === next.colors &&
        current.rating === next.rating &&
        current.in_stock === next.in_stock &&
        current.sort === next.sort &&
        current.page === next.page
    );
}

function cleanParams(params) {
    const cleaned = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            cleaned[key] = value;
        }
    });

    return cleaned;
}

function toPositiveNumber(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
        return fallback;
    }

    return number;
}
