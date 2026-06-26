import { Bell, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import NotificationIcon from './NotificationIcon';

export default function NotificationDropdown({
    unreadCount = 0,
    refreshKey = 0,
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        loadNotifications();
    }, [user, refreshKey]);

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

    async function loadNotifications() {
        try {
            const result = await notificationService.getNotifications();
            setNotifications(result.notifications.slice(0, 5));
        } catch {}
    }

    async function handleRead(item) {
        try {
            if (!item.isRead) {
                await notificationService.markRead(item.id);

                window.dispatchEvent(
                    new Event('notification-updated')
                );
            }

            setOpen(false);

            if (item.actionUrl) {
                navigate(item.actionUrl);
            }
        } catch {
            setOpen(false);
        }
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

                        <span className="text-xs font-bold text-red-500">{unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc tất cả'}</span>
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
                            <NotificationIcon
                                icon={item.icon}
                                color={item.color}
                                size={18}
                                className="h-10 w-10 rounded-xl"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-blue-950 dark:text-white">{item.title}</p>

                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.message}</p>
                                {item.timeAgo && (
                                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                                        {item.timeAgo}
                                    </p>
                                )}
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
