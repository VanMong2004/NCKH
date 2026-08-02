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
            key: 'processing',
            title: 'Xác nhận và chuẩn bị',
            desc: 'Nhân viên đang kiểm tra và chuẩn bị đơn hàng.',
            icon: PackageCheck,
        },
        {
            key: 'awaiting_receipt',
            title: order.fulfillmentMethod === 'pickup' ? 'Sẵn sàng nhận tại phòng' : 'Đang giao',
            desc:
                order.fulfillmentMethod === 'pickup'
                    ? 'Đơn hàng đã sẵn sàng để nhận tại Phòng Công tác Chính trị & Quản lý sinh viên Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.'
                    : 'Đơn hàng đang được giao đến địa chỉ bạn đã đăng ký.',
            icon: Truck,
        },
        {
            key: 'completed',
            title: 'Hoàn thành',
            desc: 'Đơn hàng đã hoàn tất.',
            icon: Clock,
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
