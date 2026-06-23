import { ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import adminProductService from '../../services/adminProductService';
import { formatMoney } from '../../mappers/adminProductMapper';

const tabs = [
    { key: 'info', label: 'Thông tin' },
    { key: 'images', label: 'Hình ảnh' },
    { key: 'variants', label: 'Giá & tồn kho' },
    { key: 'display', label: 'Hiển thị' },
];

const departmentOptions = [
    { id: 1, name: 'Khoa Công nghệ thông tin', code: 'CNTT' },
    { id: 2, name: 'Khoa Công nghệ thực phẩm và Công nghệ sinh học', code: 'CNTP-CNSH' },
    { id: 3, name: 'Khoa Cơ khí', code: 'CK' },
    { id: 4, name: 'Khoa Điện - Điện tử - Viễn thông', code: 'DDT-VT' },
    { id: 5, name: 'Khoa Xây dựng', code: 'XD' },
    { id: 6, name: 'Khoa Quản lý công nghiệp', code: 'QLCN' },
    { id: 7, name: 'Khoa Khoa học cơ bản', code: 'KHCB' },
];

const initialForm = {
    name: '',
    description: '',
    category_id: '',
    department_id: '',
    author: '',
    is_active: true,
    is_featured: false,
    images: [],
    variants: [
        {
            uid: createUid(),
            id: null,
            sku: '',
            size: '',
            color: '',
            price: '',
            stock: '',
            reservedStock: 0,
            soldStock: 0,
            isNew: true,
        },
    ],
};

export default function AdminProductFormModal({
    open,
    mode = 'create',
    productId = null,
    categories = [],
    onClose,
    onSaved,
}) {
    const isEdit = mode === 'edit' && Boolean(productId);

    const [activeTab, setActiveTab] = useState('info');
    const [form, setForm] = useState(cloneInitialForm());
    const [oldImages, setOldImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const title = isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm';

    const pricePreview = useMemo(() => {
        const prices = form.variants.map((variant) => Number(variant.price || 0)).filter((price) => price > 0);

        if (!prices.length) return 'Chưa có giá';

        const min = Math.min(...prices);
        const max = Math.max(...prices);

        if (min === max) return formatMoney(min);

        return `${formatMoney(min)} - ${formatMoney(max)}`;
    }, [form.variants]);

    const totalStock = useMemo(() => {
        return form.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
    }, [form.variants]);

    const totalReservedStock = useMemo(() => {
        return form.variants.reduce((sum, variant) => sum + Number(variant.reservedStock || 0), 0);
    }, [form.variants]);

    const totalSoldStock = useMemo(() => {
        return form.variants.reduce((sum, variant) => sum + Number(variant.soldStock || 0), 0);
    }, [form.variants]);

    useEffect(() => {
        if (!open) return;

        setActiveTab('info');
        clearNewImages();

        if (isEdit) {
            loadProduct();
        } else {
            setForm(cloneInitialForm());
            setOldImages([]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isEdit, productId]);

    async function loadProduct() {
        try {
            setLoading(true);

            const product = await adminProductService.getProduct(productId);

            setForm({
                name: product.name || '',
                description: product.description || '',
                category_id: product.categoryId || '',
                department_id: product.departmentId || '',
                author: product.author || '',
                is_active: Boolean(product.isActive),
                is_featured: Boolean(product.isFeatured),
                images: [],
                variants:
                    product.variants && product.variants.length > 0
                        ? product.variants.map((variant) => ({
                              uid: createUid(),
                              id: variant.id || null,
                              sku: variant.sku || '',
                              size: variant.size || '',
                              color: variant.color || '',
                              price: variant.price || '',
                              stock: variant.stock || '',
                              reservedStock: Number(variant.reservedStock || 0),
                              soldStock: Number(variant.soldStock || 0),
                              isNew: false,
                          }))
                        : cloneInitialForm().variants,
            });

            setOldImages(product.images || []);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải sản phẩm');
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

    function updateVariant(uid, key, value) {
        setForm((prev) => ({
            ...prev,
            variants: prev.variants.map((variant) =>
                variant.uid === uid
                    ? {
                          ...variant,
                          [key]: value,
                      }
                    : variant,
            ),
        }));
    }

    function addVariant() {
        setForm((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    uid: createUid(),
                    id: null,
                    sku: '',
                    size: '',
                    color: '',
                    price: '',
                    stock: '',
                    reservedStock: 0,
                    soldStock: 0,
                    isNew: true,
                },
            ],
        }));
    }

    function removeVariant(uid) {
        setForm((prev) => {
            const target = prev.variants.find((variant) => variant.uid === uid);

            if (!target) return prev;

            if (target.id) {
                toast.info(
                    'Phân loại đã có trong hệ thống chưa hỗ trợ xóa tại màn hình này. Bạn có thể chỉnh tồn kho.',
                );
                return prev;
            }

            if (prev.variants.length <= 1) {
                toast.warning('Sản phẩm cần ít nhất 1 phân loại giá và tồn kho');
                return prev;
            }

            return {
                ...prev,
                variants: prev.variants.filter((variant) => variant.uid !== uid),
            };
        });
    }

    function clearNewImages() {
        setNewImages((prev) => {
            prev.forEach((image) => {
                if (image.preview) {
                    URL.revokeObjectURL(image.preview);
                }
            });

            return [];
        });
    }

    function handleSelectImages(files) {
        const selectedFiles = Array.from(files || []);

        if (!selectedFiles.length) return;

        setNewImages((prev) => {
            const nextFiles = [...prev];

            selectedFiles.forEach((file) => {
                if (nextFiles.length >= 10) return;

                nextFiles.push({
                    uid: createUid(),
                    file,
                    preview: URL.createObjectURL(file),
                });
            });

            if (prev.length + selectedFiles.length > 10) {
                toast.warning('Chỉ được chọn tối đa 10 ảnh');
            }

            return nextFiles;
        });
    }

    function removeNewImage(uid) {
        setNewImages((prev) => {
            const target = prev.find((image) => image.uid === uid);

            if (target?.preview) {
                URL.revokeObjectURL(target.preview);
            }

            return prev.filter((image) => image.uid !== uid);
        });
    }

    function validateForm() {
        if (!form.name.trim()) {
            toast.error('Vui lòng nhập tên sản phẩm');
            setActiveTab('info');
            return false;
        }

        if (!form.category_id) {
            toast.error('Vui lòng chọn danh mục');
            setActiveTab('info');
            return false;
        }

        if (!isEdit && newImages.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 hình ảnh sản phẩm');
            setActiveTab('images');
            return false;
        }

        if (!form.variants.length) {
            toast.error('Vui lòng thêm ít nhất 1 giá và tồn kho');
            setActiveTab('variants');
            return false;
        }

        for (const [index, variant] of form.variants.entries()) {
            const price = Number(variant.price);
            const stock = Number(variant.stock);
            const reservedStock = Number(variant.reservedStock || 0);
            const soldStock = Number(variant.soldStock || 0);

            if (variant.price === '' || Number.isNaN(price) || price < 0) {
                toast.error(`Giá bán của phân loại #${index + 1} không hợp lệ`);
                setActiveTab('variants');
                return false;
            }

            if (variant.stock === '' || Number.isNaN(stock) || stock < 0) {
                toast.error(`Tồn kho của phân loại #${index + 1} không hợp lệ`);
                setActiveTab('variants');
                return false;
            }

            if (!variant.id && price <= 0) {
                toast.error(`Phân loại mới #${index + 1} cần có giá bán lớn hơn 0`);
                setActiveTab('variants');
                return false;
            }

            if (stock < reservedStock) {
                toast.error(`Tồn kho phân loại #${index + 1} không được nhỏ hơn số lượng đang giữ`);
                setActiveTab('variants');
                return false;
            }

            if (stock < soldStock) {
                toast.error(`Tồn kho phân loại #${index + 1} không được nhỏ hơn số lượng đã bán`);
                setActiveTab('variants');
                return false;
            }
        }

        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSaving(true);

            const payload = {
                name: form.name.trim(),
                description: form.description,
                category_id: form.category_id,
                department_id: form.department_id || '',
                author: form.author,
                is_active: form.is_active,
                is_featured: form.is_featured,
                images: newImages.map((image) => image.file),
                variants: form.variants.map((variant) => ({
                    id: variant.id || undefined,
                    sku: variant.sku,
                    size: variant.size,
                    color: variant.color,
                    price: Number(variant.price || 0),
                    stock: Number(variant.stock || 0),
                })),
            };

            if (isEdit) {
                await adminProductService.updateProduct(productId, payload);
                toast.success('Đã cập nhật sản phẩm');
            } else {
                await adminProductService.createProduct(payload);
                toast.success('Đã thêm sản phẩm');
            }

            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu sản phẩm');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Quản lý thông tin, hình ảnh, giá bán và tồn kho của sản phẩm.
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

                {loading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">Đang tải sản phẩm...</p>
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
                                        className={[
                                            'rounded-lg px-3 py-2 text-sm font-semibold transition',
                                            activeTab === tab.key
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                                        ].join(' ')}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {activeTab === 'info' && (
                                <InfoTab form={form} categories={categories} updateField={updateField} />
                            )}

                            {activeTab === 'images' && (
                                <ImagesTab
                                    isEdit={isEdit}
                                    oldImages={oldImages}
                                    newImages={newImages}
                                    onSelectImages={handleSelectImages}
                                    onRemoveNewImage={removeNewImage}
                                />
                            )}

                            {activeTab === 'variants' && (
                                <VariantsTab
                                    variants={form.variants}
                                    updateVariant={updateVariant}
                                    addVariant={addVariant}
                                    removeVariant={removeVariant}
                                />
                            )}

                            {activeTab === 'display' && (
                                <DisplayTab
                                    form={form}
                                    updateField={updateField}
                                    pricePreview={pricePreview}
                                    totalStock={totalStock}
                                    totalReservedStock={totalReservedStock}
                                    totalSoldStock={totalSoldStock}
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                            <p className="text-sm text-slate-500">
                                {isEdit && newImages.length > 0
                                    ? 'Lưu ý: nếu tải ảnh mới, ảnh sản phẩm cũ sẽ được thay bằng bộ ảnh mới.'
                                    : 'Kiểm tra lại thông tin trước khi lưu.'}
                            </p>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Đóng
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Lưu sản phẩm
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function InfoTab({ form, categories, updateField }) {
    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Section title="Thông tin sản phẩm">
                <div className="space-y-4">
                    <Field label="Tên sản phẩm *">
                        <input
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="Nhập tên sản phẩm"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Danh mục *">
                        <select
                            value={form.category_id}
                            onChange={(e) => updateField('category_id', e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Chọn danh mục</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Mô tả sản phẩm">
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={8}
                            placeholder="Nhập mô tả sản phẩm"
                            className={textareaClass}
                        />
                    </Field>
                </div>
            </Section>

            <Section title="Thông tin phụ">
                <div className="space-y-4">
                    <Field label="Đơn vị / khoa phụ trách">
                        <select
                            value={form.department_id}
                            onChange={(e) => updateField('department_id', e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Không chọn đơn vị</option>
                            {departmentOptions.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.code} - {department.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Tác giả / người phụ trách">
                        <input
                            value={form.author}
                            onChange={(e) => updateField('author', e.target.value)}
                            placeholder="Có thể bỏ trống"
                            className={inputClass}
                        />
                    </Field>

                    <div className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        Danh sách đơn vị đang bám theo bảng departments do backend mới thêm. Khi backend có API riêng,
                        phần này có thể đổi sang load động.
                    </div>
                </div>
            </Section>
        </div>
    );
}

function ImagesTab({ isEdit, oldImages, newImages, onSelectImages, onRemoveNewImage }) {
    return (
        <div className="space-y-5">
            <Section
                title="Hình ảnh sản phẩm"
                description={
                    isEdit
                        ? 'Nếu chọn ảnh mới, hệ thống sẽ thay bộ ảnh hiện tại bằng bộ ảnh mới.'
                        : 'Sản phẩm mới cần ít nhất 1 ảnh. Ảnh đầu tiên sẽ được dùng làm ảnh đại diện.'
                }
            >
                <div className="space-y-4">
                    {isEdit && oldImages.length > 0 && (
                        <div>
                            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Ảnh hiện tại
                            </p>

                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {oldImages.map((image) => (
                                    <div
                                        key={image.id || image.url}
                                        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <img
                                            src={image.url}
                                            alt="Ảnh sản phẩm"
                                            className="h-28 w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/no-image.png';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {isEdit ? 'Ảnh mới' : 'Chọn ảnh'}
                        </p>

                        <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800">
                            <ImagePlus size={24} className="text-slate-400" />

                            <span className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Chọn ảnh sản phẩm
                            </span>

                            <span className="mt-1 text-xs text-slate-500">
                                Có thể chọn nhiều ảnh. Định dạng jpg, png, webp. Tối đa 10 ảnh.
                            </span>

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => onSelectImages(e.target.files)}
                            />
                        </label>
                    </div>

                    {newImages.length > 0 && (
                        <div>
                            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Ảnh đã chọn</p>

                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {newImages.map((image, index) => (
                                    <div
                                        key={image.uid}
                                        className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <img
                                            src={image.preview}
                                            alt={image.file?.name || 'Ảnh mới'}
                                            className="h-28 w-full object-cover"
                                        />

                                        {index === 0 && (
                                            <span className="absolute left-2 top-2 rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                                                Đại diện
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => onRemoveNewImage(image.uid)}
                                            className="absolute right-2 top-2 rounded bg-white/90 p-1 text-red-600 shadow hover:bg-white"
                                            title="Bỏ ảnh"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}

function VariantsTab({ variants, updateVariant, addVariant, removeVariant }) {
    return (
        <Section
            title="Giá bán và tồn kho"
            description="Mỗi dòng là một phân loại của sản phẩm, ví dụ theo size, màu hoặc phiên bản."
            action={
                <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    <Plus size={15} />
                    Thêm phân loại
                </button>
            }
        >
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="min-w-[980px] divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr>
                            <Th>SKU</Th>
                            <Th>Size</Th>
                            <Th>Màu</Th>
                            <Th>Giá bán *</Th>
                            <Th>Tồn kho *</Th>
                            <Th className="text-center">Đang giữ</Th>
                            <Th className="text-center">Đã bán</Th>
                            <Th className="text-right">Thao tác</Th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        {variants.map((variant) => (
                            <tr key={variant.uid}>
                                <td className="px-3 py-3">
                                    <input
                                        value={variant.sku}
                                        onChange={(e) => updateVariant(variant.uid, 'sku', e.target.value)}
                                        placeholder="Tự tạo nếu bỏ trống"
                                        className={tableInputClass}
                                    />
                                </td>

                                <td className="px-3 py-3">
                                    <input
                                        value={variant.size}
                                        onChange={(e) => updateVariant(variant.uid, 'size', e.target.value)}
                                        placeholder="S, M, L..."
                                        className={tableInputClass}
                                    />
                                </td>

                                <td className="px-3 py-3">
                                    <input
                                        value={variant.color}
                                        onChange={(e) => updateVariant(variant.uid, 'color', e.target.value)}
                                        placeholder="Đỏ, xanh..."
                                        className={tableInputClass}
                                    />
                                </td>

                                <td className="px-3 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={variant.price}
                                        onChange={(e) => updateVariant(variant.uid, 'price', e.target.value)}
                                        className={tableInputClass}
                                    />
                                </td>

                                <td className="px-3 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={variant.stock}
                                        onChange={(e) => updateVariant(variant.uid, 'stock', e.target.value)}
                                        className={tableInputClass}
                                    />
                                </td>

                                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">
                                    {variant.reservedStock || 0}
                                </td>

                                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">
                                    {variant.soldStock || 0}
                                </td>

                                <td className="whitespace-nowrap px-3 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(variant.uid)}
                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 size={14} />
                                        Bỏ
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="mt-3 text-sm text-slate-500">Tồn kho mới không được nhỏ hơn số lượng đang giữ hoặc đã bán.</p>
        </Section>
    );
}

function DisplayTab({ form, updateField, pricePreview, totalStock, totalReservedStock, totalSoldStock }) {
    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Section title="Hiển thị trên website">
                <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {form.is_active ? 'Đang bán' : 'Đang ẩn'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tắt nếu chưa muốn sản phẩm hiển thị ngoài website.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => updateField('is_active', e.target.checked)}
                            className="h-5 w-5"
                        />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Sản phẩm nổi bật</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Dùng để ưu tiên hiển thị ở các khu vực nổi bật.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(e) => updateField('is_featured', e.target.checked)}
                            className="h-5 w-5"
                        />
                    </label>
                </div>
            </Section>

            <Section title="Tóm tắt">
                <div className="space-y-3 text-sm">
                    <SummaryLine label="Giá bán" value={pricePreview} />
                    <SummaryLine label="Tổng tồn kho" value={totalStock} />
                    <SummaryLine label="Đang giữ" value={totalReservedStock} />
                    <SummaryLine label="Đã bán" value={totalSoldStock} />
                    <SummaryLine label="Trạng thái" value={form.is_active ? 'Đang bán' : 'Đang ẩn'} />
                    <SummaryLine label="Nổi bật" value={form.is_featured ? 'Có' : 'Không'} />
                </div>
            </Section>
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
            className={`whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}
        >
            {children}
        </th>
    );
}

function SummaryLine({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
        </div>
    );
}

function createUid() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneInitialForm() {
    return {
        ...initialForm,
        variants: [
            {
                uid: createUid(),
                id: null,
                sku: '',
                size: '',
                color: '',
                price: '',
                stock: '',
                reservedStock: 0,
                soldStock: 0,
                isNew: true,
            },
        ],
    };
}

const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const textareaClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const tableInputClass =
    'h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
