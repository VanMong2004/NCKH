export default function CampaignHero({ campaign }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img src={campaign.banner} alt={campaign.title} className="h-[220px] w-full object-cover md:h-[360px]" />
        </section>
    );
}
