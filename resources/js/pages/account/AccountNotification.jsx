import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import useRealtimeNotifications from '../../hooks/useRealtimeNotifications';
import { mapNotification } from '../../services/mappers/notificationMapper';

import NotificationHeader from '../../components/notifications/NotificationHeader';
import NotificationTabs from '../../components/notifications/NotificationTabs';
import NotificationList from '../../components/notifications/NotificationList';
import NotificationDetail from '../../components/notifications/NotificationDetail';

export default function AccountNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            loadData();
        }, 20000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    useRealtimeNotifications(user, (incomingNotification) => {
        const mapped = mapNotification(incomingNotification);

        setNotifications((prev) => {
            const exists = prev.some((item) => item.id === mapped.id);

            if (exists) {
                return prev.map((item) => (item.id === mapped.id ? mapped : item));
            }

            return [mapped, ...prev];
        });

        setSelected((prev) => prev || mapped);
    });

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
        <div>
            <div className="space-y-2">
                <NotificationHeader unreadCount={unreadCount} onReload={loadData} onMarkAllRead={handleMarkAllRead} />

                <NotificationTabs activeTab={activeTab} onChange={setActiveTab} notifications={notifications} />

                <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_420px]">
                    <NotificationList
                        notifications={filteredNotifications}
                        selectedId={selected?.id}
                        loading={loading}
                        onSelect={handleSelect}
                    />

                    <NotificationDetail selected={selected} />
                </section>
            </div>
        </div>
    );
}
