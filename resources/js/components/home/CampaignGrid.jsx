import CampaignCard from './CampaignCard';
import SectionHeader from '../ui/SectionHeader';

export default function CampaignGrid({ campaigns }) {
    return (
        <section className="mt-8">
            <SectionHeader title="Active Campaigns" />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {campaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>
        </section>
    );
}
