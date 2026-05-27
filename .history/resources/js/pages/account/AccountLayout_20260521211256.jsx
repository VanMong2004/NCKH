import { Outlet } from 'react-router-dom';

import MainLayout from '../../layout/MainLayout';
import AccountSidebar from '../../components/account/AccountSidebar';
import AccountMobileTabs from '../../components/account/AccountMobileTabs';

export default function AccountLayout() {
    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <AccountSidebar />

                    <section className="min-w-0">
                    <AccountMobileTabs />
                        <Outlet />
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}
