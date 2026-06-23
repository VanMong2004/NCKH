import { Link } from 'react-router-dom';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';

export default function CartItem({ item, selected, onToggle, onIncrease, onDecrease, onRemove }) {
    const availableStock = Number(item.availableStock ?? item.inStock ?? 0);
    const outOfStock = availableStock <= 0;
    const limitReached = Number(item.quantity || 0) >= availableStock;

    const originalPrice = Number(item.originalPrice || item.price || 0);
    const finalPrice = Number(item.finalPrice || item.price || 0);
    const hasDiscount = originalPrice > finalPrice;
    const lineTotal = finalPrice * Number(item.quantity || 0);

    return (
        <article
            className={[
                'relative rounded-2xl border bg-white p-4 shadow-sm transition dark:bg-slate-900',
                selected
                    ? 'border-blue-200 ring-2 ring-blue-950/10 dark:border-blue-500/40 dark:ring-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800',
            ].join(' ')}
        >
            <div className="grid grid-cols-[24px_90px_1fr] gap-3 md:grid-cols-[24px_112px_minmax(0,1fr)_140px_150px_44px] md:items-center">
                <label className="mt-9 flex h-5 w-5 cursor-pointer items-center justify-center md:mt-0">
                    <input
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={() => onToggle(item.cartItemId)}
                        className="peer sr-only"
                    />

                    <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white transition peer-checked:border-blue-950 peer-checked:bg-blue-950 dark:border-slate-600 dark:bg-slate-950 dark:peer-checked:border-blue-500 dark:peer-checked:bg-blue-600">
                        {selected ? <Check size={14} className="text-white" strokeWidth={3} /> : null}
                    </span>
                </label>

                <Link
                    to={`/product/${item.slug}`}
                    className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800 md:h-28 md:w-28"
                >
                    <img
                        src={item.image || '/images/no-image.png'}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                            e.currentTarget.src = '/images/no-image.png';
                        }}
                    />
                </Link>

                <div className="min-w-0">
                    <Link to={`/product/${item.slug}`}>
                        <h3 className="line-clamp-2 font-bold text-blue-950 hover:text-blue-700 dark:text-white dark:hover:text-blue-300">
                            {item.name}
                        </h3>
                    </Link>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {item.size && <>Size: {item.size}</>}
                        {item.size && item.color && <span> · </span>}
                        {item.color && <>Màu: {item.color}</>}
                    </p>

                    {item.hasPromotion && item.promotion?.title && (
                        <p className="mt-2 line-clamp-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {item.promotion.title}
                        </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                        <span className="text-sm font-bold text-blue-950 dark:text-blue-300">
                            {formatMoney(finalPrice)}
                        </span>

                        {hasDiscount && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                                {formatMoney(originalPrice)}
                            </span>
                        )}
                    </div>

                    <p
                        className={`mt-2 text-xs font-bold ${
                            outOfStock ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                    >
                        {outOfStock ? 'Hết hàng' : `Còn ${availableStock} sản phẩm`}
                    </p>
                </div>

                <div className="col-span-2 col-start-2 md:col-span-1 md:col-start-auto">
                    <QuantityControl
                        quantity={item.quantity}
                        disabledMinus={Number(item.quantity || 0) <= 1}
                        disabledPlus={outOfStock || limitReached}
                        onDecrease={() => onDecrease(item.cartItemId)}
                        onIncrease={() => onIncrease(item.cartItemId)}
                    />
                </div>

                <div className="hidden text-right md:block">
                    <p className="text-lg font-extrabold text-blue-950 dark:text-blue-300">{formatMoney(lineTotal)}</p>

                    {hasDiscount && (
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                            Đã giảm {formatMoney((originalPrice - finalPrice) * Number(item.quantity || 0))}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(item.cartItemId)}
                    className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:hover:bg-red-950/30 md:static"
                    aria-label="Xóa sản phẩm"
                >
                    <Trash2 size={17} />
                </button>
            </div>
        </article>
    );
}

function QuantityControl({ quantity, onDecrease, onIncrease, disabledMinus = false, disabledPlus = false }) {
    return (
        <div className="mt-4 flex w-max overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 md:mt-0">
            <button
                type="button"
                disabled={disabledMinus}
                onClick={onDecrease}
                className="flex h-9 w-9 items-center justify-center transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
            >
                <Minus size={15} />
            </button>

            <span className="flex h-9 w-11 items-center justify-center border-x border-slate-200 font-bold text-blue-950 dark:border-slate-700 dark:text-white">
                {quantity}
            </span>

            <button
                type="button"
                disabled={disabledPlus}
                onClick={onIncrease}
                className="flex h-9 w-9 items-center justify-center transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
            >
                <Plus size={15} />
            </button>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
