export default function OrdersHeader({ status, onStatusChange, total = 0 }) {
    const statuses = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ xác nhận' },
        { value: 'processing', label: 'Đang chuẩn bị' },
        { value: 'awaiting_receipt', label: 'Đang giao / Sẵn sàng nhận' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
    ];

    return (
        <section className="mb-6">
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
