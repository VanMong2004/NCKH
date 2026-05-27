import { CheckCircle2, CreditCard, MapPin, ShoppingCart } from 'lucide-react';

export default function CheckoutSteps({ activeStep = 2 }) {
    const steps = [
        {
            id: 1,
            title: 'Giỏ hàng',
            desc: 'Kiểm tra sản phẩm',
            icon: ShoppingCart,
        },
        {
            id: 2,
            title: 'Thông tin nhận hàng ',
            desc: 'Địa chỉ và liên hệ',
            icon: MapPin,
        },
        {
            id: 3,
            title: '',
            desc: 'Chọn phương thức',
            icon: CreditCard,
        },
        {
            id: 4,
            title: 'Hoàn tất',
            desc: 'Xác nhận đơn hàng',
            icon: CheckCircle2,
        },
    ];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    const done = step.id < activeStep;
                    const active = step.id === activeStep;

                    return (
                        <div
                            key={step.id}
                            className={`rounded-xl border p-3 transition ${
                                active
                                    ? 'border-blue-950 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                                    : done
                                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30'
                                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        active
                                            ? 'bg-blue-950 text-white dark:bg-blue-600'
                                            : done
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <Icon size={20} />
                                </div>

                                <div className="min-w-0">
                                    <p
                                        className={`truncate text-sm font-bold ${
                                            active
                                                ? 'text-blue-950 dark:text-blue-300'
                                                : done
                                                  ? 'text-emerald-700 dark:text-emerald-400'
                                                  : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {step.title}
                                    </p>

                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
