export default function CheckoutSummary({
    items = [],
    originalSubtotal = 0,
    subtotal = 0,
    shippingFee = 0,
    discount = 0,
    grandTotal = 0,
    totalItems = 0,
    loading,
    onCheckout,
    buttonText = 'Đặt hàng',
    error = '',
}) {
    const finalTotal = Number(grandTotal || subtotal + shippingFee);

    return (
        <aside className="h-max rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-28">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Đơn hàng của bạn</h2>

            {error && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                    {error}
                </div>
            )}

            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-950">
                    <p className="font-bold text-blue-950 dark:text-white">Chưa có sản phẩm thanh toán</p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Vui lòng quay lại giỏ hàng và chọn sản phẩm cần thanh toán.
                    </p>
                </div>
            ) : (
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {items.map((item) => {
                        const originalPrice = Number(item.originalPrice || item.price || 0);
                        const finalPrice = Number(item.finalPrice || item.price || 0);
                        const hasDiscount = originalPrice > finalPrice;
                        const lineTotal = finalPrice * Number(item.quantity || 0);

                        return (
                            <div key={item.cartItemId} className="flex gap-3">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                                    <img
                                        src={item.image || '/images/no-image.png'}
                                        alt={item.name}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-bold text-blue-950 dark:text-white">
                                        {item.name}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        SL: {item.quantity}
                                        {item.size ? ` • Size ${item.size}` : ''}
                                        {item.color ? ` • ${item.color}` : ''}
                                    </p>

                                    {item.hasPromotion && item.promotion?.title && (
                                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            {item.promotion.title}
                                        </p>
                                    )}

                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-blue-950 dark:text-blue-300">
                                            {formatMoney(finalPrice)}
                                        </span>

                                        {hasDiscount && (
                                            <span className="text-xs font-semibold text-slate-400 line-through">
                                                {formatMoney(originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm font-bold text-blue-950 dark:text-blue-300">
                                    {formatMoney(lineTotal)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <div className="space-y-3 text-sm">
                <Row label={`Tạm tính (${totalItems} sản phẩm)`} value={formatMoney(originalSubtotal || subtotal)} />

                <Row label="Phí vận chuyển" value={shippingFee > 0 ? formatMoney(shippingFee) : 'Tính sau'} muted />

                <Row
                    label="Giảm giá"
                    value={discount > 0 ? `- ${formatMoney(discount)}` : 'Chưa áp dụng'}
                    muted={discount <= 0}
                    positive={discount > 0}
                />
            </div>

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 dark:text-white">Tổng cộng</span>

                <span className="text-xl font-extrabold text-blue-950 dark:text-blue-300">
                    {formatMoney(finalTotal)}
                </span>
            </div>

            <button
                type="button"
                disabled={loading || items.length === 0}
                onClick={onCheckout}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 py-4 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                {loading ? 'Đang xử lý...' : buttonText}
            </button>
        </aside>
    );
}

function Row({ label, value, muted = false, positive = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>

            <span
                className={`text-right font-bold ${
                    positive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : muted
                          ? 'text-slate-400'
                          : 'text-blue-950 dark:text-white'
                }`}
            >
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
