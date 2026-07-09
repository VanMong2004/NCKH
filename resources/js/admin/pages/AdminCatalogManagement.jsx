import { Building2, Edit3, Layers, Loader2, Plus, RefreshCcw, Search, Tags, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import adminCategoryService from '../services/adminCategoryService';
import adminDepartmentService from '../services/adminDepartmentService';

const sortOptions = [
    { value: 'sort_order', label: 'Thứ tự hiển thị' },
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'name', label: 'Theo tên' },
];

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: '1', label: 'Đang bật' },
    { value: '0', label: 'Đang tắt' },
];

const emptyCategoryForm = {
    name: '',
    slug: '',
    parent_id: '',
    description: '',
    is_active: true,
    sort_order: 0,
};

const emptyDepartmentForm = {
    name: '',
    code: '',
    slug: '',
    description: '',
    is_active: true,
    sort_order: 0,
};

export default function AdminCatalogManagement() {
    const [activeTab, setActiveTab] = useState('categories');
    const [categoryState, setCategoryState] = useState(defaultCatalogState());
    const [departmentState, setDepartmentState] = useState(defaultCatalogState());
    const [categoryModal, setCategoryModal] = useState({ open: false, item: null });
    const [departmentModal, setDepartmentModal] = useState({ open: false, item: null });
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        loadCategories();
        loadDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        categoryState.filters.keyword,
        categoryState.filters.parent_id,
        categoryState.filters.is_active,
        categoryState.filters.sort,
        categoryState.filters.page,
        categoryState.filters.per_page,
    ]);

    useEffect(() => {
        loadDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        departmentState.filters.keyword,
        departmentState.filters.is_active,
        departmentState.filters.sort,
        departmentState.filters.page,
        departmentState.filters.per_page,
    ]);

    async function loadCategories() {
        try {
            setCategoryState((prev) => ({ ...prev, loading: true }));
            const filters = categoryState.filters;
            const result = await adminCategoryService.getCategories({
                keyword: filters.keyword || undefined,
                parent_id: filters.parent_id || undefined,
                is_active: filters.is_active === '' ? undefined : filters.is_active,
                sort: filters.sort,
                page: filters.page,
                per_page: filters.per_page,
            });

            setCategoryState((prev) => ({
                ...prev,
                items: result.categories || [],
                parents: result.parents || [],
                stats: result.stats || {},
                meta: result.meta || prev.meta,
                loading: false,
            }));
        } catch (error) {
            setCategoryState((prev) => ({ ...prev, loading: false }));
            toast.error(error?.message || 'Không thể tải danh mục');
        }
    }

    async function loadDepartments() {
        try {
            setDepartmentState((prev) => ({ ...prev, loading: true }));
            const filters = departmentState.filters;
            const result = await adminDepartmentService.getDepartments({
                keyword: filters.keyword || undefined,
                is_active: filters.is_active === '' ? undefined : filters.is_active,
                sort: filters.sort,
                page: filters.page,
                per_page: filters.per_page,
            });

            setDepartmentState((prev) => ({
                ...prev,
                items: result.departments || [],
                stats: result.stats || {},
                meta: result.meta || prev.meta,
                loading: false,
            }));
        } catch (error) {
            setDepartmentState((prev) => ({ ...prev, loading: false }));
            toast.error(error?.message || 'Không thể tải đơn vị/khoa');
        }
    }

    function updateCategoryFilter(key, value) {
        setCategoryState((prev) => ({
            ...prev,
            filters: { ...prev.filters, [key]: value, page: key === 'page' ? value : 1 },
        }));
    }

    function updateDepartmentFilter(key, value) {
        setDepartmentState((prev) => ({
            ...prev,
            filters: { ...prev.filters, [key]: value, page: key === 'page' ? value : 1 },
        }));
    }

    function resetCategoryFilters() {
        setCategoryState((prev) => ({
            ...prev,
            filters: defaultFilters(),
        }));
    }

    function resetDepartmentFilters() {
        setDepartmentState((prev) => ({
            ...prev,
            filters: defaultFilters(),
        }));
    }

    async function saveCategory(payload, item) {
        if (item?.id) {
            await adminCategoryService.updateCategory(item.id, payload);
            toast.success('Đã cập nhật danh mục');
        } else {
            await adminCategoryService.createCategory(payload);
            toast.success('Đã thêm danh mục');
        }

        setCategoryModal({ open: false, item: null });
        await loadCategories();
    }

    async function saveDepartment(payload, item) {
        if (item?.id) {
            await adminDepartmentService.updateDepartment(item.id, payload);
            toast.success('Đã cập nhật đơn vị/khoa');
        } else {
            await adminDepartmentService.createDepartment(payload);
            toast.success('Đã thêm đơn vị/khoa');
        }

        setDepartmentModal({ open: false, item: null });
        await loadDepartments();
    }

    async function toggleCategory(item) {
        try {
            await adminCategoryService.toggleActive(item.id, !item.isActive);
            toast.success(!item.isActive ? 'Đã bật danh mục' : 'Đã tắt danh mục');
            await loadCategories();
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        }
    }

    async function toggleDepartment(item) {
        try {
            await adminDepartmentService.toggleActive(item.id, !item.isActive);
            toast.success(!item.isActive ? 'Đã bật đơn vị/khoa' : 'Đã tắt đơn vị/khoa');
            await loadDepartments();
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        }
    }

    function confirmDeleteCategory(item) {
        setConfirm({
            title: 'Xóa danh mục',
            message: `Bạn muốn xóa danh mục "${item.name}"?`,
            description: 'Không thể xóa nếu danh mục còn sản phẩm hoặc danh mục con liên kết.',
            onConfirm: async () => {
                await adminCategoryService.deleteCategory(item.id);
                toast.success('Đã xóa danh mục');
                await loadCategories();
            },
        });
    }

    function confirmDeleteDepartment(item) {
        setConfirm({
            title: 'Xóa đơn vị/khoa',
            message: `Bạn muốn xóa đơn vị/khoa "${item.name}"?`,
            description: 'Không thể xóa nếu đơn vị/khoa còn sản phẩm liên kết.',
            onConfirm: async () => {
                await adminDepartmentService.deleteDepartment(item.id);
                toast.success('Đã xóa đơn vị/khoa');
                await loadDepartments();
            },
        });
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Danh mục & Khoa</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý danh mục sản phẩm và đơn vị/khoa liên quan.
                    </p>
                </div>

                <button type="button" onClick={activeTab === 'categories' ? loadCategories : loadDepartments} className={secondaryButtonClass}>
                    <RefreshCcw size={16} /> Làm mới
                </button>
            </div>

            <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={Tags}>
                    Danh mục sản phẩm
                </TabButton>
                <TabButton active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} icon={Building2}>
                    Đơn vị/Khoa
                </TabButton>
            </div>

            {activeTab === 'categories' ? (
                <CategoryTab
                    state={categoryState}
                    updateFilter={updateCategoryFilter}
                    resetFilters={resetCategoryFilters}
                    onAdd={() => setCategoryModal({ open: true, item: null })}
                    onEdit={(item) => setCategoryModal({ open: true, item })}
                    onToggle={toggleCategory}
                    onDelete={confirmDeleteCategory}
                />
            ) : (
                <DepartmentTab
                    state={departmentState}
                    updateFilter={updateDepartmentFilter}
                    resetFilters={resetDepartmentFilters}
                    onAdd={() => setDepartmentModal({ open: true, item: null })}
                    onEdit={(item) => setDepartmentModal({ open: true, item })}
                    onToggle={toggleDepartment}
                    onDelete={confirmDeleteDepartment}
                />
            )}

            <CatalogFormModal
                type="category"
                open={categoryModal.open}
                item={categoryModal.item}
                parents={categoryState.parents}
                onClose={() => setCategoryModal({ open: false, item: null })}
                onSave={saveCategory}
            />

            <CatalogFormModal
                type="department"
                open={departmentModal.open}
                item={departmentModal.item}
                onClose={() => setDepartmentModal({ open: false, item: null })}
                onSave={saveDepartment}
            />

            <ConfirmDialog
                open={Boolean(confirm)}
                onOpenChange={(open) => !open && setConfirm(null)}
                title={confirm?.title}
                message={confirm?.message}
                description={confirm?.description}
                confirmText="Xóa"
                type="danger"
                onConfirm={confirm?.onConfirm}
            />
        </div>
    );
}

