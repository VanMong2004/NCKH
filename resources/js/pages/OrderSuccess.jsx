import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock, Info, MapPin, Phone, XCircle } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAuth } from '../contexts/AuthContext';

import MainLayout from '../layout/MainLayout';
import VatInvoiceRequestModal from '../components/order/VatInvoiceRequestModal';

import orderService from '../services/orderService';
import guestOrderService from '../services/guestOrderService';
import paymentService from '../services/paymentService';

export default function OrderSuccess() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get('order_code');
    const orderIdParam = searchParams.get('order_id');
    const paymentStatus = searchParams.get('status');

    const location = useLocation();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paying, setPaying] = useState(false);
    const [vatInvoiceModalOpen, setVatInvoiceModalOpen] = useState(false);
    const [vatInvoiceRequest, setVatInvoiceRequest] = useState(null);
    const [submittingVatInvoice, setSubmittingVatInvoice] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        loadOrder();
    }, [authLoading, orderCode, user]);

    async function loadOrder() {
        try {
            setLoading(true);
            setError('');

            const state = location.state || {};
            const savedGuestOrder = JSON.parse(sessionStorage.getItem('guest_order_success') || '{}');

            const savedOrderId = state.orderId || savedGuestOrder.orderId || orderIdParam;
            const guestEmail = state.guestEmail || savedGuestOrder.guestEmail || '';

            if (!orderCode) {
                setError('Không tìm thấy mã đơn hàng.');
                return;
            }

            const result =
                user && savedOrderId
                    ? await orderService.getOrderDetail(savedOrderId)
                    : guestEmail
                      ? (await guestOrderService.lookup({
                            order_code: orderCode,
                            email: guestEmail,
                        })).order
                      : null;

            if (!result) {
                setError('Không đủ thông tin để tra cứu đơn hàng.');
                return;
            }

            setOrder(result);
        } catch (err) {
            setError(err.message || 'Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    }

    async function openVatInvoiceModal() {
        if (!order) return;

        if (!isOrderPaid(order)) {
            toast.warning('Chỉ đơn hàng đã thanh toán mới được yêu cầu hóa đơn đỏ');
            return;
        }

        try {
            if (user) {
                const result = await orderService.getVatInvoiceRequest(order.id);
                setVatInvoiceRequest(result);
                setVatInvoiceModalOpen(true);
                return;
            }

            const savedGuestOrder = JSON.parse(sessionStorage.getItem('guest_order_success') || '{}');

            const result = await guestOrderService.getVatInvoiceRequest(order.code, {
                guestToken: savedGuestOrder.guestToken,
            });

            setVatInvoiceRequest(result);
            setVatInvoiceModalOpen(true);
        } catch (err) {
            toast.error(err.message || 'Không thể tải yêu cầu hóa đơn đỏ');
        }
    }

    async function submitVatInvoiceRequest(payload) {
        if (!order) return;

        try {
            setSubmittingVatInvoice(true);

            if (user) {
                const result = await orderService.createVatInvoiceRequest(order.id, payload);
                setVatInvoiceRequest(result);
                toast.success(
                    'Hệ thống đã tiếp nhận yêu cầu xuất hóa đơn đỏ. Bộ phận phụ trách sẽ xử lý và gửi hóa đơn cho bạn. Mọi thắc mắc vui lòng liên hệ quản trị viên hỗ trợ.',
                );
                return;
            }

            const savedGuestOrder = JSON.parse(sessionStorage.getItem('guest_order_success') || '{}');

            const result = await guestOrderService.createVatInvoiceRequest(order.code, payload, {
                guestToken: savedGuestOrder.guestToken,
            });

            setVatInvoiceRequest(result);
            toast.success(
                'Hệ thống đã tiếp nhận yêu cầu xuất hóa đơn đỏ. Bộ phận phụ trách sẽ xử lý và gửi hóa đơn cho bạn. Mọi thắc mắc vui lòng liên hệ quản trị viên hỗ trợ.',
            );
        } catch (err) {
            toast.error(err.message || 'Không thể gửi yêu cầu hóa đơn đỏ');
        } finally {
            setSubmittingVatInvoice(false);
        }
    }

    async function handlePayAgain() {
        if (!order?.id) return;

        const method = order.payment?.method || order.raw?.payment_method || '';

        if (method !== 'mock_bank') {
            toast.warning('Phương thức thanh toán này không hỗ trợ thao tác này.');
            return;
        }

        try {
            setPaying(true);

            const payment = await paymentService.pay(order.id, method);

            if (payment.redirectUrl) {
                if (method === 'mock_bank') {
                    const savedGuestOrder = JSON.parse(sessionStorage.getItem('guest_order_success') || '{}');

                    sessionStorage.setItem(
                        'mock_payment_qr',
                        JSON.stringify({
                            order,
                            payment,
                            callbackUrl: payment.redirectUrl,
                            guestPhone: savedGuestOrder.guestPhone || '',
                            isGuest: !user,
                        }),
                    );

                    navigate('/payment/qr', {
                        state: {
                            order,
                            payment,
                            callbackUrl: payment.redirectUrl,
                            guestPhone: savedGuestOrder.guestPhone || '',
                            isGuest: !user,
                        },
                    });

                    return;
                }

                window.location.href = payment.redirectUrl;
                return;
            }

            toast.success(payment.message || 'Đã chuyển sang bước thanh toán.');
            loadOrder();
        } catch (err) {
            toast.error(err.message || 'Không thể chuyển sang bước thanh toán.');
        } finally {
            setPaying(false);
        }
    }

    const hero = useMemo(() => {
        return getHeroState(order, paymentStatus || location.state?.paymentStatus);
    }, [location.state, order, paymentStatus]);

    const canPayAgain = Boolean(order?.actions?.canPayAgain);
    const canRequestVatInvoice = isOrderPaid(order);

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
                        type="button"
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

                    {user ? (
                        <Link
                            to="/account/orders"
                            className="mt-4 inline-block rounded-xl bg-blue-950 px-5 py-3 text-white dark:bg-blue-700"
                        >
                            Xem đơn hàng của tôi
                        </Link>
                    ) : null}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-5xl px-4 py-6">
                <section className={`rounded-3xl border p-8 text-center shadow-sm ${hero.wrapperClass}`}>
                    <div
                        className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${hero.iconClass}`}
                    >
                        <hero.icon size={44} />
                    </div>

                    <h1 className={`text-3xl font-extrabold ${hero.titleClass}`}>{hero.title}</h1>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{hero.description}</p>

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
                                    value={order.payment?.statusText || getPaymentStatusFallback(order)}
                                />
                                <InfoBox
                                    label="Phương thức"
                                    value={order.payment?.methodText || 'Chưa có thông tin thanh toán'}
                                />
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
                                {(order.items || []).map((item) => {
                                    const originalPrice = Number(item.originalPrice || item.price || 0);
                                    const finalPrice = Number(item.finalPrice || item.price || 0);
                                    const hasDiscount = originalPrice > finalPrice;

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                                        >
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                                                <img
                                                    src={item.thumbnail || '/images/no-image.png'}
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
                                                    {item.variant?.size && item.variant?.color && ' • '}
                                                    {item.variant?.color && <>Màu: {item.variant.color}</>}
                                                </p>

                                                {item.promotion?.title && (
                                                    <p className="mt-1 line-clamp-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {item.promotion.title}
                                                    </p>
                                                )}

                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        SL: {item.quantity} • {formatMoney(finalPrice)}
                                                    </span>

                                                    {hasDiscount && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            {formatMoney(originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm font-bold text-blue-950 dark:text-blue-300">
                                                {formatMoney(item.total)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card title="Tổng kết thanh toán">
                            <div className="space-y-3 text-sm">
                                <Row label="Tạm tính" value={formatMoney(order.summary?.subTotal)} />
                                <Row label="Phí vận chuyển" value={formatMoney(order.summary?.shippingFee)} />
                                <Row
                                    label="Giảm giá"
                                    value={
                                        Number(order.summary?.discount || 0) > 0
                                            ? `- ${formatMoney(order.summary?.discount)}`
                                            : formatMoney(0)
                                    }
                                    positive={Number(order.summary?.discount || 0) > 0}
                                />
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

                                            {step.note ? (
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {step.note}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Hướng dẫn nhận hàng">
                            <Guide icon={MapPin}>
                                {order.pickup?.location ||
                                    'Nhận tại Phòng Công tác chính trị - Sinh viên - Khởi nghiệp Trường Đại học Kỹ thuật - Công nghệ Cần Thơ hoặc theo địa chỉ đã đăng ký.'}
                            </Guide>

                            <Guide icon={Info}>
                                {order.pickup?.instruction ||
                                    'Mang theo thông tin đơn hàng khi đến nhận sản phẩm.'}
                            </Guide>

                            <Guide icon={Phone}>
                                Vui lòng giữ liên lạc để nhân viên xác nhận khi cần.
                            </Guide>
                        </Card>
                    </div>
                </section>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {user ? (
                        <Link
                            to={`/account/orders/${order.id}`}
                            className="rounded-xl bg-blue-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            Xem chi tiết đơn hàng
                        </Link>
                    ) : null}

                    {canPayAgain && (
                        <button
                            type="button"
                            disabled={paying}
                            onClick={handlePayAgain}
                            className="rounded-xl bg-blue-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            {paying ? 'Đang chuyển sang bước thanh toán...' : 'Thanh toán'}
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={!canRequestVatInvoice}
                        onClick={openVatInvoiceModal}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                    >
                        Yêu cầu hóa đơn đỏ
                    </button>

                    <Link
                        to="/shop"
                        className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-blue-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>

                <VatInvoiceRequestModal
                    open={vatInvoiceModalOpen}
                    existingRequest={vatInvoiceRequest}
                    submitting={submittingVatInvoice}
                    defaultEmail={order.raw?.guest_email || order.raw?.customer_email || user?.email || ''}
                    onClose={() => setVatInvoiceModalOpen(false)}
                    onSubmit={submitVatInvoiceRequest}
                />
            </main>
        </MainLayout>
    );
}

function getHeroState(order, paymentStatus) {
    const status = order?.status || '';
    const realPaymentStatus = paymentStatus || order?.payment?.status || '';

    if (realPaymentStatus === 'failed' || status === 'cancelled') {
        return {
            icon: XCircle,
            title: 'Thanh toán chưa thành công',
            description: 'Đơn hàng của bạn chưa được thanh toán thành công. Vui lòng kiểm tra trong mục đơn hàng.',
            wrapperClass: 'border-red-100 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30',
            iconClass: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
            titleClass: 'text-red-700 dark:text-red-400',
        };
    }

    if (realPaymentStatus === 'paid') {
        return {
            icon: CheckCircle2,
            title: 'Thanh toán thành công',
            description: 'Thanh toán cho đơn hàng thành công.',
            wrapperClass: 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30',
            iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
            titleClass: 'text-emerald-700 dark:text-emerald-400',
        };
    }

    if (status === 'pending') {
        return {
            icon: Clock,
            title: 'Đặt hàng thành công',
            description: 'Đặt hàng thành công, vui lòng thanh toán trong thời gian quy định.',
            wrapperClass: 'border-amber-100 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
            iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
            titleClass: 'text-amber-700 dark:text-amber-400',
        };
    }

    return {
        icon: CheckCircle2,
        title: 'Đặt hàng thành công',
        description: 'Hệ thống đã ghi nhận đơn hàng của bạn.',
        wrapperClass: 'border-blue-100 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30',
        iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        titleClass: 'text-blue-700 dark:text-blue-300',
    };
}

function Card({ title, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-blue-950 dark:text-white">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 break-words text-lg font-bold text-blue-950 dark:text-white">{value || '—'}</p>
        </div>
    );
}

function Row({ label, value, strong = false, positive = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
            <span
                className={`text-right ${
                    strong
                        ? 'text-xl font-extrabold text-blue-950 dark:text-blue-300'
                        : positive
                          ? 'font-bold text-emerald-600 dark:text-emerald-400'
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

function formatDate(value) {
    return value || '—';
}

function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}

function isOrderPaid(order) {
    return order?.payment?.status === 'paid' || order?.raw?.payment_status === 'paid';
}

function getPaymentStatusFallback(order) {
    const status = order?.raw?.payment_status || '';

    const map = {
        unpaid: 'Chưa thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
    };

    return map[status] || 'Chưa có thông tin thanh toán';
}