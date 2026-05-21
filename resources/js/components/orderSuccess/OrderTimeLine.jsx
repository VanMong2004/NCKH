import { CheckCircle2, Circle, Clock, PackageCheck, Truck } from 'lucide-react';

export default function OrderTimeLine({ order }) {
    const status = order.status || 'pending';

    const steps = [
        {
            key: 'pending',
            title: 'Đã đặt hàng',
            desc: 'Hệ thống đã ghi nhận đơn hàng.',
            icon: CheckCircle2,
        },
        {
            key: 'confirmed',
            title: 'Xác nhận đơn',
            desc: 'Nhân viên kiểm tra đơn hàng.',
            icon: Clock,
        },
        {
            key: 'processing',
            title: 'Chuẩn bị hàng',
            desc: 'Sản phẩm đang được chuẩn bị.',
            icon: PackageCheck,
        },
        {
            key: 'shipping',
            title: 'Giao/nhận hàng',
            desc: 'Đơn hàng đang được giao hoặc chờ nhận.',
            icon: Truck,
        },
    ];

    const currentIndex = Math.max(
        0,
        steps.findIndex((item) => item.key === status),
    );

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-bold text-blue-950 dark:text-white">Tiến trình đơn hàng</h2>

            <div className="space-y-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const done = index <= currentIndex;

                    return (
                        <div key={step.key} className="flex gap-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                    done
                                        ? 'bg-blue-950 text-white dark:bg-blue-700'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                            >
                                {done ? <Icon size={20} /> : <Circle size={18} />}
                            </div>

                            <div>
                                <p className="font-bold text-blue-950 dark:text-white">{step.title}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
