import CampaignCard from './CampaignCard';

export default function CampaignGrid({ campaigns = [] }) {
    return (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
        </section>
    );
}
