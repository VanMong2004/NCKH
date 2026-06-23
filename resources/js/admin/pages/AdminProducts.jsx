import { Edit3, Loader2, Plus, RefreshCcw, Search, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import categoryService from '../../services/categoryService';

import AdminProductFormModal from '../components/products/AdminProductFormModal';
import StatCard from '../components/ui/StatCard';
import { formatMoney } from '../mappers/adminProductMapper';
import adminProductService from '../services/adminProductService';

const activeOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: '1', label: 'Đang bán' },
    { value: '0', label: 'Đang ẩn' },
];

const featuredOptions = [
    { value: '', label: 'Tất cả nổi bật' },
    { value: '1', label: 'Sản phẩm nổi bật' },
    { value: '0', label: 'Không nổi bật' },
];

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'name_asc', label: 'Tên A-Z' },
    { value: 'name_desc', label: 'Tên Z-A' },
];

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const [filters, setFilters] = useState({
        keyword: '',
        category_id: '',
        is_active: '',
        is_featured: '',
        sort_by: 'latest',
        page: 1,
        per_page: 10,
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const [formState, setFormState] = useState({
        open: false,
        mode: 'create',
        productId: null,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedKeyword,
        filters.category_id,
        filters.is_active,
        filters.is_featured,
        filters.sort_by,
        filters.page,
        filters.per_page,
    ]);

    async function loadCategories() {
        try {
            const result = await categoryService.getCategories();
            setCategories(result.categories || []);
        } catch {
            setCategories([]);
        }
    }

    async function loadProducts() {
        try {
            setLoading(true);

            const result = await adminProductService.getProducts({
                keyword: debouncedKeyword || undefined,
                category_id: filters.category_id || undefined,
                is_active: filters.is_active === '' ? undefined : filters.is_active,
                is_featured: filters.is_featured === '' ? undefined : filters.is_featured,
                sort_by: filters.sort_by || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });

            setProducts(result.products || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: filters.per_page,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(key, value) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1,
        }));
    }

    function resetFilters() {
        setFilters({
            keyword: '',
            category_id: '',
            is_active: '',
            is_featured: '',
            sort_by: 'latest',
            page: 1,
            per_page: 10,
        });

        setDebouncedKeyword('');
    }

    function openCreateForm() {
        setFormState({
            open: true,
            mode: 'create',
            productId: null,
        });
    }

    function openEditForm(product) {
        setFormState({
            open: true,
            mode: 'edit',
            productId: product.id,
        });
    }

    function closeForm() {
        setFormState({
            open: false,
            mode: 'create',
            productId: null,
        });
    }

    async function handleSavedProduct() {
        await loadProducts();
        closeForm();
    }

    async function handleDelete(product) {
        const ok = window.confirm(
            `Bạn muốn xóa sản phẩm "${product.name}"?\n\nNếu sản phẩm đang có đơn hàng chưa hoàn tất, hệ thống sẽ không cho xóa.`,
        );

        if (!ok) return;

        try {
            setDeletingId(product.id);

            const result = await adminProductService.deleteProduct(product.id);

            toast.success(result.message || 'Đã xóa sản phẩm');
            await loadProducts();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa sản phẩm');
        } finally {
            setDeletingId(null);
        }
    }

    const summary = useMemo(() => {
        return {
            total: meta.total,
            active: products.filter((item) => item.isActive).length,
            hidden: products.filter((item) => !item.isActive).length,
            featured: products.filter((item) => item.isFeatured).length,
            stock: products.reduce((sum, item) => sum + Number(item.totalStock || 0), 0),
        };
    }, [products, meta.total]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sản phẩm</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý sản phẩm, hình ảnh, giá bán, tồn kho và trạng thái hiển thị.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    <Plus size={17} />
                    Thêm sản phẩm
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Tổng sản phẩm" value={summary.total} tone="blue" />
                <StatCard label="Đang bán" value={summary.active} tone="emerald" />
                <StatCard label="Đang ẩn" value={summary.hidden} tone="gray" />
                <StatCard label="Nổi bật" value={summary.featured} tone="amber" />
                <StatCard label="Tồn kho" value={summary.stock} tone="violet" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm tên sản phẩm..."
                                className={controlClass + ' pl-9'}
                            />
                        </div>

                        <select
                            value={filters.category_id}
                            onChange={(e) => updateFilter('category_id', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.is_active}
                            onChange={(e) => updateFilter('is_active', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {activeOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.is_featured}
                            onChange={(e) => updateFilter('is_featured', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {featuredOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.sort_by}
                            onChange={(e) => updateFilter('sort_by', e.target.value)}
                            className={controlClass + ' lg:col-span-2'}
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Sản phẩm</Th>
                                <Th>Danh mục</Th>
                                <Th>Giá bán</Th>
                                <Th className="text-center">Tồn</Th>
                                <Th className="text-center">Đã bán</Th>
                                <Th>Đánh giá</Th>
                                <Th>Trạng thái</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải sản phẩm...</p>
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.name}
                                                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/images/no-image.png';
                                                    }}
                                                />

                                                <div className="min-w-0">
                                                    <p className="max-w-[280px] truncate font-semibold text-slate-900 dark:text-white">
                                                        {product.name || 'Sản phẩm'}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {product.variantsCount || 0} phân loại
                                                        {product.slug ? ` · ${product.slug}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                                            {product.category || '—'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {getPriceText(product)}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center">
                                            <StockText value={product.totalStock} />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center text-slate-600 dark:text-slate-300">
                                            {product.soldCount || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                                                <Star size={14} className="text-amber-400" />
                                                {product.averageRating || 0}
                                                <span className="text-xs text-slate-400">
                                                    ({product.totalReviews || 0})
                                                </span>
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                <StatusBadge active={product.isActive}>
                                                    {product.isActive ? 'Đang bán' : 'Đang ẩn'}
                                                </StatusBadge>

                                                {product.isFeatured && (
                                                    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                        Nổi bật
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(product)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <Edit3 size={15} />
                                                    Sửa
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={deletingId === product.id}
                                                    onClick={() => handleDelete(product)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                                >
                                                    {deletingId === product.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={15} />
                                                    )}
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                                            Không có sản phẩm phù hợp
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Thử đổi từ khóa hoặc đặt lại bộ lọc.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <p className="text-sm text-slate-500">
                        Hiển thị <b>{products.length}</b> / <b>{meta.total}</b> sản phẩm
                    </p>

                    <div className="flex items-center gap-2">
                        <select
                            value={filters.per_page}
                            onChange={(e) => updateFilter('per_page', Number(e.target.value))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>

                        <button
                            type="button"
                            disabled={meta.currentPage <= 1 || loading}
                            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Trước
                        </button>

                        <span className="min-w-[80px] text-center text-sm text-slate-500">
                            {meta.currentPage}/{meta.lastPage}
                        </span>

                        <button
                            type="button"
                            disabled={meta.currentPage >= meta.lastPage || loading}
                            onClick={() => updateFilter('page', Math.min(meta.lastPage, filters.page + 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Sau
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={loadProducts}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Tải lại"
                        >
                            <RefreshCcw size={15} />
                        </button>
                    </div>
                </div>
            </section>

            <AdminProductFormModal
                open={formState.open}
                mode={formState.mode}
                productId={formState.productId}
                categories={categories}
                onClose={closeForm}
                onSaved={handleSavedProduct}
            />
        </div>
    );
}

function getPriceText(product) {
    const min = Number(product.minPrice || 0);
    const max = Number(product.maxPrice || 0);

    if (!min && !max) return 'Chưa có giá';
    if (min === max) return formatMoney(min);

    return `${formatMoney(min)} - ${formatMoney(max)}`;
}

function Th({ children, className = '' }) {
    return (
        <th
            scope="col"
            className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}
        >
            {children}
        </th>
    );
}

function StatusBadge({ active, children }) {
    return (
        <span
            className={[
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            ].join(' ')}
        >
            {children}
        </span>
    );
}

function StockText({ value }) {
    const stock = Number(value || 0);

    if (stock <= 0) {
        return <span className="font-semibold text-red-600 dark:text-red-300">Hết</span>;
    }

    if (stock <= 5) {
        return <span className="font-semibold text-amber-600 dark:text-amber-300">{stock}</span>;
    }

    return <span className="font-semibold text-slate-800 dark:text-slate-100">{stock}</span>;
}

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
