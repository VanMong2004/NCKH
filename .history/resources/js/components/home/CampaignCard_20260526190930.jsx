import { CalendarDays, Clock3, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import Badge from '../ui/Badge';

export default function CampaignCard({ campaign }) {
    const timeLabels = ['NGÀY', 'GIỜ', 'PHÚT', 'GIÂY'];
    const statusVariant = getStatusVariant(campaign.status);

    return (
        <article className="group overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <Link to={campaign.detailUrl || `/campaigns/${campaign.slug || campaign.id}`}>
                <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                        src={campaign.image}
                        alt={campaign.title}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = '/images/no-image.png';
                        }}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute left-3 top-3">
                        <Badge variant={statusVariant}>{getStatusLabel(campaign.status)}</Badge>
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="line-clamp-2 text-base font-black leading-snug text-blue-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {campaign.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {campaign.description || 'Thông tin chiến dịch đang được cập nhật.'}
                    </p>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                        {(campaign.time || [0, 0, 0, 0]).map((item, index) => (
                            <div key={index} className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-950">
                                <p className="text-sm font-black text-blue-950 dark:text-white">{item}</p>

                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                    {timeLabels[index]}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={14} />
                            {campaign.countdownSeconds > 0 ? 'Còn thời gian' : 'Đã kết thúc'}
                        </span>

                        {campaign.limit ? (
                            <span className="inline-flex items-center gap-1.5">
                                <UsersRound size={14} />
                                Giới hạn {campaign.limit}
                            </span>
                        ) : null}
                    </div>
                </div>
            </Link>
        </article>
    );
}

function getStatusVariant(status) {
    const value = String(status || '').toLowerCase();

    if (value.includes('open') || value.includes('active')) return 'open';
    if (value.includes('upcoming')) return 'upcoming';

    return 'default';
}

function getStatusLabel(status) {
    const value = String(status || '').toLowerCase();

    if (value.includes('open') || value.includes('active')) return 'Đang mở';
    if (value.includes('upcoming')) return 'Sắp diễn ra';
    if (value.includes('closed')) return 'Đã đóng';

    return 'Chiến dịch';
}
