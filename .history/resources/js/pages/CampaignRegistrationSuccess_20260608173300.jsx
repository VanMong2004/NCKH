import { ChevronRight, Home } from 'lucide-react';

import MainLayout from '../layout/MainLayout';

import CampaignSuccessHero from '../components/campaignSuccess/CampaignSuccessHero';
import NextSteps from '../components/campaignSuccess/NextSteps';
import ImportantNote from '../components/campaignSuccess/ImportantNote';

import { campaignSuccess, nextSteps } from '../data/campaignSuccessData';

export default function CampaignRegistrationSuccess() {
    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb />

                <CampaignSuccessHero data={campaignSuccess} />

                <NextSteps steps={nextSteps} />

                <ImportantNote />

                <section className="mt-8 grid gap-4 md:grid-cols-3">
                    <a
                        href="/orders"
                        className="flex items-center justify-center rounded-lg bg-blue-950 py-4 font-bold text-white"
                    >
                        Xem đơn của tôi
                    </a>

                    <a
                        href="/"
                        className="flex items-center justify-center rounded-lg border border-blue-950 py-4 font-bold text-blue-950"
                    >
                        Về trang chủ
                    </a>

                    <a
                        href="/campaigns"
                        className="flex items-center justify-center rounded-lg border border-blue-950 py-4 font-bold text-blue-950"
                    >
                        Xem chiến dịch khác
                    </a>
                </section>
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex">
            <Home size={14} className="text-blue-950" />
            <ChevronRight size={14} />
            <span>Chiến dịch</span>
            <ChevronRight size={14} />
            <span>Đồng phục ABC 2024</span>
            <ChevronRight size={14} />
            <span className="text-blue-950">Registration Success</span>
        </div>
    );
}
