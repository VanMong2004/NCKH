import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, KeyRound, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';

import MainLayout from '../layout/MainLayout';
import guestOrderService from '../services/guestOrderService';
import paymentService from '../services/paymentService';
import { cancelReasonText } from '../services/mappers/orderMapper';
import ConfirmDialog from '../admin/components/ui/ConfirmDialog';

const EMPTY_FORM = {
    lookup_token: '',
};

export default function GuestOrderLookup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [payingOrderCode, setPayingOrderCode] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });
    const hydratedFromQuery = useRef(false);

    const order = lookupResult?.order || null;

    useEffect(() => {
        if (hydratedFromQuery.current) {
            return;
        }

        hydratedFromQuery.current = true;

        const lookupToken = normalizeLookupToken(searchParams.get('lookup_token') || '');

        if (lookupToken) {
            setForm({
                lookup_token: lookupToken,
            });
        }
    }, [searchParams]);

    useEffect(() => {
        const shouldAutoLookup = searchParams.get('focus') === 'payment';

        if (!shouldAutoLookup || !form.lookup_token || loading || lookupResult) {
            return;
        }

        handleLookup({
            lookup_token: normalizeLookupToken(form.lookup_token),
        });
    }, [searchParams, form.lookup_token, loading, lookupResult]);

    function updateField(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: '',
            lookup: '',
        }));
    }

    function validateForm() {
        const nextErrors = {};

        if (!normalizeLookupToken(form.lookup_token)) {
            nextErrors.lookup_token = 'Vui lòng nhập mã tra cứu đơn hàng.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await handleLookup({
            lookup_token: normalizeLookupToken(form.lookup_token),
        });
    }

    async function handleLookup(payload) {
        try {
            setLoading(true);
            setSubmitError('');

            const result = await guestOrderService.lookup(payload);

            setLookupResult(result);
        } catch (error) {
            const responseErrors = error.errors || {};
            const nextErrors = {};

            Object.entries(responseErrors).forEach(([key, value]) => {
                nextErrors[key] = Array.isArray(value) ? value[0] : value;
            });

            setErrors((prev) => ({
                ...prev,
                ...nextErrors,
            }));
            setSubmitError(error.message || 'Không thể tra cứu đơn hàng lúc này.');
            setLookupResult(null);
        } finally {
            setLoading(false);
        }
    }

    async function refreshCurrentLookup() {
        const lookupToken = normalizeLookupToken(form.lookup_token);

        if (!lookupToken) {
            return;
        }

        await handleLookup({
            lookup_token: lookupToken,
        });
    }

    async function handlePayAgain(targetOrder) {
        if (!targetOrder?.id) {
            return;
        }

        const method = targetOrder.payment?.method || targetOrder.raw?.payment_method || '';

        if (method !== 'mock_bank') {
            toast.warning('Đơn hàng này không hỗ trợ thanh toán trực tuyến.');
            return;
        }

        try {
            setPayingOrderCode(targetOrder.code || String(targetOrder.id));

            const guestLookupToken = normalizeLookupToken(form.lookup_token);
            const payment = await paymentService.pay(targetOrder.id, method, {
                guestLookupToken,
            });

            if (payment.redirectUrl) {
                sessionStorage.setItem(
                    'mock_payment_qr',
                    JSON.stringify({
                        order: targetOrder,
                        payment,
                        callbackUrl: payment.redirectUrl,
                        isGuest: true,
                        guestLookupToken,
                    }),
                );

                navigate('/payment/qr', {
                    state: {
                        order: targetOrder,
                        payment,
                        callbackUrl: payment.redirectUrl,
                        isGuest: true,
                        guestLookupToken,
                    },
                });

                return;
            }

            toast.success(payment.message || 'Đã chuyển sang bước thanh toán.');
            await refreshCurrentLookup();
        } catch (error) {
            toast.error(error.message || 'Không thể chuyển sang bước thanh toán.');
        } finally {
            setPayingOrderCode('');
        }
    }

    async function handleCancelOrder(targetOrder) {
        if (!targetOrder?.code) {
            return;
        }

        const guestLookupToken = normalizeLookupToken(form.lookup_token);

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hủy đơn hàng',
            message: `Bạn có chắc muốn hủy đơn ${targetOrder.code}?`,
            description: 'Thao tác này chỉ áp dụng với các đơn còn cho phép hủy.',
            confirmText: 'Hủy đơn',
            type: 'warning',
            onConfirm: async () => {
                try {
                    const result = await guestOrderService.cancelOrder(
                        targetOrder.code,
                        {
                            lookup_token: guestLookupToken,
                        },
                        {
                            guestLookupToken,
                        },
                    );

                    toast.success(result.message || 'Hủy đơn hàng thành công.');
                    setLookupResult(result);
                    await refreshCurrentLookup();
                } catch (error) {
                    toast.error(error.message || 'Không thể hủy đơn hàng.');
                } finally {
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open: false,
                    }));
                }
            },
        });
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-6xl px-4 py-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <ShieldCheck size={24} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-extrabold text-blue-950 dark:text-white">
                                Tra cứu đơn hàng dành cho khách
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Nhập mã đơn hàng và mã tra cứu để xem chi tiết đơn, thanh toán hoặc hủy đơn khi còn hợp lệ.
                                Mã tra cứu được cấp riêng cho từng đơn nhằm hạn chế lộ thông tin đơn hàng.
                            </p>
                        </div>
                    </div>

                    <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
                        <InputField
                            label="Mã tra cứu"
                            value={form.lookup_token}
                            onChange={(value) => updateField('lookup_token', normalizeLookupToken(value))}
                            placeholder="Ví dụ: GLK-AB12CD34EF"
                            error={errors.lookup_token}
                            icon={KeyRound}
                        />

                        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-950 px-6 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                <Search size={18} />
                                {loading ? 'Đang tra cứu...' : 'Tra cứu đơn hàng'}
                            </button>

                            {lookupResult ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLookupResult(null);
                                        setSubmitError('');
                                    }}
                                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Xóa kết quả
                                </button>
                            ) : null}
                        </div>
                    </form>

                    {submitError ? (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                            {submitError}
                        </div>
                    ) : null}
                </section>

                {order ? (
                    <section className="mt-6">
                        <OrderDetailPanel
                            order={order}
                            onPayAgain={handlePayAgain}
                            onCancelOrder={handleCancelOrder}
                            paying={payingOrderCode === (order.code || String(order.id || ''))}
                        />
                    </section>
                ) : null}

                <ConfirmDialog
                    open={confirmDialog.open}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    description={confirmDialog.description}
                    confirmText={confirmDialog.confirmText}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onOpenChange={(open) => {
                        setConfirmDialog((prev) => ({
                            ...prev,
                            open,
                        }));
                    }}
                />
            </main>
        </MainLayout>
    );
}

