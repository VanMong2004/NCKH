import { Outlet } from 'react-router-dom';

import MainLayout from '../../layout/MainLayout';
import AccountSidebar from '../../components/account/AccountSidebar';

export default function AccountLayout() {
    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <AccountSidebar />
                    <AccountSidebar />

                    <section className="min-w-0">
                        <Outlet />
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}
