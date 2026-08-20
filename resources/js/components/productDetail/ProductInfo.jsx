import { BadgePercent, Building2, Minus, PackageCheck, Plus, ShoppingCart, Star, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
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
    const navigate = useNavigate();
    const { addToCartByVariant } = useCart();
    const { isAuthenticated } = useAuth();

    const variants = product.variants || [];

    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);

    const sizes = getSizes(variants);
    const colors = getColors(variants);

    const hasSize = sizes.length > 0;
    const hasColor = colors.length > 0;
    const hasVariantOptions = hasSize || hasColor;

    const defaultVariant = getDefaultVariant(variants);
    const selectedVariant = getSelectedVariant({
        variants,
        selectedSize,
        selectedColor,
        hasSize,
        hasColor,
        defaultVariant,
    });

    const currentVariant = selectedVariant || defaultVariant;

    const priceInfo = getPriceInfo({
        product,
        variant: currentVariant,
        isAuthenticated,
    });

    const availableStock = Number(currentVariant?.availableStock ?? product.availableStock ?? 0);
    const inStock = currentVariant ? Boolean(currentVariant.inStock) : Boolean(product.inStock);

    function handleSelectSize(size) {
        const nextSize = selectedSize === size ? '' : size;

        setSelectedSize(nextSize);
        setQuantity(1);

        if (!nextSize) return;

        const colorStillValid = variants.some((variant) => {
            return variant.size === nextSize && variant.color === selectedColor && variant.inStock;
        });

        if (selectedColor && !colorStillValid) {
            setSelectedColor('');
        }
    }

    function handleSelectColor(color) {
        const nextColor = selectedColor === color ? '' : color;

        setSelectedColor(nextColor);
        setQuantity(1);

        if (!nextColor) return;

        const sizeStillValid = variants.some((variant) => {
            return variant.color === nextColor && variant.size === selectedSize && variant.inStock;
        });

        if (selectedSize && !sizeStillValid) {
            setSelectedSize('');
        }
    }

    function clearOptions() {
        setSelectedSize('');
        setSelectedColor('');
        setQuantity(1);
    }

    function checkSizeAvailable(size) {
        return variants.some((variant) => {
            const matchSize = variant.size === size;
            const matchColor = selectedColor ? variant.color === selectedColor : true;

            return matchSize && matchColor && variant.inStock;
        });
    }

    function checkColorAvailable(color) {
        return variants.some((variant) => {
            const matchColor = variant.color === color;
            const matchSize = selectedSize ? variant.size === selectedSize : true;

            return matchColor && matchSize && variant.inStock;
        });
    }

    function increaseQuantity() {
        if (!inStock) {
            toast.warn('Sản phẩm đã hết hàng');
            return;
        }

        if (quantity >= availableStock) {
            toast.warn(`Chỉ còn ${availableStock} sản phẩm`);
            return;
        }

        setQuantity(quantity + 1);
    }

    function decreaseQuantity() {
        if (quantity <= 1) return;

        setQuantity(quantity - 1);
    }

    function validateBeforePurchase() {
        if (variants.length === 0) {
            toast.warn('Sản phẩm chưa có biến thể để thêm vào giỏ hàng');
            return null;
        }

        if (hasSize && !selectedSize) {
            toast.warn('Vui lòng chọn size');
            return null;
        }

        if (hasColor && !selectedColor) {
            toast.warn('Vui lòng chọn màu sắc');
            return null;
        }

        if (!selectedVariant) {
            toast.warn('Không tìm thấy phân loại phù hợp');
            return null;
        }

        if (!selectedVariant.inStock) {
            toast.warn('Sản phẩm đã hết hàng');
            return null;
        }

        if (quantity > Number(selectedVariant.availableStock || 0)) {
            toast.warn(`Chỉ còn ${selectedVariant.availableStock} sản phẩm`);
            return null;
        }

        return selectedVariant;
    }

    async function handleAddToCart() {
        const variant = validateBeforePurchase();

        if (!variant) {
            return;
        }

        try {
            setAdding(true);
            await addToCartByVariant(variant.id, quantity);
        } finally {
            setAdding(false);
        }
    }

    async function handleBuyNow() {
        const variant = validateBeforePurchase();

        if (!variant) {
            return;
        }

        try {
            setBuyingNow(true);

            const cartItem = await addToCartByVariant(variant.id, quantity);

            if (!cartItem?.cart_item_id) {
                navigate('/checkout');
                return;
            }

            navigate('/checkout', {
                state: {
                    cartItemIds: [cartItem.cart_item_id],
                },
            });
        } finally {
            setBuyingNow(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ProductHeader product={product} />

            <PriceBox priceInfo={priceInfo} product={product} variant={currentVariant} />

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

            {hasSize && (
                <OptionGroup
                    title="Size"
                    items={sizes}
                    selected={selectedSize}
                    onSelect={handleSelectSize}
                    isAvailable={checkSizeAvailable}
                />
            )}

            {hasColor && (
                <OptionGroup
                    title="Màu sắc"
                    items={colors}
                    selected={selectedColor}
                    onSelect={handleSelectColor}
                    isAvailable={checkColorAvailable}
                />
            )}

            <VariantCode variant={currentVariant} hasVariantOptions={hasVariantOptions} />

            <QuantityBox
                quantity={quantity}
                inStock={inStock}
                availableStock={availableStock}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={buyingNow || adding || !inStock}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-950 bg-white py-3.5 text-sm font-bold text-blue-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
                >
                    <Wallet size={18} />
                    {buyingNow ? 'Đang chuyển...' : 'Mua ngay'}
                </button>

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={adding || buyingNow || !inStock}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    <ShoppingCart size={18} />
                    {adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>
            </div>
        </section>
    );
}

/*
|--------------------------------------------------------------------------
| Helper lấy danh sách size / màu
|--------------------------------------------------------------------------
*/

function getSizes(variants) {
    const sizes = variants.map((variant) => variant.size).filter(Boolean);
    const uniqueSizes = [...new Set(sizes)];

    return uniqueSizes.sort((a, b) => {
        const orderA = SIZE_ORDER[a] || 999;
        const orderB = SIZE_ORDER[b] || 999;

        if (orderA !== orderB) return orderA - orderB;

        return String(a).localeCompare(String(b));
    });
}

function getColors(variants) {
    const colors = variants.map((variant) => variant.color).filter(Boolean);

    return [...new Set(colors)];
}

/*
|--------------------------------------------------------------------------
| Helper chọn biến thể
|--------------------------------------------------------------------------
*/

function getDefaultVariant(variants) {
    if (variants.length === 0) return null;

    const inStockVariant = variants.find((variant) => variant.inStock);

    return inStockVariant || variants[0];
}

function getSelectedVariant({ variants, selectedSize, selectedColor, hasSize, hasColor, defaultVariant }) {
    if (variants.length === 0) return null;

    if (!hasSize && !hasColor) {
        return defaultVariant;
    }

    if (hasSize && !selectedSize) return null;
    if (hasColor && !selectedColor) return null;

    return (
        variants.find((variant) => {
            const matchSize = hasSize ? variant.size === selectedSize : true;
            const matchColor = hasColor ? variant.color === selectedColor : true;

            return matchSize && matchColor;
        }) || null
    );
}

/*
|--------------------------------------------------------------------------
| Helper xử lý giá
|--------------------------------------------------------------------------
*/

function getPriceInfo({ product, variant, isAuthenticated }) {
    const loginRequired = Boolean(product.promotionLoginRequired || variant?.promotionLoginRequired);
    const shouldHideDiscount = loginRequired && !isAuthenticated;

    const originalPrice = Number(variant?.originalPrice || product.originalMinPrice || product.priceMin || 0);
    const finalPrice = Number(variant?.finalPrice || variant?.price || product.priceMin || 0);

    if (shouldHideDiscount) {
        return {
            price: originalPrice,
            originalPrice: 0,
            hasDiscount: false,
            showPromotionBadge: false,
            showLoginNotice: true,
        };
    }

    return {
        price: finalPrice,
        originalPrice,
        hasDiscount: originalPrice > finalPrice,
        showPromotionBadge: Boolean(product.hasPromotion || variant?.hasPromotion),
        showLoginNotice: false,
    };
}

/*
|--------------------------------------------------------------------------
| UI nhỏ
|--------------------------------------------------------------------------
*/

function ProductHeader({ product }) {
    return (
        <>
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
        </>
    );
}

function PriceBox({ priceInfo, product, variant }) {
    const promotionTitle = variant?.promotion?.title || 'Đang có khuyến mãi';

    return (
        <div className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
            <div className="flex flex-wrap items-end gap-2">
                <p className="text-2xl font-extrabold text-blue-950 dark:text-blue-300">
                    {formatMoney(priceInfo.price)}
                </p>

                {priceInfo.hasDiscount && (
                    <p className="pb-1 text-sm font-semibold text-slate-400 line-through">
                        {formatMoney(priceInfo.originalPrice)}
                    </p>
                )}
            </div>

            {priceInfo.showPromotionBadge && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <BadgePercent size={13} />
                    {promotionTitle}
                </p>
            )}

            {priceInfo.showLoginNotice && (
                <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
                    Sản phẩm đang có đợt khuyến mãi. Vui lòng đăng nhập để mua với giá tốt hơn.
                </p>
            )}

            {!variant && product.priceText && (
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{product.priceText}</p>
            )}
        </div>
    );
}

function VariantCode({ variant, hasVariantOptions }) {
    if (!variant?.sku) return null;

    if (hasVariantOptions) {
        return (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm dark:border-blue-900/40 dark:bg-blue-950/30">
                <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-300">
                    <PackageCheck size={17} />
                    Mã phân loại: {variant.sku}
                </div>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {variant.size ? `Size ${variant.size}` : ''}
                    {variant.size && variant.color ? ' · ' : ''}
                    {variant.color || ''}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-white">
                <PackageCheck size={17} />
                Mã sản phẩm: {variant.sku}
            </div>
        </div>
    );
}

function QuantityBox({ quantity, inStock, availableStock, onIncrease, onDecrease }) {
    return (
        <div className="mt-5">
            <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">Số lượng</p>

            <div className="flex items-center gap-3">
                <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onDecrease}
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
                        onClick={onIncrease}
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
    );
}

function OptionGroup({ title, items, selected, onSelect, isAvailable }) {
    return (
        <div className="mt-5">
            <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">{title}</p>

            <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                    const available = isAvailable(item);
                    const active = selected === item;

                    return (
                        <button
                            key={item}
                            type="button"
                            disabled={!available}
                            onClick={() => onSelect(item)}
                            className={[
                                'rounded-xl border px-4 py-2 text-sm font-bold transition',
                                active
                                    ? 'border-blue-950 bg-blue-950 text-white shadow-sm ring-2 ring-blue-950/15 dark:border-blue-500 dark:bg-blue-600'
                                    : available
                                      ? 'border-slate-300 bg-white text-slate-700 hover:border-blue-950 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600',
                            ].join(' ')}
                        >
                            {item}
                            {active && <span className="ml-2 text-xs">×</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
