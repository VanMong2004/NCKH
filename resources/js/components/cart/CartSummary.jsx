import { ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartSummary({
    originalSubtotal = 0,
    subtotal = 0,
    itemCount = 0,
    shipping = 0,
    discount = 0,
    selectedIds = [],
}) {
    const displaySubtotal = Number(originalSubtotal || subtotal || 0);
    const finalSubtotal = Number(subtotal || 0);
    const shippingFee = Number(shipping || 0);
    const discountAmount = Number(discount || 0);

    const total = finalSubtotal + shippingFee;
    const checkoutIds = selectedIds;
    const canCheckout = selectedIds.length > 0;

    return (
        <aside className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
                <ReceiptText size={20} className="text-blue-950 dark:text-blue-300" />
                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Tóm tắt đơn hàng</h2>
            </div>

            <div className="space-y-4 text-sm">
                <SummaryRow label={`Tạm tính (${itemCount} sản phẩm)`} value={formatMoney(displaySubtotal)} />

                <SummaryRow
                    label="Giảm giá"
                    value={discountAmount > 0 ? `- ${formatMoney(discountAmount)}` : 'Chưa áp dụng'}
                    muted={discountAmount <= 0}
                    positive={discountAmount > 0}
                />

                <SummaryRow
                    label="Phí vận chuyển"
                    value={shippingFee > 0 ? formatMoney(shippingFee) : 'Tính ở bước thanh toán'}
                    muted={shippingFee <= 0}
                />
            </div>

            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />

            <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-blue-950 dark:text-white">Tổng cộng</span>

                <span className="text-xl font-extrabold text-blue-950 dark:text-blue-300">{formatMoney(total)}</span>
            </div>

            {canCheckout ? (
                <Link
                    to="/checkout"
                    state={{
                        cartItemIds: checkoutIds,
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 py-4 font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Tiến hành thanh toán
                </Link>
            ) : (
                <button
                    type="button"
                    disabled
                    className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-300 py-4 font-bold text-white dark:bg-slate-700"
                >
                    Chọn sản phẩm để thanh toán
                </button>
            )}

            {/* <div className="mt-5 text-center">
                <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Phương thức hỗ trợ</p>

                <div className="grid grid-cols-4 gap-2">
                    {['COD', 'Mock', 'QR'].map((item) => (
                        <div
                            key={item}
                            className="rounded-lg border border-slate-200 py-2 text-xs font-bold text-blue-950 dark:border-slate-700 dark:text-white"
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div> */}
        </aside>
    );
}

function SummaryRow({ label, value, muted = false, positive = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>

            <span
                className={`text-right font-bold ${
                    positive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : muted
                          ? 'text-slate-400 dark:text-slate-500'
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