function CategoryTab({ state, updateFilter, resetFilters, onAdd, onEdit, onToggle, onDelete }) {
    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Tổng danh mục" value={state.stats.total || 0} tone="blue" icon={Tags} />
                <StatCard label="Đang hiển thị" value={state.stats.active || 0} tone="emerald" />
                <StatCard label="Đang tắt" value={state.stats.inactive || 0} tone="slate" />
                <StatCard label="Danh mục cha" value={state.stats.parents || 0} tone="violet" />
                <StatCard label="Danh mục con" value={state.stats.children || 0} tone="amber" />
            </div>

            <section className={sectionClass}>
                <Toolbar title="Danh mục sản phẩm" addLabel="Thêm danh mục" onAdd={onAdd}>
                    <div className="grid gap-3 lg:grid-cols-12">
                        <SearchInput value={state.filters.keyword} onChange={(value) => updateFilter('keyword', value)} className="lg:col-span-3" placeholder="Tìm danh mục..." />
                        <select value={state.filters.is_active} onChange={(e) => updateFilter('is_active', e.target.value)} className={controlClass + ' lg:col-span-2'}>
                            {statusOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                        </select>
                        <select value={state.filters.parent_id} onChange={(e) => updateFilter('parent_id', e.target.value)} className={controlClass + ' lg:col-span-3'}>
                            <option value="">Tất cả danh mục cha</option>
                            <option value="root">Chỉ danh mục gốc</option>
                            {state.parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
                        </select>
                        <select value={state.filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className={controlClass + ' lg:col-span-2'}>
                            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <button type="button" onClick={resetFilters} className={filterResetClass + ' lg:col-span-2'}>Xóa lọc</button>
                    </div>
                </Toolbar>

                <DataTable loading={state.loading} emptyText="Chưa có danh mục nào" itemCount={state.items.length}>
                    <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr>
                            <Th>Tên danh mục</Th>
                            <Th>Slug</Th>
                            <Th>Danh mục cha</Th>
                            <Th className="text-center">Sản phẩm</Th>
                            <Th className="text-center">Danh mục con</Th>
                            <Th>Trạng thái</Th>
                            <Th>Thứ tự</Th>
                            <Th className="text-right">Thao tác</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        {state.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                <Td className="font-semibold text-slate-900 dark:text-white">{item.name}</Td>
                                <Td>{item.slug}</Td>
                                <Td>{item.parentName || 'Danh mục gốc'}</Td>
                                <Td className="text-center font-semibold">{item.productsCount}</Td>
                                <Td className="text-center font-semibold">{item.childrenCount}</Td>
                                <Td><ActiveBadge active={item.isActive} /></Td>
                                <Td>{item.sortOrder}</Td>
                                <ActionTd item={item} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
                            </tr>
                        ))}
                    </tbody>
                </DataTable>

                <Pagination state={state} updateFilter={updateFilter} label="danh mục" />
            </section>
        </div>
    );
}

