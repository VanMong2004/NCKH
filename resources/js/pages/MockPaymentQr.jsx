import { ArrowLeft, CheckCircle2, Clock3, Copy, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import LoadingOverlay from '../components/common/LoadingOverlay';
import MainLayout from '../layout/MainLayout';
import { wait } from '../utils/demoDelay';

const MOCK_BANK = {
    bankCode: 'VCB',
    bankName: 'Vietcombank',
    accountName: 'CTUT UniShop',
    accountNumber: '202606290001',
};

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

function buildVietQrUrl({ accountNumber, accountName, amount, addInfo }) {
    const params = new URLSearchParams({
        amount: String(Number(amount || 0)),
        addInfo,
        accountName,
    });

    return `https://img.vietqr.io/image/${MOCK_BANK.bankCode}-${accountNumber}-compact2.png?${params.toString()}`;
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
    const [qrError, setQrError] = useState(false);

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
    const paymentAmount = Number(order.grandTotal || payment.raw?.amount || 0);
    const qrImageUrl = buildVietQrUrl({
        accountNumber: MOCK_BANK.accountNumber,
        accountName: MOCK_BANK.accountName,
        amount: paymentAmount,
        addInfo: transferContent,
    });

    function copyContent() {
        navigator.clipboard?.writeText(transferContent);
        toast.success('Đã sao chép nội dung chuyển khoản');
    }

    function copyAccountNumber() {
        navigator.clipboard?.writeText(MOCK_BANK.accountNumber);
        toast.success('Đã sao chép số tài khoản');
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
                description="Hệ thống đang xác minh giao dịch và chuẩn bị kết quả thanh toán."
            />

            <main className="mx-auto max-w-5xl px-4 py-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <Link
                        to="/checkout"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-950 dark:text-slate-300 dark:hover:text-white"
                    >
                        <ArrowLeft size={17} />
                        Quay về thanh toán
                    </Link>

                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                        <Clock3 size={14} />
                        Chờ xác nhận chuyển khoản
                    </div>
                </div>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                <QrCode size={25} />
                            </div>

                            <div className="flex-1">
                                <h1 className="text-xl font-extrabold text-blue-950 dark:text-white">
                                    Quét mã QR để thanh toán
                                </h1>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Vui lòng quét mã bằng ứng dụng ngân hàng hoặc sao chép thông tin
                                    chuyển khoản bên dưới để hoàn tất đơn hàng.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
                            <div className="mx-auto w-full max-w-[280px] rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                                <div className="rounded-[24px] bg-white p-4 shadow-inner dark:bg-slate-950">
                                    {!qrError ? (
                                        <img
                                            src={qrImageUrl}
                                            alt="Mã QR chuyển khoản"
                                            className="aspect-square w-full rounded-2xl object-cover"
                                            onError={() => setQrError(true)}
                                        />
                                    ) : (
                                        <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-900">
                                            <QrCode size={48} className="text-slate-400 dark:text-slate-500" />
                                            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                Không tải được ảnh QR
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Bạn vẫn có thể chuyển khoản thủ công bằng thông tin ở bên phải.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-950 px-4 py-3 text-white dark:bg-blue-900">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-blue-100/80">
                                            Ngân hàng nhận
                                        </p>
                                        <p className="mt-1 font-extrabold">{MOCK_BANK.bankName}</p>
                                    </div>
                                    <ShieldCheck size={22} className="text-emerald-300" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <InfoRow label="Ngân hàng" value={MOCK_BANK.bankName} />
                                <InfoRow label="Chủ tài khoản" value={MOCK_BANK.accountName} />

                                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                                    <p className="text-xs font-bold uppercase text-slate-400">Số tài khoản</p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <p className="font-extrabold tracking-[0.08em] text-blue-950 dark:text-white">
                                            {MOCK_BANK.accountNumber}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={copyAccountNumber}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            title="Sao chép số tài khoản"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <InfoRow label="Số tiền" value={formatCurrency(paymentAmount)} strong />

                                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                                    <p className="text-xs font-bold uppercase text-slate-400">
                                        Nội dung chuyển khoản
                                    </p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <p className="font-extrabold text-blue-950 dark:text-white">
                                            {transferContent}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={copyContent}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            title="Sao chép nội dung"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                                    Sau khi quét hoặc chuyển khoản xong, nhấn nút bên dưới để hệ thống ghi nhận
                                    thanh toán giả lập cho đơn hàng này.
                                </div>

                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={completePayment}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {submitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    {submitting ? 'Đang xác nhận thanh toán...' : 'Tôi đã chuyển khoản'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">
                            Thông tin đơn hàng
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <InfoRow label="Mã đơn" value={order.orderCode || order.code || '-'} />
                            <InfoRow label="Mã giao dịch" value={payment.transactionId || '-'} />
                            <InfoRow label="Phương thức" value="Chuyển khoản ngân hàng" />
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
            <span
                className={`text-right ${
                    strong
                        ? 'font-extrabold text-blue-950 dark:text-white'
                        : 'font-bold text-slate-700 dark:text-slate-200'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
