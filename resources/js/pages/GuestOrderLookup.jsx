import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock, Mail, Phone, Search } from 'lucide-react';

import MainLayout from '../layout/MainLayout';
import guestOrderService from '../services/guestOrderService';

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
    const [mode, setMode] = useState(LOOKUP_MODES.order_code_email);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [selectedOrderCode, setSelectedOrderCode] = useState('');

    const selectedOrder = useMemo(() => {
        if (!lookupResult) return null;

        if (lookupResult.lookupType !== LOOKUP_MODES.phone_email) {
            return lookupResult.order || null;
        }

        return (
            lookupResult.orders.find((order) => order.code === selectedOrderCode)
            || lookupResult.orders[0]
            || null
        );
    }, [lookupResult, selectedOrderCode]);

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
            nextErrors.email = 'Email không đúng định dạng. Vui lòng nhập đúng địa chỉ email.';
        }

        if (mode === LOOKUP_MODES.order_code_email) {
            if (!orderCode) {
                nextErrors.order_code = 'Vui lòng nhập mã đơn hàng để tra cứu.';
            }
        }

        if (mode === LOOKUP_MODES.phone_email) {
            if (!phone) {
                nextErrors.phone = 'Vui lòng nhập số điện thoại để tra cứu lịch sử đơn hàng.';
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

        try {
            setLoading(true);
            setSubmitError('');

            const payload = {
                email: String(form.email || '').trim(),
            };

            if (mode === LOOKUP_MODES.order_code_email) {
                payload.order_code = String(form.order_code || '').trim();
            } else {
                payload.phone = normalizePhone(form.phone);
            }

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

    return (
        <MainLayout>
            <main className="mx-auto max-w-6xl px-4 py-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Search size={14} />
                            Xem đơn hàng
                        </div>

                        {/* <h1 className="mt-4 text-3xl font-extrabold text-blue-950 dark:text-white">
                            Xem đơn hàng
                        </h1> */}

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Bạn có thể tra cứu theo mã đơn hàng và email, hoặc nhập số điện thoại cùng email để xem
                            lịch sử các đơn đã đặt.
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
                                placeholder="Ví dụ: ORD-20260731-000012"
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
                                <OrderDetailPanel order={selectedOrder} />
                            </div>
                        </div>
                    </section>
                )}

                {lookupResult?.lookupType !== LOOKUP_MODES.phone_email && lookupResult?.order && (
                    <section className="mt-6">
                        <OrderDetailPanel order={lookupResult.order} />
                    </section>
                )}
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
                    error
                        ? 'border-red-300 dark:border-red-500/50'
                        : 'border-slate-200 dark:border-slate-700'
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

function OrderDetailPanel({ order }) {
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

                    <StatusBadge text={order.statusText} status={order.status} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoBox label="Ngày đặt" value={formatDate(order.createdAt)} />
                    <InfoBox label="Thanh toán" value={order.payment?.statusText || 'Đang cập nhật'} />
                    <InfoBox label="Phương thức" value={order.payment?.methodText || 'Đang cập nhật'} />
                    <InfoBox label="Tổng tiền" value={formatMoney(order.summary?.grandTotal)} />
                </div>
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
                            {(order.items || []).map((item) => {
                                const originalPrice = Number(item.originalPrice || item.price || 0);
                                const finalPrice = Number(item.finalPrice || item.price || 0);
                                const hasDiscount = originalPrice > finalPrice;

                                return (
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
                                            <p className="line-clamp-2 font-bold text-blue-950 dark:text-white">
                                                {item.productName}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {item.variant?.size ? `Size: ${item.variant.size}` : ''}
                                                {item.variant?.size && item.variant?.color ? ' · ' : ''}
                                                {item.variant?.color ? `Màu: ${item.variant.color}` : ''}
                                            </p>

                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    SL: {item.quantity} · {formatMoney(finalPrice)}
                                                </span>

                                                {hasDiscount ? (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        {formatMoney(originalPrice)}
                                                    </span>
                                                ) : null}
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
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {step.note}
                                            </p>
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
    return String(value || '').replace(/\D/g, '');
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
