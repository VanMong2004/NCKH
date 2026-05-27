import Badge from '../ui/Badge';

export default function CampaignCard({ campaign }) {
    const timeLabels = ['DAYS', 'HRS', 'MINS', 'SECS'];

    const progress = Math.min((campaign.joined / campaign.total) * 100, 100);

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-32 md:h-40">
                <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover" />

                <div className="absolute left-3 top-3">
                    <Badge variant={campaign.status === 'OPEN' ? 'open' : 'upcoming'}>{campaign.status}</Badge>
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-blue-950">{campaign.title}</h3>

                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{campaign.description}</p>

                <div className="mt-4 grid grid-cols-4 gap-2">
                    {campaign.time.map((item, index) => (
                        <div key={index} className="rounded-lg bg-slate-50 p-2 text-center">
                            <p className="font-bold text-blue-950">{item}</p>
                            <p className="text-[10px] text-slate-500">{timeLabels[index]}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${progress}%` }} />
                </div>

                <p className="mt-2 text-right text-xs text-slate-500">
                    <span className="font-bold text-green-600">{campaign.joined}</span> / {campaign.total} joined
                </p>
            </div>
        </article>
    );
}
