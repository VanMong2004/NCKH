import CampaignCard from './CampaignCard';
import SectionHeader from '../ui/SectionHeader';

export default function CampaignGrid({ activeCampaigns = [], upcomingCampaigns = [] }) {
    const campaigns = activeCampaigns.length > 0 ? activeCampaigns : upcomingCampaigns;
    const title = activeCampaigns.length > 0 ? 'Chiến dịch đang diễn ra' : 'Chiến dịch sắp diễn ra';

    return (
        <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title={title} to="/campaigns" actionText="Xem tất cả" />

            {campaigns.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {campaigns.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Hiện chưa có chiến dịch đang hiển thị.
                    </p>
                </div>
            )}
        </section>
    );
}
