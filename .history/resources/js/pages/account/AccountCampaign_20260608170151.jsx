import { useEffect, useState } from 'react';
import { CalendarDays, Megaphone, PackageCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import campaignService from '../../services/campaignService';

export default function AccountCampaign() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMyCampaigns();
    }, []);

    async function loadMyCampaigns() {
        try {
            setLoading(true);

            const result = await campaignService.getMyCampaigns();

            setItems(result);
        } catch (error) {
            toast.error(error.message || 'Không thể tải chiến dịch đã đăng ký');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Chiến dịch của tôi</h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi các chiến dịch bạn đã đăng ký.
                    </p>
                </div>

                {loading && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                        Đang tải dữ liệu...
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                        <Megaphone size={44} className="mx-auto text-blue-950 dark:text-blue-300" />

                        <h2 className="mt-4 text-lg font-bold text-blue-950 dark:text-white">
                            Chưa đăng ký chiến dịch nào
                        </h2>

                        <Link
                            to="/campaigns"
                            className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
                        >
                            Xem chiến dịch
                        </Link>
                    </div>
                )}

                {!loading && items.length > 0 && (
                    <section className="grid gap-4">
                        {items.map((item) => (
                            <CampaignRegistrationCard key={item.id} item={item} />
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <span>Tài khoản</span>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Địa chỉ</span>
        </div>
    );
}

function CampaignRegistrationCard({ item }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="font-extrabold text-blue-950 dark:text-white">
                        {item.campaignTitle || item.title || 'Chiến dịch'}
                    </h2>

                    <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                            <PackageCheck size={16} />
                            {item.itemCount || item.quantity || 0} sản phẩm
                        </p>

                        <p className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            {formatDate(item.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                    <StatusBadge status={item.status} text={item.statusText} />

                    <Link
                        to={`/account/campaigns/${item.id}`}
                        className="rounded-xl bg-blue-950 px-5 py-3 text-center text-sm font-bold text-white dark:bg-blue-700"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </article>
    );
}

function StatusBadge({ status, text }) {
    const style =
        status === 'completed'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : status === 'cancelled'
              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{text || status || 'Đã đăng ký'}</span>
    );
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN');
}
