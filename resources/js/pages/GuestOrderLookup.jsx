import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Mail, Phone, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';

import MainLayout from '../layout/MainLayout';
import guestOrderService from '../services/guestOrderService';
import paymentService from '../services/paymentService';
import { cancelReasonText } from '../services/mappers/orderMapper';
import ConfirmDialog from '../admin/components/ui/ConfirmDialog';

const LOOKUP_MODES = {
    order_code_email: 'order_code_email',
    phone_email: 'phone_email',
};

const EMPTY_FORM = {
    order_code: '',
    phone: '',
    email: '',
};

export default function GuestOrderLookup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState(LOOKUP_MODES.order_code_email);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [payingOrderCode, setPayingOrderCode] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [selectedOrderCode, setSelectedOrderCode] = useState('');
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

    const selectedOrder = useMemo(() => {
        if (!lookupResult) return null;

        if (lookupResult.lookupType !== LOOKUP_MODES.phone_email) {
            return lookupResult.order || null;
        }

        return lookupResult.orders.find((order) => order.code === selectedOrderCode) || lookupResult.orders[0] || null;
    }, [lookupResult, selectedOrderCode]);

    useEffect(() => {
        if (hydratedFromQuery.current) {
            return;
        }

        hydratedFromQuery.current = true;

        const nextMode = searchParams.get('mode');
        const orderCode = searchParams.get('order_code') || '';
        const phone = searchParams.get('phone') || '';
        const email = searchParams.get('email') || '';

        if (nextMode && Object.values(LOOKUP_MODES).includes(nextMode)) {
            setMode(nextMode);
        }

        if (orderCode || phone || email) {
            setForm({
                order_code: orderCode,
                phone,
                email,
            });
        }
    }, [searchParams]);

    useEffect(() => {
        const shouldAutoLookup = searchParams.get('focus') === 'payment';

        if (!shouldAutoLookup || mode !== LOOKUP_MODES.order_code_email) {
            return;
        }

        if (!form.order_code || !form.email || loading || lookupResult) {
            return;
        }

        handleLookup({
            order_code: form.order_code,
            email: form.email,
        });
    }, [searchParams, mode, form.order_code, form.email, loading, lookupResult]);

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

    function switchMode(nextMode) {
        setMode(nextMode);
        setForm(EMPTY_FORM);
        setErrors({});
        setSubmitError('');
        setLookupResult(null);
        setSelectedOrderCode('');
    }

    function validateForm() {
        const nextErrors = {};
        const email = String(form.email || '').trim();
        const orderCode = String(form.order_code || '').trim();
        const phone = normalizePhone(form.phone);

        if (!email) {
            nextErrors.email = 'Vui lòng nhập email để tra cứu đơn hàng.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Email không đúng định dạng.';
        }

        if (mode === LOOKUP_MODES.order_code_email && !orderCode) {
            nextErrors.order_code = 'Vui lòng nhập mã đơn hàng.';
        }

        if (mode === LOOKUP_MODES.phone_email) {
            if (!phone) {
                nextErrors.phone = 'Vui lòng nhập số điện thoại.';
            } else if (!/^0\d{9}$/.test(phone)) {
                nextErrors.phone = 'Số điện thoại phải gồm 10 số và bắt đầu bằng số 0.';
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const payload = {
            email: String(form.email || '').trim(),
        };

        if (mode === LOOKUP_MODES.order_code_email) {
            payload.order_code = String(form.order_code || '').trim();
        } else {
            payload.phone = normalizePhone(form.phone);
        }

        await handleLookup(payload);
    }

    async function handleLookup(payload) {
        try {
            setLoading(true);
            setSubmitError('');

            const result = await guestOrderService.lookup(payload);

            setLookupResult(result);

            if (result.lookupType === LOOKUP_MODES.phone_email) {
                setSelectedOrderCode(result.orders[0]?.code || '');
            } else {
                setSelectedOrderCode(result.order?.code || '');
            }
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
            setSelectedOrderCode('');
        } finally {
            setLoading(false);
        }
    }

    async function refreshCurrentLookup(orderCodeOverride = '') {
        if (lookupResult?.lookupType === LOOKUP_MODES.phone_email) {
            await handleLookup({
                phone: normalizePhone(form.phone),
                email: form.email.trim(),
            });

            if (orderCodeOverride) {
                setSelectedOrderCode(orderCodeOverride);
            }

            return;
        }

        await handleLookup({
            order_code: orderCodeOverride || selectedOrder?.code || form.order_code.trim(),
            email: form.email.trim(),
        });
    }

    async function handlePayAgain(order) {
        if (!order?.id) {
            return;
        }

        const method = order.payment?.method || order.raw?.payment_method || '';

        if (method !== 'mock_bank') {
            toast.warning('Đơn hàng này không hỗ trợ thanh toán trực tuyến.');
            return;
        }

        try {
            setPayingOrderCode(order.code || String(order.id));

            const payment = await paymentService.pay(order.id, method);

            if (payment.redirectUrl) {
                sessionStorage.setItem(
                    'mock_payment_qr',
                    JSON.stringify({
                        order,
                        payment,
                        callbackUrl: payment.redirectUrl,
                        guestEmail: form.email.trim(),
                        guestPhone: normalizePhone(form.phone || order.receiver?.phone || ''),
                        isGuest: true,
                    }),
                );

                navigate('/payment/qr', {
                    state: {
                        order,
                        payment,
                        callbackUrl: payment.redirectUrl,
                        guestEmail: form.email.trim(),
                        guestPhone: normalizePhone(form.phone || order.receiver?.phone || ''),
                        isGuest: true,
                    },
                });

                return;
            }

            toast.success(payment.message || 'Đã chuyển sang bước thanh toán.');
            await refreshCurrentLookup(order.code);
        } catch (error) {
            toast.error(error.message || 'Không thể chuyển sang bước thanh toán.');
        } finally {
            setPayingOrderCode('');
        }
    }

    function handleCancelOrder(order) {
        if (!order?.code) return;

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hủy đơn hàng',
            message: `Bạn có chắc muốn hủy đơn hàng "${order.code}"?`,
            description: 'Đơn hàng sau khi hủy sẽ không thể khôi phục và giao dịch chờ thanh toán sẽ được đóng lại.',
            confirmText: 'Hủy đơn hàng',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const result = await guestOrderService.cancelOrder(order.code, {
                        email: form.email.trim(),
                    });

                    toast.success('Đã hủy đơn hàng');

                    if (lookupResult?.lookupType === LOOKUP_MODES.phone_email) {
                        await refreshCurrentLookup(result.orderCode || order.code);
                    } else {
                        setLookupResult({
                            success: true,
                            message: 'Hủy đơn hàng thành công',
                            lookupType: LOOKUP_MODES.order_code_email,
                            order: result,
                            orders: [],
                        });
                    }
                } catch (error) {
                    toast.error(error.message || 'Không thể hủy đơn hàng');
                }
            },
        });
    }

    return (
        <MainLayout>
            <main className="mx-auto max-w-6xl px-4 py-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Search size={14} />
                            Tra cứu đơn hàng
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Bạn có thể tra cứu theo mã đơn hàng và email, hoặc nhập số điện thoại cùng email để xem lịch sử
                            các đơn đã đặt.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                        <ModeCard
                            active={mode === LOOKUP_MODES.order_code_email}
                            title="Tra cứu 1 đơn hàng"
                            description="Nhập mã đơn hàng và email để xem đúng đơn cần tìm."
                            onClick={() => switchMode(LOOKUP_MODES.order_code_email)}
                        />

                        <ModeCard
                            active={mode === LOOKUP_MODES.phone_email}
                            title="Xem lịch sử đơn hàng"
                            description="Nhập số điện thoại và email để xem danh sách các đơn đã đặt."
                            onClick={() => switchMode(LOOKUP_MODES.phone_email)}
                        />
                    </div>

                    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                        {mode === LOOKUP_MODES.order_code_email ? (
                            <InputField
                                label="Mã đơn hàng"
                                value={form.order_code}
                                onChange={(value) => updateField('order_code', value)}
                                placeholder="Ví dụ: ORD-20260809-000001"
                                error={errors.order_code}
                            />
                        ) : (
                            <InputField
                                label="Số điện thoại"
                                value={form.phone}
                                onChange={(value) => updateField('phone', value)}
                                placeholder="Nhập số điện thoại đã đặt hàng"
                                error={errors.phone}
                                icon={Phone}
                            />
                        )}

                        <InputField
                            label="Email"
                            value={form.email}
                            onChange={(value) => updateField('email', value)}
                            placeholder="Nhập email đã dùng khi đặt hàng"
                            error={errors.email}
                            icon={Mail}
                        />

                        {(errors.lookup || submitError) && (
                            <div className="md:col-span-2">
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                    {errors.lookup || submitError}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-blue-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                {loading ? 'Đang tra cứu...' : 'Tra cứu đơn hàng'}
                            </button>
                        </div>
                    </form>
                </section>

                {lookupResult?.lookupType === LOOKUP_MODES.phone_email && lookupResult.orders.length > 0 && (
                    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-blue-950 dark:text-white">Lịch sử đơn hàng</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Tìm thấy {lookupResult.orders.length} đơn hàng khớp với thông tin bạn cung cấp.
                        </p>

                        <div className="mt-5 grid gap-4 lg:grid-cols-[380px_1fr]">
                            <div className="space-y-3">
                                {lookupResult.orders.map((order) => (
                                    <button
                                        key={order.code}
                                        type="button"
                                        onClick={() => setSelectedOrderCode(order.code)}
                                        className={`w-full rounded-2xl border p-4 text-left transition ${
                                            selectedOrder?.code === order.code
                                                ? 'border-blue-200 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-950/30'
                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-bold text-blue-950 dark:text-white">{order.code}</p>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </div>

                                            <StatusBadge text={order.statusText} status={order.status} />
                                        </div>

                                        <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <span>Thanh toán: {order.payment?.statusText || 'Đang cập nhật'}</span>
                                            <span>Phương thức: {order.payment?.methodText || 'Đang cập nhật'}</span>
                                            <span>Tổng tiền: {formatMoney(order.summary?.grandTotal)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div>
                                <OrderDetailPanel
                                    order={selectedOrder}
                                    onPayAgain={handlePayAgain}
                                    onCancelOrder={handleCancelOrder}
                                    paying={payingOrderCode === (selectedOrder?.code || String(selectedOrder?.id || ''))}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {lookupResult?.lookupType !== LOOKUP_MODES.phone_email && lookupResult?.order && (
                    <section className="mt-6">
                        <OrderDetailPanel
                            order={lookupResult.order}
                            onPayAgain={handlePayAgain}
                            onCancelOrder={handleCancelOrder}
                            paying={payingOrderCode === (lookupResult.order?.code || String(lookupResult.order?.id || ''))}
                        />
                    </section>
                )}

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

function ModeCard({ active, title, description, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-4 text-left transition ${
                active
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950'
            }`}
        >
            <p className="font-bold text-blue-950 dark:text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        </button>
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
                                <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
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

function normalizePhone(value) {
    let digits = String(value || '').replace(/\D/g, '');

    if (digits.startsWith('840') && digits.length === 12) {
        digits = `0${digits.slice(3)}`;
    } else if (digits.startsWith('84') && digits.length === 11) {
        digits = `0${digits.slice(2)}`;
    }

    return digits.slice(0, 10);
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
