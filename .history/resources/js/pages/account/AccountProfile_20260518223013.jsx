import { ChevronRight, Home } from 'lucide-react';

import MainLayout from '../../layout/MainLayout';

import AccountSidebar from '../../components/account/AccountSidebar';
import ProfileForm from '../../components/account/ProfileForm';
import AccountOverview from '../../components/account/AccountOverview';
import AddressCard from '../../components/account/AddressCard';
import PreferredSettings from '../../components/account/PreferredSettings';
import QuickLinks from '../../components/account/QuickLinks';
import RecentReviews from '../../components/account/RecentReviews';

import { accountUser, accountStats, recentReviews } from '../../data/accountData';

export default function AccountProfile() {
    return (
        <div>
            <Breadcrumb />

            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-blue-950">My Profile</h1>
                <p className="mt-2 text-sm text-slate-500">Manage your personal information and account settings.</p>
            </div>

            <div className="mb-6 flex gap-6 overflow-x-auto border-b border-slate-200">
                {['Personal Info', 'Security', 'Reviews'].map((item, index) => (
                    <button
                        key={item}
                        className={`min-w-max pb-4 text-sm font-bold ${
                            index === 0 ? 'border-b-2 border-blue-700 text-blue-700' : 'text-blue-950'
                        }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            <section className="grid gap-6 xl:grid-cols-[1fr_330px]">
                <ProfileForm user={accountUser} />
                <AccountOverview stats={accountStats} />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_330px]">
                <AddressCard />
                <PreferredSettings />
                <QuickLinks />
            </section>

            <div className="mt-6">
                <RecentReviews reviews={recentReviews} />
            </div>
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex">
            <Home size={14} className="text-blue-950" />
            <ChevronRight size={14} />
            <span>Home</span>
            <ChevronRight size={14} />
            <span>My Account</span>
            <ChevronRight size={14} />
            <span className="text-blue-950">Profile</span>
        </div>
    );
}
