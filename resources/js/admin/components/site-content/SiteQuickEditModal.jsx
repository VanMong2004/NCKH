import { ImagePlus, Loader2, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import adminSiteContentService from '../../services/adminSiteContentService';

export default function SiteQuickEditModal({
    open,
    type,
    component,
    item = null,
    onClose,
    onSaved,
}) {
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!open) return;

        if (item) {
            setForm({
                label: item.label || '',
                title: item.title || '',
                subtitle: item.subtitle || '',
                content: item.content || '',
                image: item.image || '',
                mobile_image: item.mobileImage || item.mobile_image || '',
                link_text: item.linkText || item.link_text || '',
                link_url: item.linkUrl || item.link_url || '',
                is_active: Boolean(item.isActive),
            });
        } else {
            setForm({
                title: component?.title || '',
                subtitle: component?.subtitle || '',
                content: component?.content || '',
                image: component?.image || '',
                mobile_image: component?.mobileImage || component?.mobile_image || '',
                payload: component?.payload || {},
                is_active: Boolean(component?.isActive),
                deleted_slide_ids: [],
                slides: Array.isArray(component?.items)
                    ? component.items
                        .filter((item) => (item.groupKey || item.group_key) === 'hero_slides')
                        .map((item) => ({
                            id: item.id || null,
                            item_key: item.itemKey || item.item_key || '',
                            title: item.title || '',
                            subtitle: item.subtitle || '',
                            content: item.content || '',
                            image: item.image || '',
                            mobile_image: item.mobileImage || item.mobile_image || '',
                            link_text: item.linkText || item.link_text || '',
                            link_url: item.linkUrl || item.link_url || '/shop',
                            sort_order: item.sortOrder || item.sort_order || 0,
                            is_active: item.isActive ?? item.is_active ?? true,
                        }))
                    : [],
            });
        }
    }, [open, component, item]);

    const title = useMemo(() => {
        if (type === 'navbar-logo') return 'Chỉnh logo website';
        if (type === 'navbar-text') return 'Chỉnh tên website';
        if (type === 'navbar-menu') return 'Chỉnh menu';
        if (type === 'hero-slide') return 'Chỉnh slide';
        if (type === 'auth-banner') return 'Chỉnh banner đăng nhập/đăng ký';
        if (type === 'hero-slides-manager') return 'Quản lý slider trang chủ';
        if (type === 'footer-brand') return 'Chỉnh footer';
        return 'Chỉnh nội dung';
    }, [type]);

    if (!open) return null;

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    async function uploadImage(file) {
        if (!file) return null;

        try {
            setUploading(true);

            const uploaded = await adminSiteContentService.uploadImage(file, 'site-content');

            toast.success('Đã tải ảnh lên');

            return uploaded;
        } catch (error) {
            toast.error(error?.message || 'Không thể tải ảnh');
            throw error;
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setSaving(true);

            if (type === 'hero-slides-manager') {
                const deletedSlideIds = Array.isArray(form.deleted_slide_ids)
                    ? form.deleted_slide_ids
                    : [];

                for (const id of deletedSlideIds) {
                    await adminSiteContentService.deleteItem(id);
                }

                const slides = Array.isArray(form.slides) ? form.slides : [];

                for (let index = 0; index < slides.length; index++) {
                    const slide = slides[index];

                    const payload = {
                        parent_id: null,
                        group_key: 'hero_slides',
                        item_key: slide.item_key || `hero_slide_${Date.now()}_${index}`,
                        item_type: 'slide',
                        title: slide.title || null,
                        subtitle: slide.subtitle || null,
                        content: slide.content || null,
                        image: slide.image || null,
                        mobile_image: slide.mobile_image || null,
                        link_text: slide.link_text || null,
                        link_url: slide.link_url || null,
                        target: '_self',
                        payload: {},
                        sort_order: index + 1,
                        is_active: Boolean(slide.is_active),
                    };

                    if (slide.id) {
                        await adminSiteContentService.updateItem(slide.id, payload);
                    } else {
                        await adminSiteContentService.createItem(component.id, payload);
                    }
                }

                toast.success('Đã cập nhật slider');
                onSaved?.();
                onClose?.();
                // setSaving(false);
                return;
            }

            if (item?.id) {
                await adminSiteContentService.updateItem(item.id, {
                    label: form.label || null,
                    title: form.title || null,
                    subtitle: form.subtitle || null,
                    content: form.content || null,
                    image: form.image || null,
                    mobile_image: form.mobile_image || null,
                    link_text: form.link_text || null,
                    link_url: form.link_url || null,
                    is_active: Boolean(form.is_active),
                });
            } else {
                await adminSiteContentService.updateComponent(component.id, {
                    page_key: component.pageKey || component.page_key || 'home',
                    page_name: component.pageName || component.page_name || 'Trang chủ',
                    component_key: component.componentKey || component.component_key,
                    component_name: component.componentName || component.component_name || 'Nội dung website',
                    component_type: component.componentType || component.component_type || 'section',

                    title: form.title || null,
                    subtitle: form.subtitle || null,
                    content: form.content || null,
                    image: form.image || null,
                    mobile_image: form.mobile_image || null,
                    payload: form.payload || {},
                    sort_order: Number(component.sortOrder || component.sort_order || 0),
                    is_active: Boolean(form.is_active),
                });
            }

            toast.success('Đã cập nhật nội dung');
            onSaved?.();
            onClose?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu nội dung');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3">
            <form
                onSubmit={handleSubmit}
                className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="flex min-h-0 flex-col border-r border-slate-200 dark:border-slate-800">
                        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Chỉnh bên trái, xem trước bên phải. Bấm hoàn tất mới lưu.
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

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {type === 'navbar-logo' && (
                                <LogoFields form={form} updateField={updateField} uploadImage={uploadImage} uploading={uploading} />
                            )}

                            {type === 'navbar-text' && (
                                <TextFields form={form} updateField={updateField} />
                            )}

                            {type === 'hero-slide' && (
                                <SlideFields form={form} updateField={updateField} uploadImage={uploadImage} uploading={uploading} />
                            )}

                            {type === 'auth-banner' && (
                                <AuthBannerFields
                                    form={form}
                                    updateField={updateField}
                                    uploadImage={uploadImage}
                                    uploading={uploading}
                                />
                            )}

                            {type === 'hero-slides-manager' && (
                                <SlidesManagerFields
                                    component={component}
                                    form={form}
                                    setForm={setForm}
                                    uploadImage={uploadImage}
                                    uploading={uploading}
                                />
                            )}

                            {type === 'footer-brand' && (
                                <FooterFields form={form} updateField={updateField} uploadImage={uploadImage} uploading={uploading} />
                            )}
                        </div>

                        <div className="shrink-0 flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            >
                                Hủy
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Hoàn tất
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 overflow-y-auto bg-slate-100 p-5 dark:bg-slate-950">
                        <QuickPreview type={type} form={form} component={component} item={item} />
                    </div>
                </div>
            </form>
        </div>
    );
}

