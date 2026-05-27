import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    const params = useParams();

    const identifier = useMemo(() => {
        return params.id || params.slug || params.campaignId;
    }, [params]);

    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaign();
    }, [identifier]);

    async function loadCampaign() {
        if (!identifier) {
            setLoading(false);
            toast.error('Không xác định được chiến dịch');
            return;
        }

        try {
            setLoading(true);

            const data = await campaignService.getCampaignDetail(identifier);

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
                <div className="mx-auto max-w-7xl px-4 py-20 text-center font-bold text-blue-950 dark:text-white">
                    Đang tải chiến dịch...
                </div>
            </MainLayout>
        );
    }

    if (!campaign) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-7xl px-4 py-20 text-center">
                    <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">Không tìm thấy chiến dịch</h1>

                    <Link
                        to="/campaigns"
                        className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
                    >
                        Quay lại danh sách chiến dịch
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Breadcrumb title={campaign.title} />

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="min-w-0 space-y-6">
                        <CampaignHero campaign={campaign} />

                        <CampaignStats campaign={campaign} />

                        <CampaignTabs campaign={campaign}/>

                        <CampaignTimeline campaign={campaign} />

                        <CampaignProducts products={campaign.items || []} />

                        <CampaignFAQ />
                    </div>

                    <div className="min-w-0">
                        <CampaignRegisterForm campaign={campaign} />
                    </div>
                </section>

                <CampaignBottomBenefits />
            </main>
        </MainLayout>
    );
}

function Breadcrumb({ title }) {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <Link to="/" className="hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <Link to="/campaigns" className="hover:text-blue-950 dark:hover:text-blue-300">
                Chiến dịch
            </Link>

            <ChevronRight size={14} />

            <span className="line-clamp-1 text-blue-950 dark:text-blue-300">{title}</span>
        </div>
    );
}
