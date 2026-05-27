import { Bell } from 'lucide-react';
import { notificationTypeText } from '../../services/mappers/notificationMapper';

export default function NotificationDetail({ selected }) {
    if (!selected) {
        return (
            <aside className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                    <Bell size={34} />
                </div>

                <h2 className="mt-4 text-lg font-bold text-blue-950 dark:text-white">Chọn thông báo</h2>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Nội dung chi tiết sẽ hiển thị tại đây.
                </p>
            </aside>
        );
    }

    return (
        <aside className="h-max rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:sticky xl:top-28">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-5xl dark:bg-slate-800">
                {selected.icon}
            </div>

            <h2 className="mt-5 text-center text-xl font-extrabold text-blue-950 dark:text-white">{selected.title}</h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">{selected.message}</p>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <InfoRow label="Loại thông báo" value={notificationTypeText(selected.type)} />
                <InfoRow label="Thời gian" value={formatDate(selected.createdAt)} />
                <InfoRow label="Trạng thái" value={selected.isRead ? 'Đã đọc' : 'Chưa đọc'} />
            </div>

            {selected.actionUrl && (
                <a
                    href={selected.actionUrl}
                    className="mt-5 block rounded-xl bg-blue-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700"
                >
                    Xem chi tiết
                </a>
            )}
        </aside>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>

            <span className="text-right font-bold text-blue-950 dark:text-white">{value || '—'}</span>
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
