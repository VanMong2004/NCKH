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

    const sizes = useMemo(() => {
        const filtered = selectedColor ? variants.filter((v) => v.color === selectedColor) : variants;

        return [...new Set(filtered.map((v) => v.size).filter(Boolean))];
    }, [variants, selectedColor]);

    const colors = useMemo(() => {
        const filtered = selectedSize ? variants.filter((v) => v.size === selectedSize) : variants;

        return [...new Set(filtered.map((v) => v.color).filter(Boolean))];
    }, [variants, selectedSize]);

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

    const selectedVariant = useMemo(() => {
        if (variants.length === 1) return variants[0];

        return variants.find((variant) => {
            const matchSize = sizes.length === 0 || variant.size === selectedSize;
            const matchColor = colors.length === 0 || variant.color === selectedColor;

            return matchSize && matchColor;
        });
    }, [variants, selectedSize, selectedColor, sizes.length, colors.length]);

    const availableStock = Number(selectedVariant?.available_stock ?? selectedVariant?.stock ?? product.stock ?? 0);

    const price = Number(selectedVariant?.price || product.priceMin || 0);
    const inStock = Boolean(selectedVariant ? availableStock > 0 : product.inStock);

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

            {sizes.length > 0 && (
                <OptionGroup
                    title="Size"
                    items={sizes}
                    selected={selectedSize}
                    onSelect={setSelectedSize}
                    variants={variants}
                    selectedColor={selectedColor}
                />
            )}

            {colors.length > 0 && (
                <OptionGroup
                    title="Màu sắc"
                    items={colors}
                    selected={selectedColor}
                    onSelect={setSelectedColor}
                    variants={variants}
                    selectedSize={selectedSize}
                />
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
                            className="w-12 bg-transparent text-center font-bold outline-none"
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

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {product.description || 'Sản phẩm hiện chưa có mô tả chi tiết.'}
            </p>
        </section>
    );
}

function OptionGroup({ title, items, selected, onSelect, variants, selectedSize, selectedColor }) {
    return (
        <div className="mt-5">
            <p className="mb-2 text-sm font-bold text-blue-950 dark:text-white">{title}</p>

            <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                    const matched = variants.filter((v) => {
                        if (title === 'Size') {
                            return v.size === item && (!selectedColor || v.color === selectedColor);
                        }

                        return v.color === item && (!selectedSize || v.size === selectedSize);
                    });

                    const stock = matched.reduce((sum, v) => sum + Number(v.stock || 0), 0);

                    const disabled = stock <= 0;

                    return (
                        <button
                            key={item}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(item)}
                            className={`
                                rounded-xl border px-4 py-2 text-sm font-bold transition
                                ${selected === item ? 'border-blue-950 bg-blue-950 text-white' : ''}
                                ${disabled ? 'cursor-not-allowed opacity-40 bg-gray-100' : ''}
                            `}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

