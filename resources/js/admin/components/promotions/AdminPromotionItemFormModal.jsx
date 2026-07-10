import { Check, Loader2, PackagePlus, Search, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { formatMoney } from '../../mappers/adminPromotionMapper';
import adminPromotionService from '../../services/adminPromotionService';

const emptyForm = {
    discount_type: 'percent',
    discount_value: '',
    limit_quantity: '',
    is_active: true,
};

export default function AdminPromotionItemFormModal({
    open,
    mode = 'create',
    promotionId,
    item = null,
    onClose,
    onSaved,
}) {
    const isEdit = mode === 'edit' && item?.id;

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [selectedMap, setSelectedMap] = useState({});

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const selectedItems = useMemo(() => {
        return Object.values(selectedMap);
    }, [selectedMap]);

    useEffect(() => {
        if (!open) return;

        if (isEdit) {
            setForm({
                discount_type: item.discountType || 'percent',
                discount_value: item.discountValue || '',
                limit_quantity: item.limitQuantity || '',
                is_active: Boolean(item.isActive),
            });
        } else {
            setForm(emptyForm);
            setSelectedMap({});
            setKeyword('');
            setDebouncedKeyword('');
        }
    }, [open, isEdit, item]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        if (!open || isEdit || !promotionId) return;

        loadAvailableProducts(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isEdit, promotionId, debouncedKeyword]);

    async function loadAvailableProducts(page = 1) {
        try {
            setLoadingProducts(true);

            const result = await adminPromotionService.getAvailableProducts(promotionId, {
                keyword: debouncedKeyword || undefined,
                page,
                per_page: 10,
            });

            setProducts(result.products || []);
            setMeta(
                result.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage: 10,
                    total: 0,
                },
            );
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách sản phẩm có thể thêm');
        } finally {
            setLoadingProducts(false);
        }
    }

    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function toggleVariant(product, variant) {
        if (variant.alreadyAdded) return;

        const key = String(variant.id);

        setSelectedMap((prev) => {
            if (prev[key]) {
                const next = { ...prev };
                delete next[key];
                return next;
            }

            return {
                ...prev,
                [key]: {
                    product_id: product.id,
                    product_variant_id: variant.id,
                    productName: product.name,
                    variantLabel: variant.label,
                },
            };
        });
    }

    function toggleAllProductVariants(product) {
        const availableVariants = product.variants.filter((variant) => !variant.alreadyAdded);

        if (availableVariants.length === 0) return;

        const allSelected = availableVariants.every((variant) => selectedMap[String(variant.id)]);

        setSelectedMap((prev) => {
            const next = { ...prev };

            availableVariants.forEach((variant) => {
                const key = String(variant.id);

                if (allSelected) {
                    delete next[key];
                } else {
                    next[key] = {
                        product_id: product.id,
                        product_variant_id: variant.id,
                        productName: product.name,
                        variantLabel: variant.label,
                    };
                }
            });

            return next;
        });
    }

    function validateForm() {
        if (Number(form.discount_value || 0) <= 0) {
            toast.warning('Vui lòng nhập giá trị giảm lớn hơn 0');
            return false;
        }

        if (form.discount_type === 'percent' && Number(form.discount_value) > 100) {
            toast.warning('Giảm theo phần trăm không được vượt quá 100%');
            return false;
        }

        if (form.limit_quantity !== '' && Number(form.limit_quantity) <= 0) {
            toast.warning('Giới hạn số lượng phải lớn hơn 0');
            return false;
        }

        if (!isEdit && selectedItems.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một phân loại sản phẩm');
            return false;
        }

        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSaving(true);

            if (isEdit) {
                await adminPromotionService.updatePromotionItem(item.id, {
                    product_id: item.productId,
                    product_variant_id: item.productVariantId || null,
                    discount_type: form.discount_type,
                    discount_value: form.discount_value,
                    limit_quantity: form.limit_quantity,
                    is_active: form.is_active,
                });

                toast.success('Đã cập nhật sản phẩm khuyến mãi');
            } else {
                const items = selectedItems.map((selected) => ({
                    product_id: selected.product_id,
                    product_variant_id: selected.product_variant_id,
                    discount_type: form.discount_type,
                    discount_value: form.discount_value,
                    limit_quantity: form.limit_quantity,
                    is_active: form.is_active,
                }));

                const result = await adminPromotionService.createPromotionItemsBulk(promotionId, {
                    items,
                });

                const skippedCount = Number(result?.data?.skipped_count || 0);

                if (skippedCount > 0) {
                    const skippedReason = result?.data?.skipped?.[0]?.reason;
                    toast.warning(skippedReason || result.message || 'Một số sản phẩm không được thêm vào khuyến mãi');
                } else {
                    toast.success(result.message || 'Đã thêm sản phẩm vào khuyến mãi');
                }
            }

            onSaved?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu sản phẩm khuyến mãi');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {isEdit ? 'Sửa sản phẩm khuyến mãi' : 'Thêm sản phẩm vào khuyến mãi'}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {isEdit
                                ? 'Cập nhật mức giảm, giới hạn và trạng thái áp dụng.'
                                : 'Chọn sản phẩm/phân loại đang bán rồi nhập thông tin giảm giá.'}
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

                <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-5">
                    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="space-y-4">
                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <h3 className="font-bold text-slate-900 dark:text-white">Thông tin giảm giá</h3>

                                <div className="mt-4 space-y-4">
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
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.discount_value}
                                            onChange={(e) => updateField('discount_value', e.target.value)}
                                            placeholder={form.discount_type === 'percent' ? 'VD: 10' : 'VD: 50000'}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <Label>Giới hạn số lượng</Label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.limit_quantity}
                                            onChange={(e) => updateField('limit_quantity', e.target.value)}
                                            placeholder="Bỏ trống nếu không giới hạn"
                                            className={inputClass}
                                        />
                                    </div>

                                    <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => updateField('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300"
                                        />
                                        Đang áp dụng
                                    </label>
                                </div>
                            </div>

                            {!isEdit && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                                        Đã chọn: {selectedItems.length} phân loại
                                    </p>

                                    {selectedItems.length > 0 && (
                                        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                                            {selectedItems.map((selected) => (
                                                <div
                                                    key={selected.product_variant_id}
                                                    className="rounded-lg bg-white p-2 text-xs dark:bg-slate-900"
                                                >
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {selected.productName}
                                                    </p>
                                                    <p className="mt-0.5 text-slate-500">{selected.variantLabel}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </aside>

                        <section>
                            {isEdit ? (
                                <EditItemInfo item={item} />
                            ) : (
                                <>
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="relative flex-1">
                                            <Search
                                                size={16}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                value={keyword}
                                                onChange={(e) => setKeyword(e.target.value)}
                                                placeholder="Tìm sản phẩm đang bán..."
                                                className={`${inputClass} pl-9`}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => loadAvailableProducts(meta.currentPage)}
                                            disabled={loadingProducts}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            {loadingProducts ? <Loader2 size={16} className="animate-spin" /> : null}
                                            Tải lại
                                        </button>
                                    </div>

                                    {loadingProducts ? (
                                        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="text-center">
                                                <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                                                <p className="mt-3 text-sm text-slate-500">
                                                    Đang tải danh sách sản phẩm...
                                                </p>
                                            </div>
                                        </div>
                                    ) : products.length > 0 ? (
                                        <div className="space-y-3">
                                            {products.map((product) => (
                                                <ProductSelectCard
                                                    key={product.id}
                                                    product={product}
                                                    selectedMap={selectedMap}
                                                    onToggleVariant={toggleVariant}
                                                    onToggleAll={toggleAllProductVariants}
                                                />
                                            ))}

                                            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                                                <button
                                                    type="button"
                                                    disabled={meta.currentPage <= 1 || loadingProducts}
                                                    onClick={() => loadAvailableProducts(meta.currentPage - 1)}
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50 dark:border-slate-700"
                                                >
                                                    Trước
                                                </button>

                                                <span className="text-sm text-slate-500">
                                                    Trang {meta.currentPage}/{meta.lastPage}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={meta.currentPage >= meta.lastPage || loadingProducts}
                                                    onClick={() => loadAvailableProducts(meta.currentPage + 1)}
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50 dark:border-slate-700"
                                                >
                                                    Sau
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                            <div className="text-center">
                                                <PackagePlus size={32} className="mx-auto text-slate-300" />
                                                <p className="mt-3 font-bold text-slate-700 dark:text-slate-200">
                                                    Không có sản phẩm phù hợp
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Sản phẩm đang bán và còn tồn kho sẽ hiển thị ở đây.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
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
                        {isEdit ? 'Lưu thay đổi' : 'Thêm vào khuyến mãi'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ProductSelectCard({ product, selectedMap, onToggleVariant, onToggleAll }) {
    const availableVariants = product.variants.filter((variant) => !variant.alreadyAdded);
    const selectedCount = availableVariants.filter((variant) => selectedMap[String(variant.id)]).length;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-3">
                <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="h-14 w-14 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{product.name}</h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {product.category || 'Chưa có danh mục'} · {product.variants.length} phân loại
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={availableVariants.length === 0}
                            onClick={() => onToggleAll(product)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {selectedCount > 0 ? `Đã chọn ${selectedCount}` : 'Chọn phân loại'}
                        </button>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {product.variants.map((variant) => {
                            const selected = Boolean(selectedMap[String(variant.id)]);

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    disabled={variant.alreadyAdded}
                                    onClick={() => onToggleVariant(product, variant)}
                                    className={[
                                        'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition',
                                        selected
                                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10'
                                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800',
                                        variant.alreadyAdded ? 'cursor-not-allowed opacity-50' : '',
                                    ].join(' ')}
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {variant.label}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {formatMoney(variant.price)} · Còn {variant.availableStock}
                                        </p>
                                    </div>

                                    {variant.alreadyAdded ? (
                                        <span className="text-xs font-bold text-slate-400">Đã thêm</span>
                                    ) : selected ? (
                                        <Check size={18} className="text-blue-600" />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditItemInfo({ item }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="font-bold text-slate-900 dark:text-white">Sản phẩm đang sửa</h3>

            <div className="mt-4 flex gap-3">
                <img
                    src={item.productThumbnail}
                    alt={item.productName}
                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />

                <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                        {item.variantSku || `#${item.productVariantId || item.productId}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        {item.variantSize ? `Size ${item.variantSize}` : ''}
                        {item.variantSize && item.variantColor ? ' · ' : ''}
                        {item.variantColor || ''}
                    </p>
                </div>
            </div>

            <p className="mt-4 text-sm text-slate-500">
                Khi đã phát sinh bán hoặc giữ chỗ, hệ thống chỉ cho sửa giảm giá, giới hạn và trạng thái.
            </p>
        </div>
    );
}

function Label({ children }) {
    return <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{children}</label>;
}

const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
