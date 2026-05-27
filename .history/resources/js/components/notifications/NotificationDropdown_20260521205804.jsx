import { Bell, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import notificationService from '../../services/notificationService';

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const dropdownRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    async function loadData() {
        try {
            const result = await notificationService.getNotifications();

            setNotifications(result.notifications.slice(0, 5));

            const count = await notificationService.getUnreadCount();

            setUnreadCount(count);
        } catch {}
    }

    async function handleRead(item) {
        if (!item.isRead) {
            await notificationService.markRead(item.id);

            loadData();
        }

        setOpen(false);
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <Bell size={22} />

                {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b p-4 dark:border-slate-800">
                        <h2 className="font-bold text-blue-950 dark:text-white">Thông báo</h2>

                        <span className="text-xs font-bold text-red-500">{unreadCount} mới</span>
                    </div>

                    {notifications.length === 0 && (
                        <div className="p-8 text-center">
                            <div className="text-4xl">🔔</div>

                            <p className="mt-3 text-sm text-slate-500">Chưa có thông báo</p>
                        </div>
                    )}

                    {notifications.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleRead(item)}
                            className={`
                                flex
                                w-full
                                gap-3
                                border-b
                                p-4
                                text-left
                                transition
                                hover:bg-slate-50
                                dark:border-slate-800
                                dark:hover:bg-slate-800

                                ${!item.isRead && 'bg-blue-50 dark:bg-blue-950/20'}
                                `}
                        >
                            <div className="text-2xl">{item.icon}</div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-blue-950 dark:text-white">{item.title}</p>

                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.message}</p>
                            </div>
                        </button>
                    ))}

                    <Link
                        to="/account/notifications"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-2 p-4 text-sm font-bold text-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        Xem tất cả
                        <ExternalLink size={16} />
                    </Link>
                </div>
            )}
        </div>
    );
}
