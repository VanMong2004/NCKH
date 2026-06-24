import { ImagePlus, Loader2, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { createSlug, mapAdminPromotionToForm } from '../../mappers/adminPromotionMapper';
import adminPromotionService from '../../services/adminPromotionService';

export default function AdminPromotionFormModal({ open, mode = 'create', promotion = null, onClose, onSaved }) {
    const isEdit = mode === 'edit' && promotion?.id;

    const [form, setForm] = useState(mapAdminPromotionToForm());
    const [saving, setSaving] = useState(false);

    const bannerPreview = useFilePreview(form.bannerFile, form.banner);
    const thumbnailPreview = useFilePreview(form.thumbnailFile, form.thumbnail);

    const slugPreview = useMemo(() => {
        return form.slug || createSlug(form.title);
    }, [form.slug, form.title]);

    useEffect(() => {
        if (!open) return;

        setForm(mapAdminPromotionToForm(isEdit ? promotion : null));
    }, [open, isEdit, promotion]);

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function handleTitleChange(value) {
        setForm((prev) => ({
            ...prev,
            title: value,
            slug: createSlug(value),
        }));
    }

    function handleFileChange(key, file) {
        setForm((prev) => ({
            ...prev,
            [key]: file || null,
        }));
    }

    function validateForm() {
        if (!form.title.trim()) {
            toast.warning('Vui lòng nhập tên khuyến mãi');
            return false;
        }

        if (!form.start_date || !form.end_date) {
            toast.warning('Vui lòng nhập thời gian bắt đầu và kết thúc');
            return false;
        }

        if (Number(form.discount_value || 0) <= 0) {
            toast.warning('Giá trị giảm phải lớn hơn 0');
            return false;
        }

        if (form.discount_type === 'percent' && Number(form.discount_value) > 100) {
            toast.warning('Giảm theo phần trăm không được vượt quá 100%');
            return false;
        }

        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSaving(true);

            const payload = {
                ...form,
                slug: form.slug || createSlug(form.title),
            };

            if (isEdit) {
                await adminPromotionService.updatePromotion(promotion.id, payload);
                toast.success('Đã cập nhật khuyến mãi');
            } else {
                await adminPromotionService.createPromotion(payload);
                toast.success('Đã tạo khuyến mãi');
            }

            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu khuyến mãi');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {isEdit ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}
                        </h2>

                        <p className="text-sm text-slate-500">Thiết lập thông tin chính của đợt khuyến mãi.</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Label>Tên khuyến mãi</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="VD: Chào tân sinh viên K2026"
                            />

                            <p className="mt-1 text-xs text-slate-500">
                                Slug tự tạo: <span className="font-semibold">{slugPreview || 'chua-co-slug'}</span>
                            </p>
                        </div>

                        <div>
                            <Label>Loại giảm</Label>
                            <select
                                value={form.discount_type}
                                onChange={(e) => updateField('discount_type', e.target.value)}
                                className={inputClass}
                            >
                                <option value="percent">Theo phần trăm</option>
                                <option value="fixed">Theo số tiền</option>
                            </select>
                        </div>

                        <div>
                            <Label>Giá trị giảm</Label>
                            <Input
                                type="number"
                                min="0"
                                value={form.discount_value}
                                onChange={(e) => updateField('discount_value', e.target.value)}
                                placeholder={form.discount_type === 'percent' ? 'VD: 10' : 'VD: 50000'}
                            />
                        </div>

                        <div>
                            <Label>Ngày bắt đầu</Label>
                            <Input
                                type="datetime-local"
                                value={form.start_date}
                                onChange={(e) => updateField('start_date', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Ngày kết thúc</Label>
                            <Input
                                type="datetime-local"
                                value={form.end_date}
                                onChange={(e) => updateField('end_date', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Trạng thái</Label>
                            <select
                                value={form.status}
                                onChange={(e) => updateField('status', e.target.value)}
                                className={inputClass}
                            >
                                <option value="draft">Bản nháp</option>
                                <option value="active">Đang bật</option>
                                <option value="inactive">Đã tắt</option>
                            </select>
                        </div>

                        <div>
                            <Label>Hiển thị</Label>
                            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => updateField('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                Cho phép hiển thị
                            </label>
                        </div>

                        <FileUploadBox
                            label="Banner"
                            preview={bannerPreview}
                            file={form.bannerFile}
                            oldImage={form.banner}
                            inputId="promotion-banner-file"
                            onChange={(file) => handleFileChange('bannerFile', file)}
                        />

                        <FileUploadBox
                            label="Thumbnail"
                            preview={thumbnailPreview}
                            file={form.thumbnailFile}
                            oldImage={form.thumbnail}
                            inputId="promotion-thumbnail-file"
                            onChange={(file) => handleFileChange('thumbnailFile', file)}
                        />

                        <div className="md:col-span-2">
                            <Label>Mô tả</Label>
                            <textarea
                                value={form.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={4}
                                placeholder="Nhập mô tả ngắn cho chương trình khuyến mãi..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>
                    </div>
                </form>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Lưu khuyến mãi
                    </button>
                </div>
            </div>
        </div>
    );
}

function FileUploadBox({ label, preview, file, oldImage, inputId, onChange }) {
    return (
        <div>
            <Label>{label}</Label>

            <label
                htmlFor={inputId}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-blue-950/20"
            >
                {preview ? (
                    <img
                        src={preview}
                        alt={label}
                        className="h-32 w-full rounded-lg object-cover"
                        onError={(e) => {
                            e.currentTarget.src = '/images/no-image.png';
                        }}
                    />
                ) : (
                    <div className="flex h-32 w-full flex-col items-center justify-center rounded-lg bg-white text-slate-500 dark:bg-slate-900">
                        <ImagePlus size={26} />
                        <span className="mt-2 text-sm font-semibold">Chọn ảnh {label.toLowerCase()}</span>
                    </div>
                )}

                <input
                    id={inputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => onChange(e.target.files?.[0] || null)}
                    className="hidden"
                />
            </label>

            <p className="mt-1 text-xs text-slate-500">
                {file ? `Ảnh mới: ${file.name}` : oldImage ? 'Đang dùng ảnh hiện tại' : 'Chưa chọn ảnh'}
            </p>
        </div>
    );
}

function useFilePreview(file, fallback) {
    const [preview, setPreview] = useState(fallback || '');

    useEffect(() => {
        if (!file) {
            setPreview(fallback || '');
            return undefined;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file, fallback]);

    return preview;
}

function Label({ children }) {
    return <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{children}</label>;
}

function Input(props) {
    return <input {...props} className={inputClass} />;
}

const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
