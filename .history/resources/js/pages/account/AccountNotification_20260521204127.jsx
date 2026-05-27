import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ChevronRight, Home, Inbox, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

import notificationService from '../../services/notificationService';
import { notificationTypeText } from '../../services/mappers/notificationMapper';

const tabs = [
    { value: '', label: 'Tất cả' },
    { value: 'unread', label: 'Chưa đọc' },
    { value: 'order', label: 'Đơn hàng' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'campaign', label: 'Chiến dịch' },
    { value: 'pickup', label: 'Nhận hàng' },
];

export default function AccountNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'unread') {
            return notifications.filter((item) => !item.isRead);
        }

        if (!activeTab) return notifications;

        return notifications.filter((item) => item.type === activeTab);
    }, [notifications, activeTab]);

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    async function loadData() {
        try {
            setLoading(true);

            const result = await notificationService.getNotifications();
            setNotifications(result.notifications);

            if (result.notifications.length > 0) {
                setSelected(result.notifications[0]);
            } else {
                setSelected(null);
            }
        } catch {
            toast.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    }

    async function handleSelect(item) {
        setSelected(item);

        if (!item.isRead) {
            await notificationService.markRead(item.id);
            await loadData();
        }
    }

    async function handleMarkAllRead() {
        try {
            await notificationService.markAllRead();
            toast.success('Đã đánh dấu tất cả là đã đọc');
            await loadData();
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật thông báo');
        }
    }

    return (
        <div className="space-y-6">
            <Breadcrumb />

            <Header unreadCount={unreadCount} onReload={loadData} onMarkAllRead={handleMarkAllRead} />

            <Tabs activeTab={activeTab} onChange={setActiveTab} notifications={notifications} />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <h2 className="font-bold text-blue-950 dark:text-white">Danh sách thông báo</h2>
                    </div>

                    {loading && (
                        <div className="p-8 text-center font-semibold text-slate-500">Đang tải thông báo...</div>
                    )}

                    {!loading && filteredNotifications.length === 0 && <EmptyList />}

                    {!loading && filteredNotifications.length > 0 && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredNotifications.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className={`flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                        selected?.id === item.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                                    }`}
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl dark:bg-slate-800">
                                        {item.icon}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="line-clamp-1 font-bold text-blue-950 dark:text-white">
                                                {item.title}
                                            </p>

                                            {!item.isRead && (
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                            )}
                                        </div>

                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                                            {item.message}
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                            <span>{notificationTypeText(item.type)}</span>
                                            <span>•</span>
                                            <span>{formatDate(item.createdAt)}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <NotificationDetail selected={selected} />
            </section>
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />
            <ChevronRight size={14} />
            <span>Tài khoản</span>
            <ChevronRight size={14} />
            <span className="text-blue-950 dark:text-blue-300">Thông báo</span>
        </div>
    );
}

function Header({ unreadCount, onReload, onMarkAllRead }) {
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

function Tabs({ activeTab, onChange, notifications }) {
    function countBy(type) {
        if (type === 'unread') return notifications.filter((item) => !item.isRead).length;
        if (!type) return notifications.length;
        return notifications.filter((item) => item.type === type).length;
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
                const active = activeTab === tab.value;

                return (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => onChange(tab.value)}
                        className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            active
                                ? 'bg-blue-950 text-white dark:bg-blue-700'
                                : 'border border-slate-200 bg-white text-blue-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab.label} ({countBy(tab.value)})
                    </button>
                );
            })}
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
                Các cập nhật về đơn hàng, thanh toán và chiến dịch sẽ xuất hiện tại đây.
            </p>
        </div>
    );
}

function NotificationDetail({ selected }) {
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
