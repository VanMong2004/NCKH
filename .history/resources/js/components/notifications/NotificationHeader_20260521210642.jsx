import { CheckCheck, RefreshCw } from 'lucide-react';

export default function NotificationHeader({ unreadCount = 0, onReload, onMarkAllRead }) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Thông báo</h1>

                    {unreadCount > 0 && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
                            {unreadCount} chưa đọc
                        </span>
                    )}
                </div>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Theo dõi cập nhật về đơn hàng, thanh toán và chiến dịch.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onReload}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                >
                    <RefreshCw size={16} />
                    Tải lại
                </button>

                <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                >
                    <CheckCheck size={16} />
                    Đánh dấu tất cả
                </button>
            </div>
        </div>
    );
}
