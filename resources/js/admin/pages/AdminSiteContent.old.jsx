import { Edit3, Eye, EyeOff, Layers, Loader2, RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminSiteFormModal from '../components/site-content/AdminSiteFormModal';
import adminSiteContentService from '../services/adminSiteContentService';
import StatCard from '../components/ui/StatCard';

const pageOptions = [
    { value: '', label: 'Tất cả khu vực' },
    { value: 'home', label: 'Trang chủ' },
    { value: 'navbar', label: 'Thanh điều hướng' },
    { value: 'footer', label: 'Chân trang' },
    { value: 'shop', label: 'Trang sản phẩm' },
    { value: 'promotions', label: 'Trang khuyến mãi' },
    { value: 'about', label: 'Giới thiệu' },
    { value: 'contact', label: 'Liên hệ' },
];

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: '1', label: 'Đang hiển thị' },
    { value: '0', label: 'Đã tắt' },
];

export default function AdminSiteContent() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    const [filters, setFilters] = useState({
        keyword: '',
        page_key: '',
        is_active: '',
        page: 1,
        per_page: 10,
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [formState, setFormState] = useState({
        open: false,
        componentId: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadComponents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKeyword, filters.page_key, filters.is_active]);

    async function loadComponents() {
        try {
            setLoading(true);

            const result = await adminSiteContentService.getComponents({
                keyword: debouncedKeyword || undefined,
                page_key: filters.page_key || undefined,
                is_active: filters.is_active === '' ? undefined : filters.is_active,
            });

            setComponents(result.components || []);

            setFilters((prev) => ({
                ...prev,
                page: 1,
            }));
        } catch (error) {
            toast.error(error?.message || 'Không thể tải nội dung website');
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
            page_key: '',
            is_active: '',
            page: 1,
            per_page: 10,
        });

        setDebouncedKeyword('');
    }

    function openManageForm(component) {
        setFormState({
            open: true,
            componentId: component.id,
        });
    }

    function closeForm() {
        setFormState({
            open: false,
            componentId: null,
        });
    }

    async function handleSavedComponent() {
        await loadComponents();
    }

    async function handleToggle(component) {
        try {
            setActionId(component.id);

            await adminSiteContentService.toggleComponent(component.id);

            toast.success(component.isActive ? 'Đã tắt khu vực hiển thị' : 'Đã bật khu vực hiển thị');

            await loadComponents();
        } catch (error) {
            toast.error(error?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setActionId(null);
        }
    }

    const summary = useMemo(() => {
        return {
            total: components.length,
            active: components.filter((item) => item.isActive).length,
            inactive: components.filter((item) => !item.isActive).length,
            items: components.reduce((sum, item) => sum + Number(item.itemsCount || 0), 0),
        };
    }, [components]);

    const pageCount = Math.max(1, Math.ceil(components.length / filters.per_page));

    const pagedComponents = useMemo(() => {
        const start = (filters.page - 1) * filters.per_page;
        return components.slice(start, start + filters.per_page);
    }, [components, filters.page, filters.per_page]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nội dung website</h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý menu, slider, chân trang và các khu vực hiển thị ngoài website.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadComponents}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Tải lại
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Khu vực quản lý" value={summary.total} tone="blue" />
                <StatCard label="Đang hiển thị" value={summary.active} tone="emerald" />
                <StatCard label="Đã tắt" value={summary.inactive} tone="slate" />
                <StatCard label="Tổng mục nội dung" value={summary.items} tone="violet" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 md:grid-cols-12">
                        <div className="relative md:col-span-5">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm menu, slider, chân trang..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        <select
                            value={filters.page_key}
                            onChange={(e) => updateFilter('page_key', e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-3"
                        >
                            {pageOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.is_active}
                            onChange={(e) => updateFilter('is_active', e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 md:col-span-2"
                        >
                            Đặt lại
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Khu vực</Th>
                                <Th>Vị trí</Th>
                                <Th className="text-center">Mục con</Th>
                                <Th>Cập nhật</Th>
                                <Th>Trạng thái</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải nội dung...</p>
                                    </td>
                                </tr>
                            ) : pagedComponents.length > 0 ? (
                                pagedComponents.map((component) => (
                                    <tr key={component.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                                                    {component.image ? (
                                                        <img
                                                            src={component.image}
                                                            alt={component.areaText}
                                                            className="h-full w-full rounded-lg object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Layers size={17} className="text-slate-400" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="max-w-[260px] truncate font-semibold text-slate-900 dark:text-white">
                                                        {component.areaText}
                                                    </p>

                                                    <p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-500">
                                                        {component.title ||
                                                            component.componentName ||
                                                            'Chưa có tiêu đề'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                                            {component.positionText}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center text-slate-700 dark:text-slate-200">
                                            {component.itemsCount || 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                                            {component.updatedAt || '—'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <StatusBadge active={component.isActive} />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openManageForm(component)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <Edit3 size={15} />
                                                    Sửa
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={actionId === component.id}
                                                    onClick={() => handleToggle(component)}
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    {actionId === component.id ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : component.isActive ? (
                                                        <EyeOff size={15} />
                                                    ) : (
                                                        <Eye size={15} />
                                                    )}

                                                    {component.isActive ? 'Tắt' : 'Bật'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Layers size={28} className="mx-auto text-slate-300" />

                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                            Không tìm thấy khu vực phù hợp
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
                        Hiển thị <b>{pagedComponents.length}</b> / <b>{components.length}</b> khu vực
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
                            disabled={filters.page <= 1 || loading}
                            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Trước
                        </button>

                        <span className="min-w-[80px] text-center text-sm text-slate-500">
                            {filters.page}/{pageCount}
                        </span>

                        <button
                            type="button"
                            disabled={filters.page >= pageCount || loading}
                            onClick={() => updateFilter('page', Math.min(pageCount, filters.page + 1))}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>

            <AdminSiteFormModal
                open={formState.open}
                componentId={formState.componentId}
                onClose={closeForm}
                onSaved={handleSavedComponent}
            />
        </div>
    );
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

function StatusBadge({ active }) {
    if (active) {
        return (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Đang hiển thị
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Đã tắt
        </span>
    );
}
