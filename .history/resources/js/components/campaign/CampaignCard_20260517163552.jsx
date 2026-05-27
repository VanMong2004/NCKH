import { CalendarDays, Heart } from 'lucide-react';

export default function CampaignCard({ campaign }) {
    const isClosed = campaign.status === 'Closed';
    const labels = ['Days', 'Hours', 'Mins', 'Secs'];

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-44 md:h-48">
                <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover" />

                <StatusBadge status={campaign.status} />

                <button className="absolute right-3 top-3 rounded-full bg-blue-950/40 p-2 text-white">
                    <Heart size={18} />
                </button>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-blue-950">{campaign.title}</h3>

                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{campaign.desc}</p>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-950">
                    <CalendarDays size={16} />
                    {campaign.dateLabel}
                </div>

                {campaign.time ? (
                    <div
                        className={`mt-4 grid grid-cols-4 gap-2 rounded-xl p-3 ${
                            campaign.status === 'Upcoming' ? 'bg-orange-50' : 'bg-green-50'
                        }`}
                    >
                        {campaign.time.map((item, index) => (
                            <div key={index} className="text-center">
                                <p
                                    className={`font-extrabold ${
                                        campaign.status === 'Upcoming' ? 'text-orange-500' : 'text-green-700'
                                    }`}
                                >
                                    {item}
                                </p>
                                <p className="text-[11px] text-slate-500">{labels[index]}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl bg-slate-100 py-4 text-center text-sm font-bold text-slate-500">
                        Campaign Ended
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                    <span>{campaign.funded}% funded</span>
                    <span>
                        {campaign.current} / {campaign.total} items
                    </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full ${isClosed ? 'bg-slate-400' : 'bg-green-500'}`}
                        style={{ width: `${campaign.funded}%` }}
                    />
                </div>

                <button
                    className={`mt-4 w-full rounded-lg border py-3 text-sm font-bold ${
                        campaign.status === 'Opening'
                            ? 'border-blue-950 bg-blue-950 text-white'
                            : 'border-blue-950 bg-white text-blue-950'
                    }`}
                >
                    {campaign.action}
                </button>
            </div>
        </article>
    );
}

function StatusBadge({ status }) {
    const style = status === 'Opening' ? 'bg-green-500' : status === 'Upcoming' ? 'bg-orange-400' : 'bg-slate-400';

    return (
        <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-bold text-white ${style}`}>
            {status}
        </span>
    );
}
