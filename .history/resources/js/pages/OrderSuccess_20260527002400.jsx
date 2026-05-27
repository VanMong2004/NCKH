import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Info, MapPin, Phone } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import MainLayout from '../layout/MainLayout';
import orderService from '../services/orderService';

export default function OrderSuccess() {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    async function loadOrder() {
        try {
            setLoading(true);
            setError('');

            const result = await orderService.getOrderDetail(orderId);

            setOrder(result);
        } catch (err) {
            setError(err.message || 'Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-5xl px-4 py-10 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-950 dark:border-slate-700 dark:border-t-blue-400" />
                    <p className="mt-3 font-semibold text-slate-500 dark:text-slate-400">Đang tải đơn hàng...</p>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-5xl px-4 py-10 text-center">
                    <p className="font-bold text-red-500">{error}</p>

                    <button
                        onClick={loadOrder}
                        className="mt-4 rounded-xl bg-blue-950 px-5 py-3 text-white dark:bg-blue-700"
                    >
                        Tải lại
                    </button>
                </div>
            </MainLayout>
        );
    }

    if (!order) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-5xl px-4 py-10 text-center">
                    <p className="font-bold text-slate-600 dark:text-slate-300">Không tìm thấy thông tin đơn hàng.</p>

                    <Link
                        to="/account/orders"
                        className="mt-4 inline-block rounded-xl bg-blue-950 px-5 py-3 text-white dark:bg-blue-700"
                    >
                        Xem đơn hàng của tôi
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-5xl px-4 py-6">
                <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                        <CheckCircle2 size={44} />
                    </div>

                    <h1 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        Đặt hàng thành công
                    </h1>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Hệ thống đã ghi nhận đơn hàng của bạn.
                    </p>

                    <div className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-sm dark:bg-slate-900 dark:text-white">
                        Mã đơn hàng: {order.code}
                    </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <Card title="Thông tin đơn hàng">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoBox label="Mã đơn hàng" value={order.code} />
                                <InfoBox label="Trạng thái" value={order.statusText} />
                                <InfoBox
                                    label="Thanh toán"
                                    value={order.payment?.statusText || 'Chưa tạo thanh toán'}
                                />
                                <InfoBox label="Phương thức" value={order.payment?.methodText || 'Chưa xác định'} />
                                <InfoBox label="Ngày đặt" value={formatDate(order.createdAt)} />
                                <InfoBox label="Tổng tiền" value={formatMoney(order.summary?.grandTotal)} />
                            </div>
                        </Card>

                        <Card title="Thông tin nhận hàng">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoBox label="Người nhận" value={order.receiver?.name} />
                                <InfoBox label="Số điện thoại" value={order.receiver?.phone} />
                                <div className="sm:col-span-2">
                                    <InfoBox label="Địa chỉ" value={order.receiver?.address} />
                                </div>
                            </div>
                        </Card>

                        <Card title="Sản phẩm đã đặt">
                            <div className="space-y-3">
                                {(order.items || []).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                                    >
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                                            <img
                                                src={item.thumbnail}
                                                alt={item.productName}
                                                className="max-h-full max-w-full object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/no-image.png';
                                                }}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 font-bold text-blue-950 dark:text-white">
                                                {item.productName}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {item.variant?.size && <>Size: {item.variant.size}</>}
                                                {item.variant?.size && item.variant?.color && ' · '}
                                                {item.variant?.color && <>Màu: {item.variant.color}</>}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                SL: {item.quantity} · {formatMoney(item.price)}
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-blue-950 dark:text-blue-300">
                                            {formatMoney(item.total)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Tổng kết thanh toán">
                            <div className="space-y-3 text-sm">
                                <Row label="Tạm tính" value={formatMoney(order.summary?.subTotal)} />
                                <Row label="Phí vận chuyển" value={formatMoney(order.summary?.shippingFee)} />
                                <Row label="Giảm giá" value={formatMoney(order.summary?.discount)} />
                                <div className="border-t border-slate-200 pt-3 dark:border-slate-800" />
                                <Row label="Tổng cộng" value={formatMoney(order.summary?.grandTotal)} strong />
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Tiến trình đơn hàng">
                            <div className="space-y-4">
                                {(order.timeline || []).map((step, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                step.done
                                                    ? 'bg-blue-950 text-white dark:bg-blue-700'
                                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                            }`}
                                        >
                                            {step.done ? <CheckCircle2 size={20} /> : <Circle size={18} />}
                                        </div>

                                        <div>
                                            <p className="font-bold text-blue-950 dark:text-white">{step.label}</p>

                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {step.time || 'Đang chờ cập nhật'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Hướng dẫn nhận hàng">
                            <Guide icon={MapPin}>
                                {order.pickup.location || 'Nhận hàng tại điểm giao của cửa hàng.'}
                            </Guide>

                            <Guide icon={Info}>
                                {order.pickup.instruction || 'Mang theo thông tin đơn hàng khi đến nhận sản phẩm.'}
                            </Guide>

                            <Guide icon={Phone}>Vui lòng giữ liên lạc để nhân viên xác nhận khi cần.</Guide>
                        </Card>
                    </div>
                </section>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        to={`/account/orders/${order.id}`}
                        className="rounded-xl bg-blue-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        Xem chi tiết đơn hàng
                    </Link>

                    <Link
                        to="/shop"
                        className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </main>
        </MainLayout>
    );
}

function Card({ title, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-blue-950 dark:text-white">{title}</h2>
            {children}
        </section>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 font-bold text-blue-950 dark:text-white">{value || '—'}</p>
        </div>
    );
}

function Row({ label, value, strong = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>

            <span
                className={`text-right ${
                    strong
                        ? 'text-xl font-extrabold text-blue-950 dark:text-blue-300'
                        : 'font-bold text-blue-950 dark:text-white'
                }`}
            >
                {value}
            </span>
        </div>
    );
}

function Guide({ icon: Icon, children }) {
    return (
        <div className="mb-4 flex gap-3 last:mb-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                <Icon size={18} />
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{children}</p>
        </div>
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

    if (typeof value === 'string' && value.includes('/')) {
        return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('vi-VN');
}
