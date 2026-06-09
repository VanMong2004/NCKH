import { ChevronRight, Home } from 'lucide-react';

export default function OrdersHeader({ status, onStatusChange, total = 0 }) {
    const statuses = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'processing', label: 'Đang chuẩn bị' },
        { value: 'shipping', label: 'Đang giao' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
    ];

    return (
        <section className="mb-6">
            <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
                <Home size={14} className="text-blue-950 dark:text-blue-300" />
                <ChevronRight size={14} />
                <span>Trang chủ</span>
                <ChevronRight size={14} />
                <span className="text-blue-950 dark:text-blue-300">Đơn hàng của tôi</span>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Đơn hàng của tôi</h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi trạng thái, hủy hoặc xác nhận đơn hàng.
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Tổng cộng {total} đơn hàng
                    </p>
                </div>

                <select
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="h-12 rounded-xl border border-blue-950 bg-white px-4 text-sm font-semibold text-blue-950 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                    {statuses.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>
        </section>
    );
}
