import { useEffect, useState } from 'react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BottomNavigation from '../components/layout/BottomNavigation';
import FloatingAIChat from '../components/ai/FloatingAIChat';
import homeService from '../services/homeService';
import notificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout({
    children,
    siteContent: initialSiteContent,
}) {
    const { user, isLoading } = useAuth();
    const [siteContent, setSiteContent] = useState(initialSiteContent || null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);

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

        function handleRefresh(){

            loadUnread();

            setNotificationRefreshKey(v=>v+1);

        }

        window.addEventListener(
            'notification-updated',
            handleRefresh
        );

        return ()=>{

            window.removeEventListener(
                'notification-updated',
                handleRefresh
            );

        };

    }, []);

    async function loadSiteContent() {
        try {
            const data = await homeService.getHomeData();

            setSiteContent(data.siteContent || data.site_content || null);
        } catch (error) {
            console.error('LOAD MAIN LAYOUT SITE CONTENT ERROR:', error);
            setSiteContent(null);
        }
    }

    async function loadUnread(){

        if (!user) {
            setUnreadCount(0);
            return;
        }

        try{

            const count =
                await notificationService.getUnreadCount();

            setUnreadCount(count);

        }catch{}

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
