import { useEffect, useState } from 'react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BottomNavigation from '../components/layout/BottomNavigation';
import FloatingAIChat from '../components/ai/FloatingAIChat';
import homeService from '../services/homeService';
import notificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import useRealtimeNotifications from '../hooks/useRealtimeNotifications';

export default function MainLayout({
    children,
    siteContent: initialSiteContent,
}) {
    const { user, isLoading } = useAuth();
    const [siteContent, setSiteContent] = useState(initialSiteContent || null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
    const [realtimeEnabled, setRealtimeEnabled] = useState(Boolean(window.__CTUT_REALTIME__?.enabled));

    useRealtimeNotifications(user, () => {
        loadUnread();
        setNotificationRefreshKey((key) => key + 1);
    });

    useEffect(() => {
        if (initialSiteContent) {
            setSiteContent(initialSiteContent);
        } else {
            loadSiteContent();
        }

        if (!isLoading && user) {
            loadUnread();
        } else {
            setUnreadCount(0);
        }
    }, [initialSiteContent, isLoading, user]);

    useEffect(() => {
        function handleRefresh() {
            loadUnread();
            setNotificationRefreshKey((v) => v + 1);
        }

        window.addEventListener('notification-updated', handleRefresh);

        return () => {
            window.removeEventListener('notification-updated', handleRefresh);
        };
    }, []);

    useEffect(() => {
        function handleRealtimeStatus(event) {
            const detail = event?.detail || {};

            setRealtimeEnabled(Boolean(detail.enabled));
        }

        window.addEventListener('ctut-realtime-status', handleRealtimeStatus);

        return () => {
            window.removeEventListener('ctut-realtime-status', handleRealtimeStatus);
        };
    }, []);

    useEffect(() => {
        if (!user) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            loadUnread();
            setNotificationRefreshKey((key) => key + 1);
        }, realtimeEnabled ? 45000 : 20000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [realtimeEnabled, user]);

    async function loadSiteContent() {
        try {
            const data = await homeService.getSiteContent();

            setSiteContent(data || null);
        } catch (error) {
            console.error('LOAD MAIN LAYOUT SITE CONTENT ERROR:', error);
            setSiteContent(null);
        }
    }

    async function loadUnread() {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        try {
            const count = await notificationService.getUnreadCount();

            setUnreadCount(count);
        } catch {}
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:pb-0">
            <Navbar
                siteContent={siteContent}
                unreadCount={unreadCount}
                notificationRefreshKey={notificationRefreshKey}
            />

            <div className="min-h-[calc(100vh-160px)]">{children}</div>

            <Footer footer={siteContent?.footer} />

            <BottomNavigation
                bottomNavigation={siteContent?.bottom_navigation}
            />

            <FloatingAIChat />
        </div>
    );
}