function DepartmentTab({ state, updateFilter, resetFilters, onAdd, onEdit, onToggle, onDelete }) {
    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Tổng đơn vị/khoa" value={state.stats.total || 0} tone="blue" icon={Building2} />
                <StatCard label="Đang hoạt động" value={state.stats.active || 0} tone="emerald" />
                <StatCard label="Đang tắt" value={state.stats.inactive || 0} tone="slate" />
            </div>

            <section className={sectionClass}>
                <Toolbar title="Đơn vị/Khoa" addLabel="Thêm đơn vị/khoa" onAdd={onAdd}>
                    <div className="grid gap-3 lg:grid-cols-12">
                        <SearchInput value={state.filters.keyword} onChange={(value) => updateFilter('keyword', value)} className="lg:col-span-4" placeholder="Tìm tên, mã, slug..." />
                        <select value={state.filters.is_active} onChange={(e) => updateFilter('is_active', e.target.value)} className={controlClass + ' lg:col-span-3'}>
                            {statusOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                        </select>
                        <select value={state.filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className={controlClass + ' lg:col-span-3'}>
                            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <button type="button" onClick={resetFilters} className={filterResetClass + ' lg:col-span-2'}>Xóa lọc</button>
                    </div>
                </Toolbar>

                <DataTable loading={state.loading} emptyText="Chưa có đơn vị/khoa nào" itemCount={state.items.length}>
                    <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr>
                            <Th>Tên đơn vị/khoa</Th>
                            <Th>Mã</Th>
                            <Th>Slug</Th>
                            <Th className="text-center">Sản phẩm</Th>
                            <Th>Trạng thái</Th>
                            <Th>Thứ tự</Th>
                            <Th className="text-right">Thao tác</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        {state.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                <Td className="font-semibold text-slate-900 dark:text-white">{item.name}</Td>
                                <Td>{item.code || '—'}</Td>
                                <Td>{item.slug}</Td>
                                <Td className="text-center font-semibold">{item.productsCount}</Td>
                                <Td><ActiveBadge active={item.isActive} /></Td>
                                <Td>{item.sortOrder}</Td>
                                <ActionTd item={item} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
                            </tr>
                        ))}
                    </tbody>
                </DataTable>

                <Pagination state={state} updateFilter={updateFilter} label="đơn vị/khoa" />
            </section>
        </div>
    );
}

