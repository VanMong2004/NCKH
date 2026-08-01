import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import adminSiteContentService from '../../services/adminSiteContentService';
import ConfirmDialog from '../ui/ConfirmDialog';

const initialForm = {
    id: null,
    page_key: '',
    page_name: '',
    component_key: '',
    component_name: '',
    component_type: '',
    title: '',
    subtitle: '',
    content: '',
    image: '',
    mobile_image: '',
    payload_text: '{}',
    sort_order: 0,
    is_active: true,
    items: [],
};

const initialItemForm = {
    id: null,
    parent_id: '',
    group_key: '',
    item_key: '',
    item_type: 'link',
    label: '',
    title: '',
    subtitle: '',
    content: '',
    icon_key: '',
    image: '',
    mobile_image: '',
    link_text: '',
    link_url: '',
    target: '_self',
    payload_text: '{}',
    sort_order: 0,
    is_active: true,
};

const tabs = [
    { key: 'main', label: 'Thông tin' },
    { key: 'items', label: 'Mục con' },
    { key: 'images', label: 'Hình ảnh' },
    { key: 'settings', label: 'Nâng cao' },
];

export default function AdminSiteFormModal({ open, componentId = null, onClose, onSaved }) {
    const [form, setForm] = useState(initialForm);
    const [activeTab, setActiveTab] = useState('main');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState('');
    const [actionId, setActionId] = useState(null);

    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [itemForm, setItemForm] = useState(initialItemForm);
    const [itemSaving, setItemSaving] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    const componentKey = String(form.component_key || '').toLowerCase();

    const sortedItems = useMemo(() => {
        return [...(form.items || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    }, [form.items]);

    useEffect(() => {
        if (!open || !componentId) return;

        setActiveTab('main');
        setItemModalOpen(false);
        loadComponent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, componentId]);

    async function loadComponent() {
        try {
            setLoading(true);

            const component = await adminSiteContentService.getComponent(componentId);

            setForm({
                id: component.id,
                page_key: component.pageKey || '',
                page_name: component.pageName || '',
                component_key: component.componentKey || '',
                component_name: component.componentName || '',
                component_type: component.componentType || '',
                title: component.title || '',
                subtitle: component.subtitle || '',
                content: component.content || '',
                image: component.image || '',
                mobile_image: component.mobileImage || '',
                payload_text: JSON.stringify(component.payload || {}, null, 2),
                sort_order: component.sortOrder || 0,
                is_active: Boolean(component.isActive),
                items: Array.isArray(component.items) ? component.items : [],
            });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải nội dung');
            onClose?.();
        } finally {
            setLoading(false);
        }
    }

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function updateItemField(key, value) {
        setItemForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function parseJson(text, fallback = {}) {
        const value = String(text || '').trim();

        if (!value) return fallback;

        try {
            return JSON.parse(value);
        } catch {
            throw new Error('JSON không hợp lệ. Vui lòng kiểm tra lại cấu hình nâng cao.');
        }
    }

    async function handleUploadImage(field, file, target = 'component') {
        if (!file) return;

        const uploadKey = target === 'item' ? `item_${field}` : field;

        try {
            setUploadingField(uploadKey);

            const uploaded = await adminSiteContentService.uploadImage(file, 'site-content');
            const value = uploaded.path || uploaded.url || '';

            if (target === 'item') {
                updateItemField(field, value);
            } else {
                updateField(field, value);
            }

            toast.success('Đã tải ảnh lên');
        } catch (error) {
            toast.error(error?.message || 'Không thể tải ảnh');
        } finally {
            setUploadingField('');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setSaving(true);

            const payload = {
                page_key: form.page_key,
                page_name: form.page_name,
                component_key: form.component_key,
                component_name: form.component_name,
                component_type: form.component_type,
                title: form.title || null,
                subtitle: form.subtitle || null,
                content: form.content || null,
                image: form.image || null,
                mobile_image: form.mobile_image || null,
                payload: parseJson(form.payload_text, {}),
                sort_order: Number(form.sort_order || 0),
                is_active: Boolean(form.is_active),
            };

            await adminSiteContentService.updateComponent(componentId, payload);

            toast.success('Đã lưu nội dung');
            await loadComponent();
            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu nội dung');
        } finally {
            setSaving(false);
        }
    }

    function openCreateItem() {
        setItemForm({
            ...initialItemForm,
            group_key: getDefaultGroupKey(componentKey),
            item_key: `${getDefaultItemKeyPrefix(componentKey)}_${Date.now()}`,
            item_type: getDefaultItemType(componentKey),
            sort_order: sortedItems.length + 1,
            is_active: true,
        });

        setItemModalOpen(true);
    }

    function openEditItem(item) {
        setItemForm({
            id: item.id || null,
            parent_id: item.parentId || '',
            group_key: item.groupKey || '',
            item_key: item.itemKey || '',
            item_type: item.itemType || 'link',
            label: item.label || '',
            title: item.title || '',
            subtitle: item.subtitle || '',
            content: item.content || '',
            icon_key: item.iconKey || '',
            image: item.image || '',
            mobile_image: item.mobileImage || '',
            link_text: item.linkText || '',
            link_url: item.linkUrl || '',
            target: item.target || '_self',
            payload_text: JSON.stringify(item.payload || {}, null, 2),
            sort_order: item.sortOrder || 0,
            is_active: Boolean(item.isActive),
        });

        setItemModalOpen(true);
    }

    async function handleSaveItem(e) {
        e.preventDefault();

        try {
            setItemSaving(true);

            const payload = {
                parent_id: itemForm.parent_id || null,
                group_key: itemForm.group_key || null,
                item_key: itemForm.item_key || null,
                item_type: itemForm.item_type || 'link',
                label: itemForm.label || null,
                title: itemForm.title || null,
                subtitle: itemForm.subtitle || null,
                content: itemForm.content || null,
                icon_key: itemForm.icon_key || null,
                image: itemForm.image || null,
                mobile_image: itemForm.mobile_image || null,
                link_text: itemForm.link_text || null,
                link_url: itemForm.link_url || null,
                target: itemForm.target || '_self',
                payload: parseJson(itemForm.payload_text, {}),
                sort_order: Number(itemForm.sort_order || 0),
                is_active: Boolean(itemForm.is_active),
            };

            if (itemForm.id) {
                await adminSiteContentService.updateItem(itemForm.id, payload);
                toast.success('Đã cập nhật mục con');
            } else {
                await adminSiteContentService.createItem(componentId, payload);
                toast.success('Đã thêm mục con');
            }

            setItemModalOpen(false);
            await loadComponent();
            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu mục con');
        } finally {
            setItemSaving(false);
        }
    }

    function handleDeleteItem(item) {
        const name = item.title || item.label || 'mục này';

        setConfirmDialog({
            open: true,
            title: 'Xóa mục con',
            message: `Bạn muốn xóa "${name}"?`,
            description: 'Mục con đã xóa sẽ không còn hiển thị trong nội dung website.',
            confirmText: 'Xóa mục con',
            type: 'danger',
            onConfirm: async () => {
                await deleteItem(item);
            },
        });
    }

    async function deleteItem(item) {
        try {
            setActionId(item.id);

            await adminSiteContentService.deleteItem(item.id);

            toast.success('Đã xóa mục con');
            await loadComponent();
            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể xóa mục con');
        } finally {
            setActionId(null);
        }
    }

    async function handleToggleItem(item) {
        try {
            setActionId(item.id);

            await adminSiteContentService.toggleItem(item.id);

            toast.success(item.isActive ? 'Đã tắt mục con' : 'Đã bật mục con');
            await loadComponent();
            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setActionId(null);
        }
    }

    async function handleMoveItem(item, direction) {
        const currentIndex = sortedItems.findIndex((row) => row.id === item.id);
        const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sortedItems.length) return;

        const nextItems = [...sortedItems];
        const current = nextItems[currentIndex];

        nextItems[currentIndex] = nextItems[nextIndex];
        nextItems[nextIndex] = current;

        try {
            setActionId(item.id);

            await adminSiteContentService.reorderItems(
                componentId,
                nextItems.map((row, index) => ({
                    id: row.id,
                    sortOrder: index + 1,
                })),
            );

            toast.success('Đã cập nhật thứ tự');
            await loadComponent();
            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể đổi thứ tự');
        } finally {
            setActionId(null);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Sửa {form.component_name || form.title || 'nội dung'}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">Cập nhật nội dung đang hiển thị ngoài website.</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">Đang tải nội dung...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="border-b border-slate-200 px-5 dark:border-slate-800">
                            <div className="flex gap-1 overflow-x-auto py-3">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                            activeTab === tab.key
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {/* {activeTab === 'main' && <MainTab form={form} updateField={updateField} />}

                            {activeTab === 'items' && (
                                <ItemsTab
                                    items={sortedItems}
                                    actionId={actionId}
                                    onCreate={openCreateItem}
                                    onEdit={openEditItem}
                                    onToggle={handleToggleItem}
                                    onDelete={handleDeleteItem}
                                    onMove={handleMoveItem}
                                />
                            )}

                            {activeTab === 'images' && (
                                <ImagesTab
                                    form={form}
                                    updateField={updateField}
                                    uploadingField={uploadingField}
                                    onUpload={handleUploadImage}
                                />
                            )}

                            {activeTab === 'settings' && <SettingsTab form={form} updateField={updateField} />} */}
                            {activeTab === 'main' && (
                                <SmartMainTab
                                    form={form}
                                    updateField={updateField}
                                    uploadingField={uploadingField}
                                    onUpload={handleUploadImage}
                                />
                            )}

                            {activeTab === 'items' && (
                                <SmartItemsTab
                                    componentKey={componentKey}
                                    items={sortedItems}
                                    actionId={actionId}
                                    onCreate={openCreateItem}
                                    onEdit={openEditItem}
                                    onToggle={handleToggleItem}
                                    onDelete={handleDeleteItem}
                                    onMove={handleMoveItem}
                                />
                            )}

                            {activeTab === 'images' && (
                                <ImagesTab
                                    form={form}
                                    updateField={updateField}
                                    uploadingField={uploadingField}
                                    onUpload={handleUploadImage}
                                />
                            )}

                            {activeTab === 'settings' && <SettingsTab form={form} updateField={updateField} />}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                            <p className="text-sm text-slate-500">Nội dung sẽ được áp dụng sau khi bấm lưu.</p>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Đóng
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {itemModalOpen && (
                <ItemEditorModal
                    itemForm={itemForm}
                    setItemForm={setItemForm}
                    updateItemField={updateItemField}
                    saving={itemSaving}
                    uploadingField={uploadingField}
                    onUpload={handleUploadImage}
                    onClose={() => setItemModalOpen(false)}
                    onSubmit={handleSaveItem}
                />
            )}

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

function MainTab({ form, updateField }) {
    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Section title="Thông tin hiển thị">
                <div className="space-y-4">
                    <Field label="Tiêu đề">
                        <input
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Nhập tiêu đề"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Mô tả ngắn">
                        <input
                            value={form.subtitle}
                            onChange={(e) => updateField('subtitle', e.target.value)}
                            placeholder="Nhập mô tả ngắn"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Nội dung">
                        <textarea
                            value={form.content}
                            onChange={(e) => updateField('content', e.target.value)}
                            rows={7}
                            placeholder="Nhập nội dung"
                            className={textareaClass}
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Trạng thái">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {form.is_active ? 'Đang hiển thị' : 'Đang tắt'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">Tắt nếu chưa muốn hiển thị ngoài website.</p>
                    </div>

                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => updateField('is_active', e.target.checked)}
                        className="h-5 w-5"
                    />
                </label>
            </Section>
        </div>
    );
}

function ItemsTab({ items, actionId, onCreate, onEdit, onToggle, onDelete, onMove }) {
    return (
        <Section
            title="Mục con"
            description="Dùng cho slide, link menu, nút bấm hoặc thông tin nhỏ trong khu vực này."
            action={
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    <Plus size={15} />
                    Thêm mục
                </button>
            }
        >
            {items.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Mục</Th>
                                <Th>Loại</Th>
                                <Th>Link</Th>
                                <Th>Trạng thái</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {items.map((item, index) => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    total={items.length}
                                    actionId={actionId}
                                    onEdit={() => onEdit(item)}
                                    onToggle={() => onToggle(item)}
                                    onDelete={() => onDelete(item)}
                                    onMoveUp={() => onMove(item, 'up')}
                                    onMoveDown={() => onMove(item, 'down')}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white">Chưa có mục con</p>
                    <p className="mt-1 text-sm text-slate-500">Thêm slide, link menu hoặc thông tin cần hiển thị.</p>

                    <button
                        type="button"
                        onClick={onCreate}
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <Plus size={15} />
                        Thêm mục đầu tiên
                    </button>
                </div>
            )}
        </Section>
    );
}

function ImagesTab({ form, updateField, uploadingField, onUpload }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Ảnh máy tính" description="Ảnh dùng cho desktop hoặc ảnh chính của khu vực.">
                <ImagePicker
                    value={form.image}
                    uploading={uploadingField === 'image'}
                    onChange={(value) => updateField('image', value)}
                    onUpload={(file) => onUpload('image', file)}
                />
            </Section>

            <Section title="Ảnh điện thoại" description="Có thể bỏ trống nếu muốn dùng chung ảnh máy tính.">
                <ImagePicker
                    value={form.mobile_image}
                    uploading={uploadingField === 'mobile_image'}
                    onChange={(value) => updateField('mobile_image', value)}
                    onUpload={(file) => onUpload('mobile_image', file)}
                />
            </Section>
        </div>
    );
}

function SettingsTab({ form, updateField }) {
    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Section
                title="Cấu hình nâng cao"
                description="Chỉ chỉnh khi bạn chắc chắn khu vực này cần thay đổi mã cấu hình."
            >
                <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Nhóm trang">
                            <input
                                value={form.page_key}
                                onChange={(e) => updateField('page_key', e.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Tên nhóm">
                            <input
                                value={form.page_name}
                                onChange={(e) => updateField('page_name', e.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Mã khu vực">
                            <input
                                value={form.component_key}
                                onChange={(e) => updateField('component_key', e.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Tên khu vực">
                            <input
                                value={form.component_name}
                                onChange={(e) => updateField('component_name', e.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Loại khu vực">
                            <input
                                value={form.component_type}
                                onChange={(e) => updateField('component_type', e.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Thứ tự">
                            <input
                                type="number"
                                value={form.sort_order}
                                onChange={(e) => updateField('sort_order', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <Field label="Payload JSON">
                        <textarea
                            value={form.payload_text}
                            onChange={(e) => updateField('payload_text', e.target.value)}
                            rows={10}
                            className={`${textareaClass} font-mono text-xs`}
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Lưu ý">
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>Phần nâng cao thường dùng cho developer hoặc người quản trị hiểu rõ cấu hình website.</p>

                    <p>Nếu JSON sai định dạng, hệ thống sẽ không cho lưu để tránh lỗi giao diện ngoài website.</p>
                </div>
            </Section>
        </div>
    );
}

function ItemRow({ item, index, total, actionId, onEdit, onToggle, onDelete, onMoveUp, onMoveDown }) {
    return (
        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
            <td className="whitespace-nowrap px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={item.title || item.label || 'Mục'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">—</div>
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="max-w-[240px] truncate font-semibold text-slate-900 dark:text-white">
                            {item.title || item.label || 'Chưa đặt tên'}
                        </p>

                        <p className="max-w-[240px] truncate text-xs text-slate-500">
                            {item.subtitle || item.content || '—'}
                        </p>
                    </div>
                </div>
            </td>

            <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                {getItemTypeText(item.itemType)}
            </td>

            <td className="max-w-[220px] truncate px-4 py-3 text-slate-500">{item.linkUrl || '—'}</td>

            <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge active={item.isActive} />
            </td>

            <td className="whitespace-nowrap px-4 py-3 text-right">
                <div className="flex justify-end gap-1.5">
                    <IconButton disabled={index <= 0 || actionId === item.id} onClick={onMoveUp} title="Đưa lên">
                        <ArrowUp size={15} />
                    </IconButton>

                    <IconButton
                        disabled={index >= total - 1 || actionId === item.id}
                        onClick={onMoveDown}
                        title="Đưa xuống"
                    >
                        <ArrowDown size={15} />
                    </IconButton>

                    <IconButton onClick={onEdit} title="Sửa">
                        <Pencil size={15} />
                    </IconButton>

                    <IconButton
                        disabled={actionId === item.id}
                        onClick={onToggle}
                        title={item.isActive ? 'Tắt' : 'Bật'}
                    >
                        {actionId === item.id ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : item.isActive ? (
                            <EyeOff size={15} />
                        ) : (
                            <Eye size={15} />
                        )}
                    </IconButton>

                    <IconButton danger disabled={actionId === item.id} onClick={onDelete} title="Xóa">
                        <Trash2 size={15} />
                    </IconButton>
                </div>
            </td>
        </tr>
    );
}

function ItemEditorModal({
    itemForm,
    setItemForm,
    updateItemField,
    saving,
    uploadingField,
    onUpload,
    onClose,
    onSubmit,
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3">
            <form
                onSubmit={onSubmit}
                className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {itemForm.id ? 'Sửa mục con' : 'Thêm mục con'}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Cập nhật slide, link menu, nút bấm hoặc thông tin hiển thị.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <Section title="Thông tin mục">
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Loại mục">
                                        <select
                                            value={itemForm.item_type}
                                            onChange={(e) => updateItemField('item_type', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="link">Link / menu</option>
                                            <option value="slide">Slide banner</option>
                                            <option value="button">Nút bấm</option>
                                            <option value="info">Thông tin</option>
                                            <option value="social">Mạng xã hội</option>
                                        </select>
                                    </Field>

                                    {/* <Field label="Nhóm">
                                        <input
                                            value={itemForm.group_key}
                                            onChange={(e) => updateItemField('group_key', e.target.value)}
                                            placeholder="quick_links, social, contact..."
                                            className={inputClass}
                                        />
                                    </Field> */}
                                </div>

                                {/* <Field label="Tên hiển thị"> */}
                                <Field label="Tên menu / tên nút">
                                    <input
                                        value={itemForm.label}
                                        onChange={(e) => updateItemField('label', e.target.value)}
                                        placeholder="Ví dụ: Trang chủ"
                                        className={inputClass}
                                    />
                                </Field>

                                {/* <Field label="Tiêu đề"> */}
                                <Field label="Tiêu đề slide / tiêu đề mục">
                                    <input
                                        value={itemForm.title}
                                        onChange={(e) => updateItemField('title', e.target.value)}
                                        placeholder="Tiêu đề"
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Mô tả ngắn">
                                    <input
                                        value={itemForm.subtitle}
                                        onChange={(e) => updateItemField('subtitle', e.target.value)}
                                        placeholder="Mô tả ngắn"
                                        className={inputClass}
                                    />
                                </Field>

                                {/* <Field label="Nội dung"> */}
                                <Field label="Mô tả">
                                    <textarea
                                        value={itemForm.content}
                                        onChange={(e) => updateItemField('content', e.target.value)}
                                        rows={4}
                                        placeholder="Nội dung"
                                        className={textareaClass}
                                    />
                                </Field>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Chữ trên nút">
                                        <input
                                            value={itemForm.link_text}
                                            onChange={(e) => updateItemField('link_text', e.target.value)}
                                            placeholder="Xem ngay"
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Đường dẫn">
                                        <input
                                            value={itemForm.link_url}
                                            onChange={(e) => updateItemField('link_url', e.target.value)}
                                            placeholder="/shop hoặc https://..."
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Cách mở link">
                                        <select
                                            value={itemForm.target}
                                            onChange={(e) => updateItemField('target', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="_self">Mở trong trang hiện tại</option>
                                            <option value="_blank">Mở tab mới</option>
                                        </select>
                                    </Field>

                                    <Field label="Icon">
                                        <input
                                            value={itemForm.icon_key}
                                            onChange={(e) => updateItemField('icon_key', e.target.value)}
                                            placeholder="home, phone, facebook..."
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </Section>

                        <div className="space-y-5">
                            <Section title="Hình ảnh">
                                <div className="space-y-4">
                                    <ImagePicker
                                        label="Ảnh"
                                        value={itemForm.image}
                                        uploading={uploadingField === 'item_image'}
                                        onChange={(value) => updateItemField('image', value)}
                                        onUpload={(file) => onUpload('image', file, 'item')}
                                    />

                                    <ImagePicker
                                        label="Ảnh mobile"
                                        value={itemForm.mobile_image}
                                        uploading={uploadingField === 'item_mobile_image'}
                                        onChange={(value) => updateItemField('mobile_image', value)}
                                        onUpload={(file) => onUpload('mobile_image', file, 'item')}
                                    />
                                </div>
                            </Section>

                            <Section title="Hiển thị">
                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {itemForm.is_active ? 'Đang hiển thị' : 'Đang tắt'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">Tắt nếu chưa muốn hiển thị.</p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={itemForm.is_active}
                                        onChange={(e) => updateItemField('is_active', e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                </label>
                            </Section>

                            <Section title="Nâng cao">
                                <div className="space-y-4">
                                    <Field label="Mã mục">
                                        <input
                                            value={itemForm.item_key}
                                            onChange={(e) => updateItemField('item_key', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Nhóm hiển thị">
                                        <input
                                            value={itemForm.group_key}
                                            onChange={(e) => updateItemField('group_key', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Thứ tự">
                                        <input
                                            type="number"
                                            value={itemForm.sort_order}
                                            onChange={(e) => updateItemField('sort_order', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Payload JSON">
                                        <textarea
                                            value={itemForm.payload_text}
                                            onChange={(e) =>
                                                setItemForm((prev) => ({
                                                    ...prev,
                                                    payload_text: e.target.value,
                                                }))
                                            }
                                            rows={5}
                                            className={`${textareaClass} font-mono text-xs`}
                                        />
                                    </Field>
                                </div>
                            </Section>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Lưu mục
                    </button>
                </div>
            </form>
        </div>
    );
}

function ImagePicker({ label = 'Ảnh', value, uploading, onChange, onUpload }) {
    return (
        <div className="space-y-2">
            {label && <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                {value ? (
                    <img
                        src={value}
                        alt="Preview"
                        className="h-36 w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="flex h-36 items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
                )}
            </div>

            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="/storage/uploads/site-content/..."
                className={inputClass}
            />

            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                Tải ảnh
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onUpload(e.target.files?.[0])}
                />
            </label>
        </div>
    );
}

function Section({ title, description, action, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                    {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                </div>

                {action}
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            {children}
        </label>
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
                Hiển thị
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Đã tắt
        </span>
    );
}

function IconButton({ children, onClick, disabled, danger = false, title }) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold disabled:opacity-50 ${
                danger
                    ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
        >
            {children}
        </button>
    );
}

function getDefaultItemType(componentKey) {
    if (componentKey === 'hero_slider') return 'slide';
    if (componentKey === 'footer') return 'link';
    if (componentKey === 'bottom_navigation') return 'link';
    if (componentKey === 'mobile_menu') return 'link';

    return 'link';
}

function getDefaultGroupKey(componentKey) {
    const key = String(componentKey || '').toLowerCase();

    if (key === 'navbar') return 'desktop_links';
    if (key === 'mobile_menu') return 'mobile_links';
    if (key === 'bottom_navigation') return 'bottom_items';
    if (key === 'footer') return 'footer_columns';
    if (key === 'hero_slider') return 'hero_slides';

    return '';
}

function getDefaultItemKeyPrefix(componentKey) {
    const key = String(componentKey || '').toLowerCase();

    if (key === 'navbar') return 'desktop_link';
    if (key === 'mobile_menu') return 'mobile_link';
    if (key === 'bottom_navigation') return 'bottom_item';
    if (key === 'footer') return 'footer_item';
    if (key === 'hero_slider') return 'hero_slide';

    return 'item';
}

function getItemTypeText(type) {
    const map = {
        link: 'Link',
        slide: 'Slide',
        button: 'Nút',
        info: 'Thông tin',
        social: 'Mạng xã hội',
    };

    return map[type] || type || 'Mục';
}

function SmartMainTab({ form, updateField, uploadingField, onUpload }) {
    const key = String(form.component_key || '').toLowerCase();

    if (key === 'navbar') {
        return (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Section
                    title="Logo & Header"
                    description="Chỉnh tên website, slogan, logo và nội dung hiển thị trên thanh đầu trang."
                >
                    <div className="space-y-4">
                        <Field label="Tên website">
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Ví dụ: CTUT Shop"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Slogan">
                            <input
                                value={form.subtitle}
                                onChange={(e) => updateField('subtitle', e.target.value)}
                                placeholder="Ví dụ: Cùng nhau phát triển"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Placeholder ô tìm kiếm">
                            <input
                                value={readPayload(form, 'search_placeholder')}
                                onChange={(e) => updatePayloadField(form, updateField, 'search_placeholder', e.target.value)}
                                placeholder="Tìm sản phẩm, khuyến mãi..."
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Placeholder tìm kiếm mobile">
                            <input
                                value={readPayload(form, 'mobile_search_placeholder')}
                                onChange={(e) => updatePayloadField(form, updateField, 'mobile_search_placeholder', e.target.value)}
                                placeholder="Tìm sản phẩm..."
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Logo website">
                    <div className="space-y-4">
                        <ImagePicker
                            label="Logo desktop"
                            value={form.image}
                            uploading={uploadingField === 'image'}
                            onChange={(value) => updateField('image', value)}
                            onUpload={(file) => onUpload('image', file)}
                        />

                        <ImagePicker
                            label="Logo mobile"
                            value={form.mobile_image}
                            uploading={uploadingField === 'mobile_image'}
                            onChange={(value) => updateField('mobile_image', value)}
                            onUpload={(file) => onUpload('mobile_image', file)}
                        />
                    </div>
                </Section>
            </div>
        );
    }

    if (key === 'hero_slider') {
        return (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Section
                    title="Slider trang chủ"
                    description="Chỉnh tiêu đề mặc định và cấu hình chung cho slider. Slide cụ thể nằm ở tab Mục con."
                >
                    <div className="space-y-4">
                        <Field label="Tiêu đề mặc định">
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Tiêu đề slider"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Nhãn nhỏ">
                            <input
                                value={form.subtitle}
                                onChange={(e) => updateField('subtitle', e.target.value)}
                                placeholder="Ví dụ: CTUT Shop"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Mô tả mặc định">
                            <textarea
                                value={form.content}
                                onChange={(e) => updateField('content', e.target.value)}
                                rows={5}
                                placeholder="Mô tả slider"
                                className={textareaClass}
                            />
                        </Field>

                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Lớp phủ ảnh
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Bật để chữ trên banner dễ đọc hơn.
                                </p>
                            </div>

                            <input
                                type="checkbox"
                                checked={Boolean(readPayload(form, 'overlay_enabled', true))}
                                onChange={(e) => updatePayloadField(form, updateField, 'overlay_enabled', e.target.checked)}
                                className="h-5 w-5"
                            />
                        </label>
                    </div>
                </Section>

                <Section title="Ảnh nền mặc định">
                    <div className="space-y-4">
                        <ImagePicker
                            label="Ảnh desktop"
                            value={form.image}
                            uploading={uploadingField === 'image'}
                            onChange={(value) => updateField('image', value)}
                            onUpload={(file) => onUpload('image', file)}
                        />

                        <ImagePicker
                            label="Ảnh mobile"
                            value={form.mobile_image}
                            uploading={uploadingField === 'mobile_image'}
                            onChange={(value) => updateField('mobile_image', value)}
                            onUpload={(file) => onUpload('mobile_image', file)}
                        />
                    </div>
                </Section>
            </div>
        );
    }

    if (key === 'footer') {
        return (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Section
                    title="Thông tin Footer"
                    description="Chỉnh logo, tên website và mô tả cuối trang."
                >
                    <div className="space-y-4">
                        <Field label="Tên website">
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="CTUT Shop"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Slogan">
                            <input
                                value={form.subtitle}
                                onChange={(e) => updateField('subtitle', e.target.value)}
                                placeholder="Cùng nhau phát triển"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Mô tả footer">
                            <textarea
                                value={form.content}
                                onChange={(e) => updateField('content', e.target.value)}
                                rows={6}
                                placeholder="Mô tả ngắn về website"
                                className={textareaClass}
                            />
                        </Field>

                        <Field label="Copyright">
                            <input
                                value={readPayload(form, 'copyright')}
                                onChange={(e) => updatePayloadField(form, updateField, 'copyright', e.target.value)}
                                placeholder="© 2026 CTUT Shop. All rights reserved."
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Logo Footer">
                    <ImagePicker
                        label="Logo"
                        value={form.image}
                        uploading={uploadingField === 'image'}
                        onChange={(value) => updateField('image', value)}
                        onUpload={(file) => onUpload('image', file)}
                    />
                </Section>
            </div>
        );
    }

    if (key === 'bottom_navigation') {
        return (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Section
                    title="Menu dưới mobile"
                    description="Khu vực này dùng cho thanh điều hướng cố định dưới màn hình điện thoại."
                >
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                        Hãy qua tab <b>Mục con</b> để thêm, sửa, bật/tắt hoặc sắp xếp các nút menu dưới mobile.
                    </div>
                </Section>

                <Section title="Trạng thái">
                    <StatusSwitch form={form} updateField={updateField} />
                </Section>
            </div>
        );
    }

    return <MainTab form={form} updateField={updateField} />;
}

function SmartItemsTab({ componentKey, items, actionId, onCreate, onEdit, onToggle, onDelete, onMove }) {
    const config = getItemsConfig(componentKey);

    return (
        <Section
            title={config.title}
            description={config.description}
            action={
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    <Plus size={15} />
                    {config.addText}
                </button>
            }
        >
            {items.length > 0 ? (
                <div className="grid gap-3">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex min-w-0 gap-3">
                                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title || item.label || 'Mục'}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                Không ảnh
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {item.title || item.label || 'Chưa đặt tên'}
                                            </p>

                                            <StatusBadge active={item.isActive} />
                                        </div>

                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                            {item.subtitle || item.content || item.linkUrl || 'Chưa có mô tả'}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            {getFriendlyGroupText(item.groupKey)} · {item.linkUrl || 'Không có link'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                    <IconButton disabled={index <= 0 || actionId === item.id} onClick={() => onMove(item, 'up')} title="Đưa lên">
                                        <ArrowUp size={15} />
                                    </IconButton>

                                    <IconButton disabled={index >= items.length - 1 || actionId === item.id} onClick={() => onMove(item, 'down')} title="Đưa xuống">
                                        <ArrowDown size={15} />
                                    </IconButton>

                                    <IconButton onClick={() => onEdit(item)} title="Sửa">
                                        <Pencil size={15} />
                                    </IconButton>

                                    <IconButton disabled={actionId === item.id} onClick={() => onToggle(item)} title={item.isActive ? 'Tắt' : 'Bật'}>
                                        {actionId === item.id ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : item.isActive ? (
                                            <EyeOff size={15} />
                                        ) : (
                                            <Eye size={15} />
                                        )}
                                    </IconButton>

                                    <IconButton danger disabled={actionId === item.id} onClick={() => onDelete(item)} title="Xóa">
                                        <Trash2 size={15} />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white">{config.emptyTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{config.emptyDescription}</p>

                    <button
                        type="button"
                        onClick={onCreate}
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <Plus size={15} />
                        {config.addText}
                    </button>
                </div>
            )}
        </Section>
    );
}

function StatusSwitch({ form, updateField }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {form.is_active ? 'Đang hiển thị' : 'Đang tắt'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                    Tắt nếu chưa muốn hiển thị ngoài website.
                </p>
            </div>

            <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="h-5 w-5"
            />
        </label>
    );
}

function readPayload(form, key, fallback = '') {
    try {
        const payload = JSON.parse(form.payload_text || '{}');
        return payload?.[key] ?? fallback;
    } catch {
        return fallback;
    }
}

function updatePayloadField(form, updateField, key, value) {
    let payload = {};

    try {
        payload = JSON.parse(form.payload_text || '{}');
    } catch {
        payload = {};
    }

    payload[key] = value;

    updateField('payload_text', JSON.stringify(payload, null, 2));
}

function getItemsConfig(componentKey) {
    const key = String(componentKey || '').toLowerCase();

    if (key === 'navbar') {
        return {
            title: 'Menu đầu trang',
            description: 'Quản lý các link menu hiển thị trên thanh điều hướng desktop.',
            addText: 'Thêm link menu',
            emptyTitle: 'Chưa có link menu',
            emptyDescription: 'Thêm các link như Trang chủ, Cửa hàng, Tin tức, Liên hệ...',
        };
    }

    if (key === 'mobile_menu') {
        return {
            title: 'Menu điện thoại',
            description: 'Quản lý các link hiển thị trong menu mở rộng trên điện thoại.',
            addText: 'Thêm link mobile',
            emptyTitle: 'Chưa có link mobile',
            emptyDescription: 'Thêm các link dành cho giao diện điện thoại.',
        };
    }

    if (key === 'bottom_navigation') {
        return {
            title: 'Nút menu dưới mobile',
            description: 'Quản lý các nút cố định dưới màn hình điện thoại.',
            addText: 'Thêm nút menu',
            emptyTitle: 'Chưa có nút menu',
            emptyDescription: 'Thêm Trang chủ, Cửa hàng, Giỏ hàng, Tài khoản...',
        };
    }

    if (key === 'footer') {
        return {
            title: 'Nội dung Footer',
            description: 'Quản lý cột link, thông tin liên hệ và mạng xã hội ở cuối trang.',
            addText: 'Thêm mục footer',
            emptyTitle: 'Chưa có nội dung footer',
            emptyDescription: 'Thêm cột liên kết, liên hệ hoặc mạng xã hội.',
        };
    }

    if (key === 'hero_slider') {
        return {
            title: 'Danh sách slide',
            description: 'Quản lý các banner lớn trên trang chủ. Mỗi slide nên có ảnh, tiêu đề, mô tả và nút bấm.',
            addText: 'Thêm slide',
            emptyTitle: 'Chưa có slide',
            emptyDescription: 'Thêm slide đầu tiên cho banner trang chủ.',
        };
    }

    return {
        title: 'Mục con',
        description: 'Quản lý các mục hiển thị bên trong khu vực này.',
        addText: 'Thêm mục',
        emptyTitle: 'Chưa có mục con',
        emptyDescription: 'Thêm nội dung cần hiển thị.',
    };
}

function getFriendlyGroupText(groupKey) {
    const key = String(groupKey || '').toLowerCase();

    const map = {
        desktop_links: 'Menu desktop',
        user_menu_links: 'Menu người dùng',
        mobile_links: 'Menu mobile',
        bottom_items: 'Menu dưới mobile',
        footer_columns: 'Cột footer',
        footer_contacts: 'Liên hệ',
        footer_socials: 'Mạng xã hội',
        hero_buttons: 'Nút hero',
        hero_cards: 'Thẻ thông tin',
        hero_slides: 'Slide',
    };

    return map[key] || groupKey || 'Chưa phân nhóm';
}

const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const textareaClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
