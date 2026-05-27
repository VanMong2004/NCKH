export default function CampaignHero({ campaign = {} }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <img
                src={campaign.banner || campaign.thumbnail || '/images/no-image.png'}
                alt={campaign.title || 'Chiến dịch'}
                className="h-[220px] w-full object-cover md:h-[360px]"
                onError={(e) => {
                    e.currentTarget.src = '/images/no-image.png';
                }}
            />

            <div className="p-5">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {campaign.statusText || 'Chiến dịch'}
                </span>

                <h1 className="mt-3 text-2xl font-extrabold text-blue-950 dark:text-white md:text-3xl">
                    {campaign.title}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {campaign.description || 'Thông tin chiến dịch đang được cập nhật.'}
                </p>
            </div>
        </section>
    );
}