function LogoFields({ form, updateField, uploadImage, uploading }) {
    return (
        <div className="space-y-5">
            <ImageInput
                label="Logo desktop"
                value={form.image || ''}
                uploading={uploading}
                onChange={(value) => updateField('image', value)}
                onUpload={async (file) => {
                    const uploaded = await uploadImage(file);

                    updateField(
                        'image',
                        uploaded?.path || uploaded?.url || ''
                    );
                }}
            />

            <ImageInput
                label="Logo mobile"
                value={form.mobile_image || ''}
                uploading={uploading}
                onChange={(value) => updateField('mobile_image', value)}
                onUpload={async (file) => {
                    const uploaded = await uploadImage(file);

                    updateField(
                        'image',
                        uploaded?.path || uploaded?.url || ''
                    );
                }}
            />
        </div>
    );
}

function TextFields({ form, updateField }) {
    return (
        <div className="space-y-4">
            <Field label="Tên website">
                <input
                    value={form.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={inputClass}
                />
            </Field>

            <Field label="Slogan">
                <input
                    value={form.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className={inputClass}
                />
            </Field>
        </div>
    );
}

function SlideFields({ form, updateField, uploadImage, uploading }) {
    return (
        <div className="space-y-4">
            <ImageInput
                label="Ảnh slide"
                value={form.image || ''}
                uploading={uploading}
                onChange={(value) => updateField('image', value)}
                onUpload={async (file) => {
                    const uploaded = await uploadImage(file);

                    updateField(
                        'image',
                        uploaded?.path || uploaded?.url || ''
                    );
                }}
            />

            <Field label="Nhãn nhỏ">
                <input value={form.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Tiêu đề">
                <input value={form.title || ''} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Mô tả">
                <textarea value={form.content || ''} onChange={(e) => updateField('content', e.target.value)} rows={4} className={textareaClass} />
            </Field>

            <Field label="Chữ nút">
                <input value={form.link_text || ''} onChange={(e) => updateField('link_text', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Đường dẫn nút">
                <input value={form.link_url || ''} onChange={(e) => updateField('link_url', e.target.value)} className={inputClass} />
            </Field>
        </div>
    );
}

function FooterFields({ form, updateField, uploadImage, uploading }) {
    return (
        <div className="space-y-4">
            <ImageInput
                label="Logo footer"
                value={form.image || ''}
                uploading={uploading}
                onChange={(value) => updateField('image', value)}
                onUpload={async (file) => {
                    const uploaded = await uploadImage(file);

                    updateField(
                        'image',
                        uploaded?.path || uploaded?.url || ''
                    );
                }}
            />

            <Field label="Tên website">
                <input value={form.title || ''} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Slogan">
                <input value={form.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Mô tả footer">
                <textarea value={form.content || ''} onChange={(e) => updateField('content', e.target.value)} rows={5} className={textareaClass} />
            </Field>
        </div>
    );
}

function QuickPreview({ type, form }) {
    if (type === 'navbar-logo' || type === 'navbar-text') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <img
                        src={form.image || '/images/logo.png'}
                        alt="Logo"
                        className="h-12 w-12 rounded-lg object-cover"
                    />

                    <div>
                        <p className="font-black text-blue-950 dark:text-white">
                            {form.title || 'CTUT Shop'}
                        </p>
                        <p className="text-sm text-slate-500">
                            {form.subtitle || 'Cùng nhau phát triển'}
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-400 dark:border-slate-700">
                    Tìm sản phẩm, khuyến mãi...
                </div>

                <div className="mt-4 flex gap-4 text-sm font-semibold text-blue-950 dark:text-slate-100">
                    <span>Trang chủ</span>
                    <span>Sản phẩm</span>
                    <span>Khuyến mãi</span>
                    <span>Blog</span>
                </div>
            </div>
        );
    }

    if (type === 'hero-slides-manager') {
        const slides = Array.isArray(form.slides)
            ? form.slides
            : [];

        const activeSlide =
            slides.find((item) => item.is_active)
            || slides[0]
            || {};

        return (
            <div className="space-y-4">
                <div className="relative h-[420px] overflow-hidden rounded-2xl bg-slate-950">
                    <img
                        src={activeSlide.image || '/images/no-image.png'}
                        alt={activeSlide.title || 'Slide'}
                        className="h-full w-full object-cover opacity-80"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/60 to-transparent" />

                    <div className="absolute inset-0 flex items-center px-8">
                        <div className="max-w-2xl">
                            <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                                {activeSlide.subtitle || 'CTUT Shop'}
                            </span>

                            <h2 className="mt-4 text-4xl font-black text-white">
                                {activeSlide.title || 'Tiêu đề slide'}
                            </h2>

                            <p className="mt-4 text-sm leading-6 text-white/85">
                                {activeSlide.content || 'Mô tả slide sẽ hiển thị ở đây.'}
                            </p>

                            <div className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950">
                                {activeSlide.link_text || 'Xem cửa hàng'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-2">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id || slide.item_key || index}
                            className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm dark:bg-slate-900"
                        >
                            <div className="h-12 w-20 overflow-hidden rounded-lg bg-slate-200">
                                {slide.image ? (
                                    <img src={slide.image} alt="" className="h-full w-full object-cover" />
                                ) : null}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900 dark:text-white">
                                    {slide.title || `Slide ${index + 1}`}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {slide.is_active ? 'Đang hiển thị' : 'Đã tắt'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'hero-slide') {
        return (
            <div className="relative h-[420px] overflow-hidden rounded-2xl bg-slate-950">
                <img
                    src={form.image || '/images/no-image.png'}
                    alt={form.title || 'Slide'}
                    className="h-full w-full object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/60 to-transparent" />

                <div className="absolute inset-0 flex items-center px-8">
                    <div className="max-w-2xl">
                        <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                            {form.subtitle || 'CTUT Shop'}
                        </span>

                        <h2 className="mt-4 text-4xl font-black text-white">
                            {form.title || 'Tiêu đề slide'}
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-white/85">
                            {form.content || 'Mô tả slide sẽ hiển thị ở đây.'}
                        </p>

                        <div className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950">
                            {form.link_text || 'Xem cửa hàng'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'auth-banner') {
        return (
            <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-blue-950">
                <img
                    src={form.image || '/images/system/auth-banner.jpg'}
                    alt={form.title || 'Auth banner'}
                    className="absolute inset-0 h-full w-full object-cover opacity-50"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/80 to-transparent" />

                <div className="relative z-10 flex min-h-[420px] items-center px-8">
                    <div className="max-w-xl text-white">
                        <p className="text-sm font-black uppercase tracking-wider text-blue-100">
                            {form.subtitle || 'Chào mừng bạn quay lại'}
                        </p>

                        <h2 className="mt-4 text-4xl font-black">
                            {form.title || 'Đăng nhập CTUT Shop'}
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-white/80">
                            {form.content || 'Mô tả auth banner sẽ hiển thị ở đây.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'footer-brand') {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <img src={form.image || '/images/logo.png'} alt="Logo" className="h-12 w-12 rounded-lg object-cover" />

                    <div>
                        <p className="font-black text-blue-950 dark:text-white">{form.title || 'CTUT Shop'}</p>
                        <p className="text-sm text-slate-500">{form.subtitle || 'Cùng nhau phát triển'}</p>
                    </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-500">
                    {form.content || 'Mô tả footer sẽ hiển thị ở đây.'}
                </p>
            </div>
        );
    }

    return null;
}

function ImageInput({ label, value = '', uploading, onChange, onUpload }) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                {value ? (
                    <img src={value} alt="Preview" className="h-36 w-full object-cover" />
                ) : (
                    <div className="flex h-36 items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
                )}
            </div>

            <input
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="/storage/uploads/site-content/..."
                className={inputClass}
            />

            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                Tải ảnh
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
            </label>
        </div>
    );
}

function SlidesManagerFields({ form, setForm, uploadImage, uploading }) {
    const slides = Array.isArray(form.slides) ? form.slides : [];

    function updateSlide(index, key, value) {
        setForm((prev) => {
            const nextSlides = [...(prev.slides || [])];

            nextSlides[index] = {
                ...nextSlides[index],
                [key]: value,
            };

            return {
                ...prev,
                slides: nextSlides,
            };
        });
    }

    function addSlide() {
        setForm((prev) => ({
            ...prev,
            slides: [
                ...(prev.slides || []),
                {
                    id: null,
                    item_key: `hero_slide_${Date.now()}`,
                    title: '',
                    subtitle: 'CTUT Shop',
                    content: '',
                    image: '',
                    mobile_image: '',
                    link_text: 'Xem cửa hàng',
                    link_url: '/shop',
                    sort_order: (prev.slides || []).length + 1,
                    is_active: true,
                },
            ],
        }));
    }

    function removeSlide(index) {
        setForm((prev) => {
            const slides = prev.slides || [];
            const removed = slides[index];

            return {
                ...prev,
                deleted_slide_ids: removed?.id
                    ? [...(prev.deleted_slide_ids || []), removed.id]
                    : (prev.deleted_slide_ids || []),
                slides: slides.filter((_, i) => i !== index),
            };
        });
    }

    async function uploadSlideImage(index, file, field = 'image') {
        if (!file) return;

        try {
            const uploaded = await uploadImage(file);

            const value = uploaded?.path || uploaded?.url || '';

            if (!value) {
                toast.error('Upload thành công nhưng không nhận được đường dẫn ảnh');
                return;
            }

            updateSlide(index, field, value);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải ảnh slide');
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-bold text-slate-900 dark:text-white">Danh sách slide</p>
                    <p className="text-sm text-slate-500">
                        Thêm nhiều ảnh banner, sửa tiêu đề, mô tả và nút bấm.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addSlide}
                    className="h-9 rounded-lg bg-blue-950 px-3 text-sm font-bold text-white"
                >
                    Thêm slide
                </button>
            </div>

            {slides.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Chưa có slide. Bấm “Thêm slide” để tạo banner đầu tiên.
                </div>
            ) : (
                slides.map((slide, index) => (
                    <div
                        key={slide.id || slide.item_key || index}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <p className="font-bold text-slate-900 dark:text-white">
                                Slide {index + 1}
                            </p>

                            <button
                                type="button"
                                onClick={() => removeSlide(index)}
                                className="text-sm font-bold text-red-500"
                            >
                                Xóa
                            </button>
                        </div>

                        <ImageInput
                            label="Ảnh banner"
                            value={slide.image || ''}
                            uploading={uploading}
                            onChange={(value) => updateSlide(index, 'image', value)}
                            onUpload={(file) => uploadSlideImage(index, file, 'image')}
                        />

                        <div className="mt-4 space-y-3">
                            <Field label="Nhãn nhỏ">
                                <input
                                    value={slide.subtitle || ''}
                                    onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Tiêu đề">
                                <input
                                    value={slide.title || ''}
                                    onChange={(e) => updateSlide(index, 'title', e.target.value)}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Mô tả">
                                <textarea
                                    value={slide.content || ''}
                                    onChange={(e) => updateSlide(index, 'content', e.target.value)}
                                    rows={3}
                                    className={textareaClass}
                                />
                            </Field>

                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Chữ nút">
                                    <input
                                        value={slide.link_text || ''}
                                        onChange={(e) => updateSlide(index, 'link_text', e.target.value)}
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Đường dẫn">
                                    <input
                                        value={slide.link_url || ''}
                                        onChange={(e) => updateSlide(index, 'link_url', e.target.value)}
                                        className={inputClass}
                                    />
                                </Field>
                            </div>

                            <button
                                type="button"
                                onClick={() => updateSlide(index, 'is_active', !slide.is_active)}
                                className={`h-9 rounded-lg px-3 text-sm font-bold ${
                                    slide.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {slide.is_active ? 'Đang bật' : 'Đang tắt'}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function AuthBannerFields({ form, updateField, uploadImage, uploading }) {
    return (
        <div className="space-y-4">
            <ImageInput
                label="Ảnh auth banner"
                value={form.image || ''}
                uploading={uploading}
                onChange={(value) => updateField('image', value)}
                onUpload={async (file) => {
                    const uploaded = await uploadImage(file);

                    updateField(
                        'image',
                        uploaded?.path || uploaded?.url || ''
                    );
                }}
            />

            <Field label="Tiêu đề">
                <input
                    value={form.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={inputClass}
                />
            </Field>

            <Field label="Dòng phụ">
                <input
                    value={form.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className={inputClass}
                />
            </Field>

            <Field label="Mô tả">
                <textarea
                    value={form.content || ''}
                    onChange={(e) => updateField('content', e.target.value)}
                    rows={5}
                    className={textareaClass}
                />
            </Field>
        </div>
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

const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const textareaClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';