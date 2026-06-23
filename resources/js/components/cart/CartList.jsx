import { Link } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';

import CartItem from './CartItem';

export default function CartList({
    items,
    selectedIds = [],
    allSelected,
    onSelectAll,
    onRemoveSelected,
    onToggle,
    onIncrease,
    onDecrease,
    onRemove,
    onClear,
}) {
    const selectedKeys = selectedIds.map((id) => String(id));

    return (
        <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-blue-950 dark:text-white">
                    <span className="relative flex h-5 w-5 items-center justify-center">
                        <input
                            type="checkbox"
                            checked={Boolean(allSelected)}
                            onChange={onSelectAll}
                            className="peer sr-only"
                        />

                        <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white transition peer-checked:border-blue-950 peer-checked:bg-blue-950 dark:border-slate-600 dark:bg-slate-950 dark:peer-checked:border-blue-500 dark:peer-checked:bg-blue-600">
                            {allSelected ? <Check size={14} className="text-white" strokeWidth={3} /> : null}
                        </span>
                    </span>
                    Chọn tất cả
                </label>

                <button
                    type="button"
                    onClick={onRemoveSelected}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-950 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-red-950/30"
                >
                    <Trash2 size={16} />
                    Xóa đã chọn
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item) => {
                    const itemKey = String(item.cartItemId);

                    return (
                        <CartItem
                            key={itemKey}
                            item={item}
                            selected={selectedKeys.includes(itemKey)}
                            onToggle={onToggle}
                            onIncrease={onIncrease}
                            onDecrease={onDecrease}
                            onRemove={onRemove}
                        />
                    );
                })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    onClick={onClear}
                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-blue-950 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-red-950/30 sm:w-auto"
                >
                    Xóa toàn bộ giỏ hàng
                </button>

                <Link
                    to="/shop"
                    className="text-center text-sm font-bold text-blue-700 hover:text-blue-950 dark:text-blue-300"
                >
                    ← Tiếp tục mua sắm
                </Link>
            </div>
        </section>
    );
}