function InputField({ label, value, onChange, placeholder, error, icon: Icon = null }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>

            <div
                className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 dark:bg-slate-950 ${
                    error ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'
                }`}
            >
                {Icon ? <Icon size={18} className="text-slate-400" /> : null}

                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-white"
                />
            </div>

            {error ? <p className="mt-2 text-sm font-medium text-red-500">{error}</p> : null}
        </label>
    );
}

function OrderDetailPanel({ order, onPayAgain, onCancelOrder, paying = false }) {
    if (!order) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Chưa có thông tin đơn hàng để hiển thị.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold text-blue-950 dark:text-white">Chi tiết đơn hàng</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Mã đơn hàng: <span className="font-bold text-blue-950 dark:text-white">{order.code}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {order.actions?.canPayAgain ? (
                            <button
                                type="button"
                                onClick={() => onPayAgain?.(order)}
                                disabled={paying}
                                className="rounded-2xl bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                {paying ? 'Đang chuyển sang thanh toán...' : 'Thanh toán'}
                            </button>
                        ) : null}

                        {order.actions?.canCancel ? (
                            <button
                                type="button"
                                onClick={() => onCancelOrder?.(order)}
                                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                            >
                                Hủy đơn
                            </button>
                        ) : null}

                        <StatusBadge text={order.statusText} status={order.status} />
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoBox label="Ngày đặt" value={formatDate(order.createdAt)} />
                    <InfoBox label="Thanh toán" value={order.payment?.statusText || 'Đang cập nhật'} />
                    <InfoBox label="Phương thức" value={order.payment?.methodText || 'Đang cập nhật'} />
                    <InfoBox label="Tổng tiền" value={formatMoney(order.summary?.grandTotal)} />
                </div>

                {order.cancelReason ? (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        Lý do hủy: {cancelReasonText(order.cancelReason)}
                    </div>
                ) : null}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="space-y-6">
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
                        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                            {(order.items || []).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
                                >
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                                        <img
                                            src={item.thumbnail || '/images/no-image.png'}
                                            alt={item.productName}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 font-bold text-blue-950 dark:text-white">{item.productName}</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {item.variant?.size ? `Size: ${item.variant.size}` : ''}
                                            {item.variant?.size && item.variant?.color ? ' · ' : ''}
                                            {item.variant?.color ? `Màu: ${item.variant.color}` : ''}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                SL: {item.quantity} · {formatMoney(item.finalPrice || item.price)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm font-bold text-blue-950 dark:text-blue-300">
                                        {formatMoney(item.total)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
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

                    <Card title="Tiến trình đơn hàng">
                        <div className="space-y-4">
                            {(order.timeline || []).map((step, index) => (
                                <div key={`${step.label}-${index}`} className="flex gap-3">
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
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.note}</p>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}

function Card({ title, children }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-blue-950 dark:text-white">{title}</h3>
            {children}
        </section>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 font-bold text-blue-950 dark:text-white">{value || '—'}</p>
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

function StatusBadge({ text, status }) {
    const className = {
        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
        processing: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
        awaiting_receipt: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
        completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
        cancelled: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
    }[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

    return <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>{text}</span>;
}

function normalizeLookupToken(value) {
    return String(value || '').trim().toUpperCase();
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
