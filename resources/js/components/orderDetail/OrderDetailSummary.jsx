export default function OrderDetailSummary({ order }) {
    const summary = order.summary || {};

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Tổng kết đơn hàng</h2>

            <div className="space-y-3 text-sm">
                <Row label="Tạm tính" value={formatMoney(summary.subTotal)} />
                <Row label="Phí vận chuyển" value={formatMoney(summary.shippingFee)} />
                <Row
                    label="Giảm giá"
                    value={`- ${formatMoney(summary.discount)}`}
                    muted={Number(summary.discount) <= 0}
                />

                <div className="border-t border-slate-200 pt-3 dark:border-slate-800" />

                <Row label="Tổng cộng" value={formatMoney(summary.grandTotal)} strong />
            </div>
        </section>
    );
}

function Row({ label, value, strong = false, muted = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>

            <span
                className={`text-right ${
                    strong
                        ? 'text-xl font-extrabold text-blue-950 dark:text-blue-300'
                        : muted
                          ? 'font-bold text-slate-400 dark:text-slate-500'
                          : 'font-bold text-blue-950 dark:text-white'
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
