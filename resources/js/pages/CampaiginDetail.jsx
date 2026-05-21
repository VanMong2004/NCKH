import { ChevronRight, Home } from 'lucide-react';

import MainLayout from '../layout/MainLayout';

import CampaignHero from '../components/campaignDetail/CampaignHero';
import CampaignStats from '../components/campaignDetail/CampaignStats';
import CampaignTabs from '../components/campaignDetail/CampaignTabs';
import CampaignTimeline from '../components/campaignDetail/CampaignTimeline';
import CampaignProducts from '../components/campaignDetail/CampaignProducts';
import CampaignFAQ from '../components/campaignDetail/CampaignFAQ';
import CampaignRegisterForm from '../components/campaignDetail/CampaignRegisterForm';
import CampaignBottomBenefits from '../components/campaignDetail/CampaignBottomBenefits';

import { campaignDetail, campaignProducts, campaignFAQ } from '../data/campaignDetailData';

export default function CampaignDetail() {
    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div>
                        <CampaignHero campaign={campaignDetail} />
                        <CampaignStats campaign={campaignDetail} />
                        <CampaignTabs />
                        <CampaignTimeline />
                        <CampaignProducts products={campaignProducts} />
                        <CampaignFAQ items={campaignFAQ} />
                    </div>

                    <CampaignRegisterForm />
                </section>

                <CampaignBottomBenefits />
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
            <span>Campaigns</span>
            <ChevronRight size={14} />
            <span className="text-blue-950">Đồng phục ABC 2024</span>
        </div>
    );
}
