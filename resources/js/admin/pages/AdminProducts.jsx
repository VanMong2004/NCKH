import { Edit3, Loader2, Plus, Power, PowerOff, RefreshCcw, Search, Send, Sparkles, Star, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import categoryService from '../../services/categoryService';

import AdminProductFormModal from '../components/products/AdminProductFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
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

const facebookStyleOptions = [
    { value: 'intro', label: 'Giới thiệu sản phẩm' },
    { value: 'promotion', label: 'Khuyến mãi' },
    { value: 'sales', label: 'Bán hàng' },
];

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [saleActionId, setSaleActionId] = useState(null);
    const [facebookActionId, setFacebookActionId] = useState(null);
    const [facebookModal, setFacebookModal] = useState({
        open: false,
        product: null,
        style: 'intro',
        content: '',
        loadingPreview: false,
        submitting: false,
    });

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

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
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

    function handleDelete(product) {
        setConfirmDialog({
            open: true,
            title: 'Xóa sản phẩm',
            message: `Bạn muốn xóa sản phẩm "${product.name}"?`,
            description: 'Nếu sản phẩm đang có đơn hàng chưa hoàn tất, hệ thống sẽ không cho xóa.',
            confirmText: 'Xóa sản phẩm',
            type: 'danger',
            onConfirm: async () => {
                await deleteProduct(product);
            },
        });
    }

    async function deleteProduct(product) {
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

    function handleToggleSale(product) {
        const isSelling = Boolean(product.isActive);

        setConfirmDialog({
            open: true,
            title: isSelling ? 'Tắt bán sản phẩm' : 'Mở bán sản phẩm',
            message: isSelling
                ? `Bạn muốn tắt bán sản phẩm "${product.name}"?`
                : `Bạn muốn mở bán sản phẩm "${product.name}"?`,
            description: isSelling
                ? 'Sau khi tắt bán, sản phẩm sẽ không còn hiển thị như sản phẩm đang bán trên website.'
                : 'Sau khi mở bán, sản phẩm có thể hiển thị lại trên website.',
            confirmText: isSelling ? 'Tắt bán' : 'Mở bán',
            type: isSelling ? 'warning' : 'success',
            onConfirm: async () => {
                await toggleProductSale(product);
            },
        });
    }

    async function toggleProductSale(product) {
        try {
            setSaleActionId(product.id);

            const result = await adminProductService.toggleProductSale(product.id);

            toast.success(result.message || (product.isActive ? 'Đã tắt bán sản phẩm' : 'Đã mở bán sản phẩm'));

            await loadProducts();
        } catch (error) {
            toast.error(error?.message || 'Không thể cập nhật trạng thái bán sản phẩm');
        } finally {
            setSaleActionId(null);
        }
    }

    function handlePostFacebook(product) {
        setFacebookModal({
            open: true,
            product,
            style: 'intro',
            content: '',
            loadingPreview: true,
            submitting: false,
        });
        generateFacebookCaption(product.id, 'intro');
        return;

        setFacebookModal({
            open: true,
            title: 'Đăng sản phẩm lên Facebook',
            message: `Đăng sản phẩm "${product.name}" lên Facebook?`,
            description: 'Hệ thống sẽ gửi dữ liệu sản phẩm sang n8n để xử lý bài đăng Facebook.',
            confirmText: 'Đăng Facebook',
            type: 'info',
            onConfirm: async () => {
                await postProductFacebook(product);
            },
        });
    }

    async function postProductFacebook(product) {
        try {
            setFacebookActionId(product.id);

            const result = await adminProductService.postFacebook(product.id);

            toast.success(result.message || 'Đã gửi yêu cầu đăng Facebook');
        } catch (error) {
            toast.error(error?.message || 'Không thể gửi yêu cầu đăng Facebook');
        } finally {
            setFacebookActionId(null);
        }
    }

    async function generateFacebookCaption(productId, style) {
        try {
            setFacebookModal((current) => ({
                ...current,
                style,
                loadingPreview: true,
            }));

            const result = await adminProductService.generateFacebookCaption(productId, { style });

            setFacebookModal((current) => ({
                ...current,
                content: result?.data?.content || '',
                style: result?.data?.style || style,
            }));
        } catch (error) {
            toast.error(error?.message || 'Không thể tạo nội dung Facebook bằng AI');
        } finally {
            setFacebookModal((current) => ({
                ...current,
                loadingPreview: false,
            }));
        }
    }

    async function submitFacebookPost() {
        const product = facebookModal.product;

        if (!product) return;

        if (!facebookModal.content.trim()) {
            toast.error('Vui lòng nhập nội dung bài đăng Facebook');
            return;
        }

        try {
            setFacebookModal((current) => ({
                ...current,
                submitting: true,
            }));
            setFacebookActionId(product.id);

            const result = await adminProductService.postFacebook(product.id, {
                content: facebookModal.content,
                style: facebookModal.style,
            });

            toast.success(result.message || 'Đã gửi yêu cầu đăng Facebook');
            closeFacebookModal();
        } catch (error) {
            toast.error(error?.message || 'Không thể gửi yêu cầu đăng Facebook');
        } finally {
            setFacebookActionId(null);
            setFacebookModal((current) => ({
                ...current,
                submitting: false,
            }));
        }
    }

    function closeFacebookModal() {
        setFacebookModal({
            open: false,
            product: null,
            style: 'intro',
            content: '',
            loadingPreview: false,
            submitting: false,
        });
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    title="Đăng Facebook"
                                                    disabled={facebookActionId === product.id}
                                                    onClick={() => handlePostFacebook(product)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    {facebookActionId === product.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Send size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    title={product.isActive ? 'Tắt bán' : 'Mở bán'}
                                                    disabled={saleActionId === product.id}
                                                    onClick={() => handleToggleSale(product)}
                                                    className={[
                                                        'inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950',
                                                        product.isActive
                                                            ? 'border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-amber-500/10'
                                                            : 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/10',
                                                    ].join(' ')}
                                                >
                                                    {saleActionId === product.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : product.isActive ? (
                                                        <PowerOff size={16} />
                                                    ) : (
                                                        <Power size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Sửa sản phẩm"
                                                    onClick={() => openEditForm(product)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    <Edit3 size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Xóa sản phẩm"
                                                    disabled={deletingId === product.id}
                                                    onClick={() => handleDelete(product)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                                                >
                                                    {deletingId === product.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
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

            <FacebookCaptionModal
                state={facebookModal}
                onClose={closeFacebookModal}
                onChange={(field, value) => {
                    setFacebookModal((current) => ({
                        ...current,
                        [field]: value,
                    }));
                }}
                onRegenerate={() => generateFacebookCaption(facebookModal.product?.id, facebookModal.style)}
                onSubmit={submitFacebookPost}
            />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onOpenChange={(open) => {
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open,
                    }));
                }}
            />
        </div>
    );
}

function FacebookCaptionModal({ state, onClose, onChange, onRegenerate, onSubmit }) {
    if (!state.open) return null;

    const isBusy = state.loadingPreview || state.submitting;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3">
            <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
                    <div>
                        <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-300">AI Facebook</p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                            Tạo nội dung bài đăng
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {state.product?.name || 'Sản phẩm'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-[220px_auto] sm:items-end">
                        <label className="block">
                            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                Phong cách viết
                            </span>
                            <select
                                value={state.style}
                                onChange={(event) => onChange('style', event.target.value)}
                                disabled={isBusy}
                                className={controlClass}
                            >
                                {facebookStyleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={onRegenerate}
                            disabled={isBusy}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                        >
                            {state.loadingPreview ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Tạo lại bằng AI
                        </button>
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                            Nội dung sẽ đăng
                        </span>
                        <textarea
                            value={state.content}
                            onChange={(event) => onChange('content', event.target.value)}
                            rows={10}
                            disabled={state.loadingPreview || state.submitting}
                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            placeholder="Nội dung AI sẽ hiển thị ở đây, admin có thể chỉnh trước khi đăng."
                        />
                    </label>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isBusy || !state.content.trim()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {state.submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Đăng Facebook
                    </button>
                </div>
            </div>
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
