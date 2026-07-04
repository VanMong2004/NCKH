import {
    BadgePercent,
    BarChart3,
    Bot,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Star,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import StatCard from '../components/ui/StatCard';
import { formatMoney, formatNumber } from '../mappers/adminAnalyticMapper';
import adminAnalyticService from '../services/adminAnalyticService';

const modules = [
    {
        title: 'Sản phẩm',
        desc: 'Quản lý sản phẩm, phân loại, hình ảnh, giá bán và tồn kho.',
        to: '/admin/products',
        icon: Package,
    },
    {
        title: 'Khuyến mãi',
        desc: 'Tạo chương trình giảm giá và sản phẩm áp dụng.',
        to: '/admin/promotions',
        icon: BadgePercent,
    },
    {
        title: 'Đơn hàng',
        desc: 'Theo dõi đơn hàng, thanh toán và trạng thái giao hàng.',
        to: '/admin/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Người dùng',
        desc: 'Quản lý khách hàng, tài khoản admin và trạng thái tài khoản.',
        to: '/admin/users',
        icon: Users,
    },
    {
        title: 'Đánh giá',
        desc: 'Kiểm duyệt đánh giá sản phẩm và hình ảnh khách hàng gửi.',
        to: '/admin/reviews',
        icon: Star,
    },
    {
        title: 'Nội dung site',
        desc: 'Quản lý menu, slider, chân trang và nội dung động.',
        to: '/admin/site-content',
        icon: ClipboardList,
    },
    {
        title: 'Tài liệu AI',
        desc: 'Upload, bật/tắt và quản lý tài liệu tri thức cho chatbot.',
        to: '/admin/chat-knowledge',
        icon: Bot,
    },
    {
        title: 'Thống kê',
        desc: 'Xem doanh thu, đơn hàng và sản phẩm bán chạy.',
        to: '/admin/analytics',
        icon: BarChart3,
    },
];

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOverview();
    }, []);

    async function loadOverview() {
        try {
            setLoading(true);

            const result = await adminAnalyticService.getOverview();

            setOverview(result);
        } catch {
            setOverview(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <LayoutDashboard size={20} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Tổng quan nhanh tình hình vận hành CTUT UniShop.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/admin/analytics"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <BarChart3 size={16} />
                        Xem thống kê
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    label="Doanh thu ghi nhận"
                    value={formatMoney(overview?.revenue || 0)}
                    tone="rose"
                    loading={loading}
                />
                <StatCard
                    label="Tổng đơn hàng"
                    value={formatNumber(overview?.totalOrders || 0)}
                    tone="blue"
                    loading={loading}
                />
                <StatCard
                    label="Chờ xử lý"
                    value={formatNumber(overview?.pendingOrders || 0)}
                    tone="amber"
                    loading={loading}
                />
                <StatCard
                    label="Sản phẩm đang bán"
                    value={formatNumber(overview?.activeProducts || 0)}
                    tone="emerald"
                    loading={loading}
                />
                <StatCard
                    label="Người dùng"
                    value={formatNumber(overview?.totalUsers || 0)}
                    tone="violet"
                    loading={loading}
                />
            </div>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <item.icon size={20} />
                        </div>

                        <h2 className="font-bold text-slate-900 dark:text-white">{item.title}</h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </Link>
                ))}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <FileText size={20} />
                    </div>

                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Gợi ý vận hành</h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Sau khi cập nhật sản phẩm, khuyến mãi hoặc đơn hàng, nên kiểm tra trang thống kê để đối
                            chiếu doanh thu, đơn hàng và sản phẩm bán chạy.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
