import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Home, Package, ReceiptText, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import campaignService from '../../services/campaignService';

export default function AccountCampaignDetail() {
    const { id } = useParams();

    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetail();
    }, [id]);

    async function loadDetail() {
        try {
            setLoading(true);

            const result = await campaignService.getMyCampaignDetail(id);

            setCampaign(result);
        } catch (error) {
            toast.error(error.message || 'Không thể tải chi tiết chiến dịch');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                Đang tải chi tiết chiến dịch...
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-blue-950 dark:text-white">Không tìm thấy thông tin đăng ký</h2>

                <Link
                    to="/account/campaigns"
                    className="mt-4 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
                >
                    Quay lại
                </Link>
            </div>
        );
    }

    return (
        <div>
            <Breadcrumb />
            <div className="space-y-6">
                <Link
                    to="/account/campaigns"
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-950 dark:text-blue-300"
                >
                    <ChevronLeft size={18} />
                    Quay lại chiến dịch của tôi
                </Link>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">
                                {campaign.campaignTitle || 'Chiến dịch'}
                            </h1>

                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Chi tiết đăng ký chiến dịch của bạn.
                            </p>
                        </div>

                        <StatusBadge status={campaign.status} text={campaign.statusText} />
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <InfoBox icon={CalendarDays} label="Ngày đăng ký" value={formatDate(campaign.createdAt)} />

                        <InfoBox
                            icon={Package}
                            label="Số lượng"
                            value={`${campaign.quantity || campaign.itemCount || 0} sản phẩm`}
                        />

                        <InfoBox icon={ReceiptText} label="Tổng tiền" value={formatMoney(campaign.total)} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-bold text-blue-950 dark:text-white">Sản phẩm đã đăng ký</h2>

                    {campaign.items?.length > 0 ? (
                        <div className="space-y-3">
                            {campaign.items.map((item, index) => (
                                <RegisteredItem key={item.id || index} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            Chưa có dữ liệu sản phẩm chi tiết.
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
                    <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-950 dark:bg-slate-900 dark:text-blue-300">
                            <Truck size={20} />
                        </div>

                        <div>
                            <h2 className="font-bold text-blue-950 dark:text-white">Hướng dẫn nhận sản phẩm</h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                Theo dõi thông báo từ hệ thống hoặc liên hệ bộ phận phụ trách để biết thời gian nhận sản
                                phẩm. Khi đến nhận, vui lòng cung cấp thông tin tài khoản hoặc mã đăng ký nếu được yêu
                                cầu.
                            </p>
                        </div>
                    </div>
                </section>
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

function RegisteredItem({ item }) {
    const product = item.product || item.campaign_item?.product || item.campaignItem?.product || {};

    const variant = item.variant || item.campaign_item?.variant || item.campaignItem?.variant || {};

    const name = product.name || item.product_name || item.name || 'Sản phẩm';

    const thumbnail = product.thumbnail || item.thumbnail || '/images/no-image.png';

    const quantity = Number(item.quantity || 0);

    const price = Number(item.price || item.unit_price || item.campaign_item?.price || 0);

    const total = Number(item.total || price * quantity || 0);

    return (
        <div className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-950">
                <img
                    src={thumbnail}
                    alt={name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                        e.currentTarget.src = '/images/no-image.png';
                    }}
                />
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-bold text-blue-950 dark:text-white">{name}</h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Size: {variant.size || item.size || '—'} · Màu: {variant.color || item.color || '—'}
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Số lượng: {quantity}</p>
            </div>

            <div className="text-right">
                <p className="text-sm font-bold text-blue-950 dark:text-blue-300">{formatMoney(price)}</p>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tổng: {formatMoney(total)}</p>
            </div>
        </div>
    );
}

function InfoBox({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Icon size={17} />
                <span className="text-sm font-semibold">{label}</span>
            </div>

            <p className="mt-2 font-bold text-blue-950 dark:text-white">{value || '—'}</p>
        </div>
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
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style}`}>
            {text || status || 'Đã đăng ký'}
        </span>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN');
}
