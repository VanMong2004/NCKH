import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';

import CampaignHero from '../components/campaignDetail/CampaignHero';
import CampaignStats from '../components/campaignDetail/CampaignStats';
import CampaignTabs from '../components/campaignDetail/CampaignTabs';
import CampaignTimeline from '../components/campaignDetail/CampaignTimeline';
import CampaignProducts from '../components/campaignDetail/CampaignProducts';
import CampaignFAQ from '../components/campaignDetail/CampaignFAQ';
import CampaignRegisterForm from '../components/campaignDetail/CampaignRegisterForm';
import CampaignBottomBenefits from '../components/campaignDetail/CampaignBottomBenefits';

import campaignService from '../services/campaignService';

export default function CampaignDetail() {
    const { id } = useParams();

    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaign();
    }, [id]);

    async function loadCampaign() {
        try {
            setLoading(true);

            const data = await campaignService.getCampaignDetail(id);

            setCampaign(data);
        } catch (error) {
            toast.error(error.message || 'Không tải được chiến dịch');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-7xl px-4 py-20 text-center">Đang tải chiến dịch...</div>
            </MainLayout>
        );
    }

    if (!campaign) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-7xl px-4 py-20 text-center">Không tìm thấy chiến dịch</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb title={campaign.title} />

                <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div>
                        <CampaignHero campaign={campaign} />

                        <CampaignStats campaign={campaign} />

                        <CampaignTabs />

                        <CampaignTimeline campaign={campaign} />

                        <CampaignProducts products={campaign.items} />

                        <CampaignFAQ />
                    </div>

                    <CampaignRegisterForm campaign={campaign} />
                </section>

                <CampaignBottomBenefits />
            </main>
        </MainLayout>
    );
}

function Breadcrumb({ title }) {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex">
            <Home size={14} className="text-blue-950" />

            <ChevronRight size={14} />

            <span>Trang chủ</span>

            <ChevronRight size={14} />

            <span>Chiến dịch</span>

            <ChevronRight size={14} />

            <span className="text-blue-950">{title}</span>
        </div>
    );
}