function CatalogFormModal({ type, open, item, parents = [], onClose, onSave }) {
    const isCategory = type === 'category';
    const [form, setForm] = useState(isCategory ? emptyCategoryForm : emptyDepartmentForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;

        if (item) {
            setForm({
                name: item.name || '',
                code: item.code || '',
                slug: item.slug || '',
                parent_id: item.parentId || '',
                description: item.description || '',
                is_active: Boolean(item.isActive),
                sort_order: item.sortOrder || 0,
            });
        } else {
            setForm(isCategory ? emptyCategoryForm : emptyDepartmentForm);
        }
    }, [open, item, isCategory]);

    if (!open) return null;

    function updateField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function submit(e) {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error(isCategory ? 'Vui lòng nhập tên danh mục' : 'Vui lòng nhập tên đơn vị/khoa');
            return;
        }

        try {
            setSaving(true);
            await onSave({
                name: form.name.trim(),
                code: isCategory ? undefined : form.code.trim(),
                slug: form.slug.trim(),
                parent_id: isCategory ? form.parent_id || null : undefined,
                description: form.description,
                is_active: form.is_active,
                sort_order: Number(form.sort_order || 0),
            }, item);
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu dữ liệu');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {item ? 'Cập nhật' : 'Thêm'} {isCategory ? 'danh mục' : 'đơn vị/khoa'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">Slug có thể để trống để hệ thống tự tạo từ tên.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5">
                    <Field label={isCategory ? 'Tên danh mục' : 'Tên đơn vị/khoa'} required>
                        <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className={controlClass} />
                    </Field>

                    {!isCategory && (
                        <Field label="Mã đơn vị/khoa">
                            <input value={form.code} onChange={(e) => updateField('code', e.target.value)} className={controlClass} placeholder="VD: CNTT" />
                        </Field>
                    )}

                    <Field label="Slug">
                        <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className={controlClass} placeholder="Tự tạo nếu bỏ trống" />
                    </Field>

                    {isCategory && (
                        <Field label="Danh mục cha">
                            <select value={form.parent_id} onChange={(e) => updateField('parent_id', e.target.value)} className={controlClass}>
                                <option value="">Không có danh mục cha</option>
                                {parents
                                    .filter((parent) => parent.id !== item?.id)
                                    .map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
                            </select>
                        </Field>
                    )}

                    <Field label="Mô tả">
                        <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={4} className={textareaClass} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Thứ tự">
                            <input type="number" min="0" value={form.sort_order} onChange={(e) => updateField('sort_order', e.target.value)} className={controlClass} />
                        </Field>

                        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <span>
                                <span className="block text-sm font-semibold text-slate-900 dark:text-white">Trạng thái</span>
                                <span className="mt-0.5 block text-xs text-slate-500">{form.is_active ? 'Đang bật' : 'Đang tắt'}</span>
                            </span>
                            <input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} className="h-5 w-5" />
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Đóng</button>
                        <button type="submit" disabled={saving} className={primaryButtonClass}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Toolbar({ title, addLabel, onAdd, children }) {
    return (
        <div className="space-y-4 border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
                <button type="button" onClick={onAdd} className={primaryButtonClass}>
                    <Plus size={16} /> {addLabel}
                </button>
            </div>
            {children}
        </div>
    );
}

function DataTable({ loading, emptyText, itemCount, children }) {
    if (loading) {
        return (
            <div className="px-4 py-12 text-center">
                <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!itemCount) {
        return (
            <div className="px-4 py-12 text-center">
                <Layers size={30} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">{children}</table>
        </div>
    );
}

function Pagination({ state, updateFilter, label }) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-sm text-slate-500">Hiển thị <b>{state.items.length}</b> / <b>{state.meta.total}</b> {label}</p>
            <div className="flex items-center gap-2">
                <select value={state.filters.per_page} onChange={(e) => updateFilter('per_page', Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </select>
                <button type="button" disabled={state.meta.currentPage <= 1 || state.loading} onClick={() => updateFilter('page', Math.max(1, state.meta.currentPage - 1))} className={pageButtonClass}>Trước</button>
                <span className="min-w-[80px] text-center text-sm text-slate-500">{state.meta.currentPage}/{state.meta.lastPage}</span>
                <button type="button" disabled={state.meta.currentPage >= state.meta.lastPage || state.loading} onClick={() => updateFilter('page', Math.min(state.meta.lastPage, state.meta.currentPage + 1))} className={pageButtonClass}>Sau</button>
            </div>
        </div>
    );
}

function SearchInput({ value, onChange, placeholder, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={controlClass + ' pl-9'} />
        </div>
    );
}

function ActionTd({ item, onEdit, onToggle, onDelete }) {
    async function handleToggle() {
        try {
            await onToggle(item);
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        }
    }

    return (
        <Td className="text-right">
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => onEdit(item)} className={smallButtonClass}><Edit3 size={15} /> Sửa</button>
                <button type="button" onClick={handleToggle} className={smallButtonClass}>{item.isActive ? 'Tắt' : 'Bật'}</button>
                <button type="button" onClick={() => onDelete(item)} className={dangerButtonClass}><Trash2 size={15} /> Xóa</button>
            </div>
        </Td>
    );
}

function ActiveBadge({ active }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
            {active ? 'Đang bật' : 'Đang tắt'}
        </span>
    );
}

function TabButton({ active, onClick, icon: Icon, children }) {
    return (
        <button type="button" onClick={onClick} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
            <Icon size={17} /> {children}
        </button>
    );
}

function Field({ label, required = false, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}{required ? ' *' : ''}</span>
            {children}
        </label>
    );
}

function Th({ children, className = '' }) {
    return <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}>{children}</th>;
}

function Td({ children, className = '' }) {
    return <td className={`whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300 ${className}`}>{children}</td>;
}

function defaultFilters() {
    return {
        keyword: '',
        is_active: '',
        parent_id: '',
        sort: 'sort_order',
        page: 1,
        per_page: 10,
    };
}

function defaultCatalogState() {
    return {
        items: [],
        parents: [],
        stats: {},
        loading: true,
        filters: defaultFilters(),
        meta: { currentPage: 1, lastPage: 1, total: 0, perPage: 10 },
    };
}

function getApiErrorMessage(error) {
    const errors = error?.response?.data?.errors || error?.raw?.errors || error?.errors || {};
    const firstError = Object.values(errors).flat().find(Boolean);

    return error?.response?.data?.message
        || error?.raw?.message
        || firstError
        || error?.message
        || 'Đã xảy ra lỗi, vui lòng thử lại';
}

const sectionClass = 'overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';
const controlClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const textareaClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const filterResetClass = 'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800';
const secondaryButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
const primaryButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200';
const smallButtonClass = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800';
const dangerButtonClass = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10';
const pageButtonClass = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200';
