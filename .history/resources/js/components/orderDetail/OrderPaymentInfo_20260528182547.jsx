import { CreditCard } from 'lucide-react';

export default function OrderPaymentInfo({ order }) {
    const payment = order.payment;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-950 dark:text-blue-300" />

                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Thanh toán</h2>
            </div>

            <div className="space-y-3">
                <Ro label="Phương thức" value={payment.methodText} />

                <Row label="Trạng thái" value={payment.statusText} />

                <Row label="Số tiền" value={formatMoney(payment.amount)} />

                <Row label="Mã giao dịch" value={payment.transactionId || '—'} />
            </div>
        </section>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
            <span className="font-semibold dark:text-white">{label}</span>

            <span className="text-right text-slate-500">{value}</span>
        </div>
    );
}

function formatMoney(v) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(v || 0);
}
