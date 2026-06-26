import { Inbox } from 'lucide-react';
import { notificationTypeText } from '../../services/mappers/notificationMapper';
import NotificationIcon from './NotificationIcon';

export default function NotificationList({ notifications = [], selectedId, loading, onSelect }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-blue-950 dark:text-white">Danh sách thông báo</h2>
            </div>

            {loading && <div className="p-8 text-center font-semibold text-slate-500">Đang tải thông báo...</div>}

            {!loading && notifications.length === 0 && <EmptyList />}

            {!loading && notifications.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item)}
                            className={`flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                selectedId === item.id
                                    ? 'bg-blue-50 dark:bg-blue-950/30'
                                    : !item.isRead
                                        ? 'bg-blue-50/60 dark:bg-blue-950/10'
                                        : ''
                            }`}
                        >
                            <NotificationIcon
                                icon={item.icon}
                                color={item.color}
                                size={21}
                            />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="line-clamp-1 font-bold text-blue-950 dark:text-white">{item.title}</p>

                                    {!item.isRead && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />}
                                </div>

                                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                                    {item.message}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                    <span>{notificationTypeText(item.type)}</span>
                                    <span>•</span>
                                    <span>{item.timeAgo || formatDate(item.createdAt)}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyList() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                <Inbox size={34} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-blue-950 dark:text-white">Chưa có thông báo</h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Các cập nhật về đơn hàng, thanh toán và khuyến mãi sẽ xuất hiện tại đây.
            </p>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '—';
    if (typeof value === 'string' && value.includes('/')) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN');
}
