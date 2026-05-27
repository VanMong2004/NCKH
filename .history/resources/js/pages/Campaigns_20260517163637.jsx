import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

import MainLayout from '../layout/MainLayout';

import CampaignFilters from '../components/campaign/CampaignFilters';
import CampaignGrid from '../components/campaign/CampaignGrid';
import CampaignBenefits from '../components/campaign/CampaignBenefits';

import { campaigns } from '../data/campaignData';

export default function Campaigns() {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredCampaigns = useMemo(() => {
        if (activeFilter === 'All') return campaigns;

        return campaigns.filter((item) => item.status === activeFilter);
    }, [activeFilter]);

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <section className="mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-950">All Campaigns</h1>

                    <p className="mt-2 max-w-md text-sm text-slate-500">
                        Discover and support active campaigns from ABC University.
                    </p>
                </section>

                <CampaignFilters active={activeFilter} onChange={setActiveFilter} />

                <CampaignGrid campaigns={filteredCampaigns} />

                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-semibold text-blue-950">
                        Showing 1 to {filteredCampaigns.length} of 24 campaigns
                    </p>

                    <Pagination />
                </div>

                <div className="mt-6 md:hidden">
                    <button className="w-full rounded-lg border border-blue-950 py-3 font-bold text-blue-950">
                        Load More
                    </button>
                </div>

                <CampaignBenefits />
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex">
            <Home size={14} className="text-blue-950" />
            <ChevronRight size={14} />
            <span>Home</span>
            <ChevronRight size={14} />
            <span className="text-blue-950">Campaigns</span>
        </div>
    );
}

function Pagination() {
    return (
        <div className="hidden items-center gap-2 md:flex">
            <PageButton>
                <ChevronLeft size={16} />
            </PageButton>

            {[1, 2, 3].map((page) => (
                <PageButton key={page} active={page === 1}>
                    {page}
                </PageButton>
            ))}

            <PageButton>...</PageButton>
            <PageButton>6</PageButton>

            <PageButton>
                <ChevronRight size={16} />
            </PageButton>

            <select className="ml-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
                <option>8 per page</option>
                <option>12 per page</option>
            </select>
        </div>
    );
}

function PageButton({ children, active = false }) {
    return (
        <button
            className={`flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold ${
                active ? 'border-blue-950 bg-blue-950 text-white' : 'border-slate-200 bg-white text-blue-950'
            }`}
        >
            {children}
        </button>
    );
}
