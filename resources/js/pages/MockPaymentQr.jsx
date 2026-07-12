import { ArrowLeft, CheckCircle2, Clock3, Copy, Loader2, QrCode } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import MainLayout from '../layout/MainLayout';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { wait } from '../utils/demoDelay';

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));
}

function getStoredPayment() {
    try {
        return JSON.parse(sessionStorage.getItem('mock_payment_qr') || '{}');
    } catch {
        return {};
    }
}

export default function MockPaymentQr() {
    const location = useLocation();
    const navigate = useNavigate();

    const fallback = useMemo(getStoredPayment, []);
    const order = location.state?.order || fallback.order || null;
    const payment = location.state?.payment || fallback.payment || null;
    const callbackUrl = location.state?.callbackUrl || fallback.callbackUrl || payment?.redirectUrl || '';
    const guestPhone = location.state?.guestPhone || fallback.guestPhone || '';
    const isGuest = Boolean(location.state?.isGuest ?? fallback.isGuest);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!order || !payment || !callbackUrl) {
            toast.error('Không tìm thấy thông tin thanh toán');
            navigate('/checkout', { replace: true });
        }
    }, [callbackUrl, navigate, order, payment]);

    if (!order || !payment || !callbackUrl) {
        return null;
    }

    const transferContent = `CTUT ${order.orderCode || order.code || order.id}`;
    const qrSeed = `${order.orderCode || order.id}-${payment.paymentId || payment.transactionId}`;

    function copyContent() {
        navigator.clipboard?.writeText(transferContent);
        toast.success('Đã sao chép nội dung chuyển khoản');
    }

    async function completePayment() {
        if (submitting) return;

        setSubmitting(true);

        sessionStorage.setItem(
            'guest_order_success',
            JSON.stringify({
                isGuest,
                orderId: order.id || order.orderId,
                orderCode: order.orderCode || order.code,
                guestPhone,
                guestToken: order.guestToken,
            }),
        );

        await wait();

        window.location.href = callbackUrl;
    }

    return (
        <MainLayout>
            <LoadingOverlay
                show={submitting}
                text="Đang xác nhận thanh toán..."
                description="Hệ thống đang xác minh giao dịch mô phỏng và chuẩn bị kết quả thanh toán."
            />

            <main className="mx-auto max-w-5xl px-4 py-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <Link
                        to="/checkout"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-950 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft size={17} />
                        Quay lại thanh toán
                    </Link>

                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                        <Clock3 size={14} />
                        Đang chờ thanh toán
                    </div>
                </div>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                <QrCode size={25} />
                            </div>

                            <div>
                                <h1 className="text-xl font-extrabold text-blue-950 dark:text-white">
                                    Quét QR để thanh toán
                                </h1>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Đây là màn thanh toán mô phỏng cho đơn hàng online.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
                            <FakeQr seed={qrSeed} />

                            <div className="space-y-4">
                                <InfoRow label="Ngân hàng" value="CTUT Bank" />
                                <InfoRow label="Chủ tài khoản" value="CTUT STORE" />
                                <InfoRow label="Số tài khoản" value="202606290001" />
                                <InfoRow label="Số tiền" value={formatCurrency(order.grandTotal || payment.raw?.amount)} strong />

                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                    <p className="text-xs font-bold uppercase text-slate-400">Nội dung chuyển khoản</p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <p className="font-extrabold text-blue-950 dark:text-white">{transferContent}</p>
                                        <button
                                            type="button"
                                            onClick={copyContent}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            title="Sao chép"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={completePayment}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    {submitting ? 'Đang xác nhận thanh toán...' : 'Hoàn tất thanh toán'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">Thông tin đơn hàng</h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <InfoRow label="Mã đơn" value={order.orderCode || order.code || '-'} />
                            <InfoRow label="Mã giao dịch" value={payment.transactionId || '-'} />
                            <InfoRow label="Phương thức" value="Thanh toán giả lập banking" />
                            <InfoRow label="Tạm tính" value={formatCurrency(order.subTotal)} />
                            <InfoRow label="Giảm giá" value={formatCurrency(order.discount)} />
                            <InfoRow label="Tổng cộng" value={formatCurrency(order.grandTotal)} strong />
                        </div>
                    </aside>
                </section>
            </main>
        </MainLayout>
    );
}

function InfoRow({ label, value, strong = false }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className={`text-right ${strong ? 'font-extrabold text-blue-950 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                {value}
            </span>
        </div>
    );
}

function FakeQr({ seed }) {
    const cells = Array.from({ length: 121 }).map((_, index) => {
        const code = seed.charCodeAt(index % seed.length) || 0;
        const active = (code + index * 7) % 5 < 2;

        return (
            <span
                key={index}
                className={active ? 'bg-blue-950 dark:bg-slate-950' : 'bg-transparent'}
            />
        );
    });

    return (
        <div className="mx-auto w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700">
            <div className="grid aspect-square grid-cols-11 gap-1">
                {cells}
            </div>
        </div>
    );
}
