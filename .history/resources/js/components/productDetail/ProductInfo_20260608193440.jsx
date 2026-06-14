import { Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useCart } from '../../contexts/CartContext';
import { formatMoney } from '../../services/mappers/productMapper';

export default function ProductInfo({ product }) {
    const { addToCartByVariant } = useCart();

    const variants = product.variants || [];

    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    // =========================
    // FIX: luôn lấy FULL list
    // =========================
    const sizes = useMemo(() => {
        return [...new Set(variants.map((v) => v.size).filter(Boolean))];
    }, [variants]);

    const colors = useMemo(() => {
        return [...new Set(variants.map((v) => v.color).filter(Boolean))];
    }, [variants]);

    // =========================
    // giữ selected hợp lệ
    // =========================
    useEffect(() => {
        if (selectedSize && !sizes.includes(selectedSize)) {
            setSelectedSize('');
        }
    }, [sizes]);

    useEffect(() => {
        if (selectedColor && !colors.includes(selectedColor)) {
            setSelectedColor('');
        }
    }, [colors]);

    // =========================
    // selected variant (giữ logic)
    // =========================
    const selectedVariant = useMemo(() => {
        return variants.find((v) => {
            const matchSize = selectedSize ? v.size === selectedSize : true;
            const matchColor = selectedColor ? v.color === selectedColor : true;
            return matchSize && matchColor;
        });
    }, [variants, selectedSize, selectedColor]);

    const availableStock = Number(selectedVariant?.available_stock ?? selectedVariant?.stock ?? product.stock ?? 0);

    const price = Number(selectedVariant?.price || product.priceMin || 0);

    const inStock = Boolean(selectedVariant ? availableStock > 0 : product.inStock);

    // =========================
    // SHOPEE STYLE AVAILABILITY
    // =========================
    const isSizeAvailable = (size) => {
        return variants.some((v) => {
            const matchSize = v.size === size;
            const matchColor = selectedColor ? v.color === selectedColor : true;
            const inStock = Number(v.stock || 0) > 0;

            return matchSize && matchColor && inStock;
        });
    };

    const isColorAvailable = (color) => {
        return variants.some((v) => {
            const matchColor = v.color === color;
            const matchSize = selectedSize ? v.size === selectedSize : true;
            const inStock = Number(v.stock || 0) > 0;

            return matchColor && matchSize && inStock;
        });
    };

    // =========================
    // ADD TO CART (giữ logic)
    // =========================
    async function handleAddToCart() {
        if (variants.length > 0 && sizes.length > 0 && !selectedSize) {
            toast.warn('Vui lòng chọn size');
            return;
        }

        if (variants.length > 0 && colors.length > 0 && !selectedColor) {
            toast.warn('Vui lòng chọn màu sắc');
            return;
        }

        if (!selectedVariant) {
            toast.warn('Không tìm thấy phân loại sản phẩm phù hợp');
            return;
        }

        if (!inStock) {
            toast.warn('Sản phẩm đã hết hàng');
            return;
        }

        if (quantity > availableStock) {
            toast.warn(`Chỉ còn ${availableStock} sản phẩm`);
            return;
        }

        try {
            setAdding(true);
            await addToCartByVariant(selectedVariant.id, quantity);
        } finally {
            setAdding(false);
        }
    }

    function increase() {
        if (quantity >= availableStock) {
            toast.warn(`Chỉ còn ${availableStock} sản phẩm`);
            return;
        }
        setQuantity((prev) => prev + 1);
    }

    function decrease() {
        setQuantity((prev) => Math.max(1, prev - 1));
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-2 text-sm font-bold text-blue-700 dark:text-blue-300">{product.categoryName}</p>

            <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white md:text-3xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star size={16} fill="currentColor" />
                    {Number(product.rating || 0).toFixed(1)}
                </span>

                <span className="text-slate-400">({product.review_count || product.total_reviews || 0} đánh giá)</span>

                <span className="text-slate-300 dark:text-slate-700">|</span>

                <span className="text-slate-500 dark:text-slate-400">Đã bán {product.sold || 0}</span>
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <p className="text-2xl font-extrabold text-blue-950 dark:text-blue-300">
                    {selectedVariant ? formatMoney(price) : product.priceText}
                </p>
            </div>

            {/* SIZE */}
            {sizes.length > 0 && (
                <OptionGroup
                    title="Size"
                    items={sizes}
                    selected={selectedSize}
                    onSelect={setSelectedSize}
                    isAvailable={isSizeAvailable}
                />
            )}

            {/* COLOR */}
            {colors.length > 0 && (
                <OptionGroup
                    title="Màu sắc"
                    items={colors}
                    selected={selectedColor}
                    onSelect={setSelectedColor}
                    isAvailable={isColorAvailable}
                />
            )}

            {/* QUANTITY */}
            <div className="mt-5">
                <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">Số lượng</p>

                <div className="flex items-center gap-3">
                    <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
                        <button onClick={decrease} className="w-11">
                            <Minus size={16} />
                        </button>

                        <input value={quantity} readOnly className="w-12 text-center" />

                        <button onClick={increase} disabled={!inStock} className="w-11">
                            <Plus size={16} />
                        </button>
                    </div>

                    <span className="text-sm text-slate-500">{inStock ? `Còn ${availableStock}` : 'Hết hàng'}</span>
                </div>
            </div>

            {/* ADD */}
            <button
                onClick={handleAddToCart}
                disabled={adding || !inStock}
                className="mt-6 w-full rounded-xl bg-blue-950 py-3.5 text-white"
            >
                <ShoppingCart size={18} />
                {adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>

            <p className="mt-4 text-sm text-slate-600">
                {product.description || 'Sản phẩm hiện chưa có mô tả chi tiết.'}
            </p>
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

                    return (
                        <button
                            key={item}
                            type="button"
                            disabled={!available}
                            onClick={() => available && onSelect(item)}
                            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                                selected === item
                                    ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-500 dark:bg-blue-600'
                                    : available
                                      ? 'border-slate-300 bg-white text-slate-700 hover:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                            }`}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
