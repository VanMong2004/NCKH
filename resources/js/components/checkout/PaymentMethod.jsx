import { Banknote, CreditCard, QrCode } from 'lucide-react';

export default function PaymentMethod({ value, onChange, error }) {
    const methods = [
        {
            value: 'cod',
            title: 'Thanh toán khi nhận hàng',
            desc: 'Phù hợp khi nhận sản phẩm trực tiếp.',
            icon: Banknote,
        },
        {
            value: 'mock',
            title: 'Thanh toán trực tuyến',
            desc: 'Mô phỏng thanh toán qua cổng tích hợp.',
            icon: CreditCard,
        },
        {
            value: 'qr',
            title: 'QR Code',
            desc: 'Thanh toán bằng mã QR nếu hệ thống hỗ trợ.',
            icon: QrCode,
        },
    ];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Phương thức thanh toán</h2>

            <div className="grid gap-3">
                {methods.map((method) => {
                    const Icon = method.icon;
                    const active = value === method.value;

                    return (
                        <button
                            key={method.value}
                            type="button"
                            onClick={() => onChange(method.value)}
                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                active
                                    ? 'border-blue-950 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                                    : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950'
                            }`}
                        >
                            <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                    active
                                        ? 'bg-blue-950 text-white dark:bg-blue-600'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                }`}
                            >
                                <Icon size={21} />
                            </div>

                            <div>
                                <p className="font-bold text-blue-950 dark:text-white">{method.title}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{method.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {error && <p className="mt-2 text-sm font-semibold text-red-500">{error}</p>}
        </section>
    );
}
