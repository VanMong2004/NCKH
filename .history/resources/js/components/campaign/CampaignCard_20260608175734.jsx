import { useEffect, useState } from 'react';
import { CalendarDays, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CampaignCard({ campaign }) {
    const isEnded = campaign.status === 'ended';

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative h-44 md:h-48">
                <img
                    src={campaign.thumbnail}
                    alt={campaign.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />

                <StatusBadge status={campaign.status} text={campaign.statusText} />

                <button type="button" className="absolute right-3 top-3 rounded-full bg-blue-950/40 p-2 text-white">
                    <Heart size={18} />
                </button>
            </div>

            <div className="p-4">
                <h3 className="line-clamp-2 font-bold text-blue-950 dark:text-white">{campaign.title}</h3>

                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{campaign.description}</p>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-300">
                    <CalendarDays size={16} />
                    {formatDateRange(campaign.startDate, campaign.endDate)}
                </div>

                <Countdown campaign={campaign} />

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>{campaign.progress}% đã đăng ký</span>
                    <span>
                        {campaign.registeredQuantity} / {campaign.totalQuantity || '—'}
                    </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                        className={`h-full rounded-full ${isEnded ? 'bg-slate-400' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                    />
                </div>

                <Link
                    to={`/campaigns/${campaign.id}`}
                    className={`mt-4 block w-full rounded-lg border py-3 text-center text-sm font-bold ${
                        campaign.status === 'active'
                            ? 'border-blue-950 bg-blue-950 text-white dark:border-blue-700 dark:bg-blue-700'
                            : 'border-blue-950 bg-white text-blue-950 dark:border-blue-300 dark:bg-slate-900 dark:text-blue-300'
                    }`}
                >
                    {campaign.status === 'active'
                        ? 'Xem và đăng ký'
                        : campaign.status === 'upcoming'
                          ? 'Xem chi tiết'
                          : 'Xem kết quả'}
                </Link>
            </div>
        </article>
    );
}

function StatusBadge({ status, text }) {
    const style = status === 'active' ? 'bg-green-500' : status === 'upcoming' ? 'bg-orange-400' : 'bg-slate-500';

    return (
        <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-bold text-white ${style}`}>
            {text}
        </span>
    );
}


function formatDateRange(start, end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('vi-VN');
}
