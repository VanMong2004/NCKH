import { CheckCircle2 } from 'lucide-react';

export default function SuccessHero({ order }) {
    return (
        <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 md:p-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 size={44} />
            </div>

            <h1 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 md:text-3xl">
                Đặt hàng thành công
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Cảm ơn bạn đã đặt hàng. Hệ thống đã ghi nhận đơn hàng của bạn.
            </p>

            <div className="mx-auto mt-5 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-sm dark:bg-slate-900 dark:text-white">
                Mã đơn hàng: {order.order_code || `#${order.id}`}
            </div>
        </section>
    );
}
