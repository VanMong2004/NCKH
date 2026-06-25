import { useEffect, useState } from 'react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BottomNavigation from '../components/layout/BottomNavigation';
import FloatingAIChat from '../components/ai/FloatingAIChat';
import homeService from '../services/homeService';

export default function MainLayout({
    children,
    siteContent: initialSiteContent,
}) {
    const [siteContent, setSiteContent] = useState(initialSiteContent || null);

    useEffect(() => {
        if (initialSiteContent) {
            setSiteContent(initialSiteContent);
            return;
        }

        loadSiteContent();
    }, [initialSiteContent]);

    async function loadSiteContent() {
        try {
            const data = await homeService.getHomeData();

            setSiteContent(data.siteContent || data.site_content || null);
        } catch (error) {
            console.error('LOAD MAIN LAYOUT SITE CONTENT ERROR:', error);
            setSiteContent(null);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:pb-0">
            <Navbar siteContent={siteContent} />

            <div className="min-h-[calc(100vh-160px)]">{children}</div>

            <Footer footer={siteContent?.footer} />

            <BottomNavigation
                bottomNavigation={siteContent?.bottom_navigation}
            />

            <FloatingAIChat />
        </div>
    );
}