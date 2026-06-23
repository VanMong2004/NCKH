import { BadgePercent, Building2, Minus, PackageCheck, Plus, ShoppingCart, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useCart } from '../../contexts/CartContext';
import { formatMoney } from '../../services/mappers/productMapper';

const SIZE_ORDER = {
    XS: 1,
    S: 2,
    M: 3,
    L: 4,
    XL: 5,
    XXL: 6,
    XXXL: 7,
};

export default function ProductInfo({ product }) {
    const { addToCartByVariant } = useCart();

    const variants = product.variants || [];

    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    const sizes = useMemo(() => {
        return [...new Set(variants.map((variant) => variant.size).filter(Boolean))].sort((a, b) => {
            const orderA = SIZE_ORDER[a] ?? 999;
            const orderB = SIZE_ORDER[b] ?? 999;

            if (orderA !== orderB) return orderA - orderB;

            return String(a).localeCompare(String(b));
        });
    }, [variants]);

    const colors = useMemo(() => {
        return [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
    }, [variants]);

    const hasSizeOptions = sizes.length > 0;
    const hasColorOptions = colors.length > 0;
    const hasVariantOptions = hasSizeOptions || hasColorOptions;

    const defaultVariant = useMemo(() => {
        return variants.find((variant) => variant.inStock) || variants[0] || null;
    }, [variants]);

    const selectedVariant = useMemo(() => {
        if (variants.length === 0) return null;

        if (!hasVariantOptions) {
            return defaultVariant;
        }

        if (hasSizeOptions && !selectedSize) return null;
        if (hasColorOptions && !selectedColor) return null;

        return (
            variants.find((variant) => {
                const matchSize = hasSizeOptions ? variant.size === selectedSize : true;
                const matchColor = hasColorOptions ? variant.color === selectedColor : true;

                return matchSize && matchColor;
            }) || null
        );
    }, [variants, hasVariantOptions, hasSizeOptions, hasColorOptions, selectedSize, selectedColor, defaultVariant]);

    const displayVariant = selectedVariant || defaultVariant;

    const availableStock = Number(displayVariant?.availableStock ?? product.availableStock ?? 0);
    const finalPrice = Number(displayVariant?.finalPrice || displayVariant?.price || product.priceMin || 0);
    const originalPrice = Number(displayVariant?.originalPrice || product.originalMinPrice || finalPrice);
    const hasDiscount = Boolean(displayVariant?.hasPromotion || originalPrice > finalPrice);
    const inStock = Boolean(displayVariant ? displayVariant.inStock : product.inStock);

    const isSizeAvailable = (size) => {
        return variants.some((variant) => {
            const matchSize = variant.size === size;
            const matchColor = selectedColor ? variant.color === selectedColor : true;

            return matchSize && matchColor && variant.inStock;
        });
    };

    const isColorAvailable = (color) => {
        return variants.some((variant) => {
            const matchColor = variant.color === color;
            const matchSize = selectedSize ? variant.size === selectedSize : true;

            return matchColor && matchSize && variant.inStock;
        });
    };

    function resetQuantity() {
        setQuantity(1);
    }

    function handleSelectSize(size) {
        const nextSize = selectedSize === size ? '' : size;

        setSelectedSize(nextSize);

        if (selectedColor && nextSize) {
            const colorStillValid = variants.some((variant) => {
                return variant.size === nextSize && variant.color === selectedColor && variant.inStock;
            });

            if (!colorStillValid) {
                setSelectedColor('');
            }
        }

        resetQuantity();
    }

    function handleSelectColor(color) {
        const nextColor = selectedColor === color ? '' : color;

        setSelectedColor(nextColor);

        if (selectedSize && nextColor) {
            const sizeStillValid = variants.some((variant) => {
                return variant.color === nextColor && variant.size === selectedSize && variant.inStock;
            });

            if (!sizeStillValid) {
                setSelectedSize('');
            }
        }

        resetQuantity();
    }

    function clearOptions() {
        setSelectedSize('');
        setSelectedColor('');
        resetQuantity();
    }

    async function handleAddToCart() {
        if (variants.length === 0) {
            toast.warn('Sản phẩm chưa có biến thể để thêm vào giỏ hàng');
            return;
        }

        if (hasSizeOptions && !selectedSize) {
            toast.warn('Vui lòng chọn size');
            return;
        }

        if (hasColorOptions && !selectedColor) {
            toast.warn('Vui lòng chọn màu sắc');
            return;
        }

        const variantToAdd = selectedVariant || defaultVariant;

        if (!variantToAdd) {
            toast.warn('Không tìm thấy biến thể sản phẩm');
            return;
        }

        if (!variantToAdd.inStock) {
            toast.warn('Sản phẩm đã hết hàng');
            return;
        }

        if (quantity > Number(variantToAdd.availableStock || 0)) {
            toast.warn(`Chỉ còn ${variantToAdd.availableStock} sản phẩm`);
            return;
        }

        try {
            setAdding(true);
            await addToCartByVariant(variantToAdd.id, quantity);
        } finally {
            setAdding(false);
        }
    }

    function increase() {
        const maxStock = Number((selectedVariant || defaultVariant)?.availableStock || availableStock || 0);

        if (maxStock <= 0) {
            toast.warn('Sản phẩm đã hết hàng');
            return;
        }

        if (quantity >= maxStock) {
            toast.warn(`Chỉ còn ${maxStock} sản phẩm`);
            return;
        }

        setQuantity((prev) => prev + 1);
    }

    function decrease() {
        setQuantity((prev) => Math.max(1, prev - 1));
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap gap-2">
                {product.categoryName && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {product.categoryName}
                    </span>
                )}

                {product.departmentName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Building2 size={13} />
                        {product.departmentName}
                    </span>
                )}
            </div>

            <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white md:text-3xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star size={16} fill="currentColor" />
                    {Number(product.rating || 0).toFixed(1)}
                </span>

                <span className="text-slate-400">({product.reviewCount || product.totalReviews || 0} đánh giá)</span>

                <span className="text-slate-300 dark:text-slate-700">|</span>

                <span className="text-slate-500 dark:text-slate-400">Đã bán {product.sold || 0}</span>
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <div className="flex flex-wrap items-end gap-2">
                    <p className="text-2xl font-extrabold text-blue-950 dark:text-blue-300">
                        {displayVariant ? formatMoney(finalPrice) : product.priceText}
                    </p>

                    {hasDiscount && (
                        <p className="pb-1 text-sm font-semibold text-slate-400 line-through">
                            {formatMoney(originalPrice)}
                        </p>
                    )}
                </div>

                {displayVariant?.promotion?.title && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <BadgePercent size={13} />
                        {displayVariant.promotion.title}
                    </p>
                )}

                {!displayVariant?.promotion?.title && product.hasPromotion && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <BadgePercent size={13} />
                        Đang có khuyến mãi
                    </p>
                )}

                {product.promotionLoginRequired && (
                    <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
                        Đăng nhập để kiểm tra giá khuyến mãi dành cho tài khoản của bạn.
                    </p>
                )}
            </div>

            {hasVariantOptions && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Bấm lại vào lựa chọn đang chọn để bỏ chọn.
                    </p>

                    {(selectedSize || selectedColor) && (
                        <button
                            type="button"
                            onClick={clearOptions}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Bỏ chọn tất cả
                        </button>
                    )}
                </div>
            )}

            {hasSizeOptions && (
                <OptionGroup
                    title="Size"
                    items={sizes}
                    selected={selectedSize}
                    onSelect={handleSelectSize}
                    isAvailable={isSizeAvailable}
                />
            )}

            {hasColorOptions && (
                <OptionGroup
                    title="Màu sắc"
                    items={colors}
                    selected={selectedColor}
                    onSelect={handleSelectColor}
                    isAvailable={isColorAvailable}
                />
            )}

            {hasVariantOptions && selectedVariant?.sku && (
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm dark:border-blue-900/40 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-300">
                        <PackageCheck size={17} />
                        Mã phân loại: {selectedVariant.sku}
                    </div>

                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {selectedVariant.size ? `Size ${selectedVariant.size}` : ''}
                        {selectedVariant.size && selectedVariant.color ? ' · ' : ''}
                        {selectedVariant.color || ''}
                    </p>
                </div>
            )}

            {!hasVariantOptions && displayVariant?.sku && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-white">
                        <PackageCheck size={17} />
                        Mã sản phẩm: {displayVariant.sku}
                    </div>
                </div>
            )}

            <div className="mt-5">
                <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">Số lượng</p>

                <div className="flex items-center gap-3">
                    <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={decrease}
                            className="flex w-11 items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Minus size={16} />
                        </button>

                        <input
                            value={quantity}
                            readOnly
                            className="w-12 bg-transparent text-center font-bold outline-none dark:text-white"
                        />

                        <button
                            type="button"
                            onClick={increase}
                            disabled={!inStock}
                            className="flex w-11 items-center justify-center hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        {inStock ? `Còn ${availableStock} sản phẩm` : 'Hết hàng'}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || !inStock}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                <ShoppingCart size={18} />
                {adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
        </section>
    );
}

function OptionGroup({ title, items, selected, onSelect, isAvailable }) {
    return (
        <div className="mt-5">
            <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">{title}</p>

            <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                    const available = isAvailable ? isAvailable(item) : true;
                    const active = selected === item;

                    return (
                        <button
                            key={item}
                            type="button"
                            disabled={!available}
                            onClick={() => available && onSelect(item)}
                            className={[
                                'relative rounded-xl border px-4 py-2 text-sm font-bold transition',
                                active
                                    ? 'border-blue-950 bg-blue-950 text-white shadow-sm ring-2 ring-blue-950/15 dark:border-blue-500 dark:bg-blue-600 dark:ring-blue-400/20'
                                    : available
                                      ? 'border-slate-300 bg-white text-slate-700 hover:border-blue-950 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/30'
                                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600',
                            ].join(' ')}
                            title={active ? 'Bấm lại để bỏ chọn' : undefined}
                        >
                            {item}

                            {active && (
                                <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
                                    ×
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
