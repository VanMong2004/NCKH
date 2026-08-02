import { CreditCard } from 'lucide-react';

const pickupPaymentText =
    'Thanh toán trực tiếp khi nhận tại Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ';

export default function OrderPaymentInfo({ order }) {
    const payment = order?.payment || null;
    const summary = order?.summary || {};

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-950 dark:text-blue-300" />

                <h2 className="text-lg font-bold text-blue-950 dark:text-white">Thanh toán</h2>
            </div>

            <div className="space-y-3">
                <Row label="Phương thức" value={payment?.methodText || getFallbackMethodText(order)} />
                <Row label="Trạng thái" value={payment?.statusText || 'Chưa tạo thanh toán'} />
                <Row label="Số tiền" value={formatMoney(payment?.amount || summary.grandTotal)} />
                <Row label="Mã giao dịch" value={payment?.transactionId || '—'} />
            </div>
        </section>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
            <span className="font-semibold dark:text-white">{label}</span>
            <span className="text-right text-slate-500 dark:text-slate-400">{value}</span>
        </div>
    );
}

function getFallbackMethodText(order) {
    const method = order?.paymentMethod || order?.raw?.payment_method || '';

    const map = {
        cod: 'Thanh toán khi nhận hàng',
        mock_bank: 'Chuyển khoản ngân hàng',
        cash_on_pickup: pickupPaymentText,
    };

    return map[method] || 'Chưa xác định';
}

function formatMoney(v) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(v || 0));
}
