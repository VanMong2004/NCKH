import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BottomNavigation from '../components/layout/BottomNavigation';
import FloatingAIChat from '../components/ai/FloatingAIChat';

// export default function MainLayout({ children }) {
export default function MainLayout({
    children,
    siteContent,
}) {
    return (
        <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:pb-0">
            {/* <Navbar /> */}
            <Navbar siteContent={siteContent} />

            <div className="min-h-[calc(100vh-160px)]">{children}</div>

            {/* <Footer /> */}
            <Footer footer={siteContent?.footer} />

            {/* <BottomNavigation /> */}
            <BottomNavigation
                bottomNavigation={siteContent?.bottom_navigation}
            />

            <FloatingAIChat />
        </div>
    );
}
