import { Lock } from 'lucide-react';

export default function CheckoutSummary({
    items = [],
    subtotal = 0,
    totalItems = 0,
    loading,
    onCheckout,
    buttonText = 'Đặt hàng',
}) {
    const shipping = 0;
    const discount = 0;
    const total = subtotal + shipping - discount;

    return (
        <aside className="h-max rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-28">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Đơn hàng của bạn</h2>

            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                            <img
                                src={item.image || '/images/no-image.png'}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-bold text-blue-950 dark:text-white">{item.name}</p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">SL: {item.quantity}</p>
                        </div>

                        <p className="text-sm font-bold text-blue-950 dark:text-blue-300">
                            {formatMoney(item.price * item.quantity)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <div className="space-y-3 text-sm">
                <Row label={`Tạm tính (${totalItems} sản phẩm)`} value={formatMoney(subtotal)} />
                <Row label="Phí vận chuyển" value="Tính sau" muted />
                <Row label="Giảm giá" value="Chưa áp dụng" muted />
            </div>

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 dark:text-white">Tổng cộng</span>

                <span className="text-xl font-extrabold text-blue-950 dark:text-blue-300">{formatMoney(total)}</span>
            </div>

            <button
                type="button"
                disabled={loading || items.length === 0}
                onClick={onCheckout}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 py-4 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                <Lock size={18} />
                {loading ? 'Đang xử lý...' : buttonText}
            </button>
        </aside>
    );
}

function Row({ label, value, muted = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>

            <span className={`text-right font-bold ${muted ? 'text-slate-400' : 'text-blue-950 dark:text-white'}`}>
                {value}
            </span>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}
