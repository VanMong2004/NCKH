import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

export default function useRealtimeNotifications(user, onNotification) {
    const onNotificationRef = useRef(onNotification);

    useEffect(() => {
        onNotificationRef.current = onNotification;
    }, [onNotification]);

    useEffect(() => {
        if (!user?.id || !window.Echo) return undefined;

        const token = localStorage.getItem('ctut_token');
        const authHeaders = window.Echo?.connector?.pusher?.config?.auth?.headers;

        if (authHeaders) {
            authHeaders.Authorization = token ? `Bearer ${token}` : '';
        }

        const channelName = `users.${user.id}.notifications`;

        const channel = window.Echo.private(channelName).listen('.notification.created', (event) => {
            const notification = event.notification;

            if (!notification) return;

            window.dispatchEvent(
                new CustomEvent('notification-created', {
                    detail: notification,
                }),
            );

            onNotificationRef.current?.(notification);

            toast.info(notification.title || 'Bạn có thông báo mới');
        });

        return () => {
            channel.stopListening('.notification.created');
            window.Echo.leave(channelName);
        };
    }, [user?.id]);
}
