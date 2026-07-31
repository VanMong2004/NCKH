import { CheckCircle2, Loader2, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
    formatMoney,
    getCancelReasonText,
    getDisplayOrderStatusText,
    getNextOrderStatuses,
    getNextVatInvoiceStatuses,
    getPaymentMethodText,
    getPaymentStatusText,
    getVatInvoiceStatusText,
} from '../../mappers/adminOrderMapper';
import adminOrderService from '../../services/adminOrderService';
import ConfirmDialog from '../ui/ConfirmDialog';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { withMinimumDelay } from '../../../utils/demoDelay';

export default function AdminOrderDetailModal({ open, orderId, onClose, onUpdated }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingVatInvoice, setSavingVatInvoice] = useState(false);

    const [statusForm, setStatusForm] = useState({
        status: '',
        note: '',
        cancel_reason: '',
    });

    const [vatInvoiceForm, setVatInvoiceForm] = useState({
        status: '',
        admin_note: '',
    });

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    useEffect(() => {
        if (!open || !orderId) return;

        loadOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, orderId]);

    async function loadOrder() {
        try {
            setLoading(true);

            const result = await adminOrderService.getOrder(orderId);

            setOrder(result);
            setStatusForm({
                status: '',
                note: '',
                cancel_reason: '',
            });
            setVatInvoiceForm({
                status: '',
                admin_note: result?.vatInvoiceRequest?.adminNote || '',
            });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết đơn hàng');
            onClose?.();
        } finally {
            setLoading(false);
        }
    }

    const nextStatuses = useMemo(() => {
        if (Array.isArray(order?.allowedNextStatuses)) {
            return order.allowedNextStatuses;
        }

        return getNextOrderStatuses(order?.status, order?.paymentMethod);
    }, [order?.allowedNextStatuses, order?.paymentMethod, order?.status]);

    const nextVatInvoiceStatuses = useMemo(() => {
        return getNextVatInvoiceStatuses(order?.vatInvoiceRequest?.status);
    }, [order?.vatInvoiceRequest?.status]);

    function updateStatusForm(key, value) {
        setStatusForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function updateVatInvoiceForm(key, value) {
        setVatInvoiceForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function handleUpdateStatus(e) {
        e.preventDefault();

        if (!statusForm.status) {
            toast.warning('Vui lòng chọn trạng thái đơn hàng cần chuyển');
            return;
        }

        if (statusForm.status === 'cancelled' && !statusForm.cancel_reason.trim()) {
            toast.warning('Vui lòng nhập lý do hủy đơn');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Chuyển trạng thái đơn hàng',
            message: `Chuyển đơn ${order.orderCode} từ "${order.statusText}" sang "${getDisplayOrderStatusText(statusForm.status, order.fulfillmentMethod)}"?`,
            description: 'Thao tác này sẽ cập nhật trạng thái đơn hàng trên hệ thống.',
            confirmText: 'Cập nhật',
            type: 'warning',
            onConfirm: updateOrderStatus,
        });
    }

    function handleUpdateVatInvoiceStatus(e) {
        e.preventDefault();

        if (!vatInvoiceForm.status) {
            toast.warning('Vui lòng chọn trạng thái hóa đơn đỏ cần chuyển');
            return;
        }

        if (vatInvoiceForm.status === 'rejected' && !vatInvoiceForm.admin_note.trim()) {
            toast.warning('Vui lòng nhập lý do từ chối hóa đơn đỏ');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Cập nhật hóa đơn đỏ',
            message: `Chuyển yêu cầu hóa đơn đỏ của đơn ${order.orderCode} sang "${getVatInvoiceStatusText(vatInvoiceForm.status)}"?`,
            description: '',
            confirmText: 'Cập nhật',
            type: 'warning',
            onConfirm: updateVatInvoiceStatus,
        });
    }

    async function updateOrderStatus() {
        try {
            setSavingStatus(true);

            const result = await withMinimumDelay(adminOrderService.updateStatus(order.id, statusForm));

            setOrder(result);
            setStatusForm({
                status: '',
                note: '',
                cancel_reason: '',
            });

            toast.success('Đã cập nhật trạng thái đơn hàng');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể cập nhật trạng thái đơn hàng');
        } finally {
            setSavingStatus(false);
        }
    }

    async function updateVatInvoiceStatus() {
        try {
            setSavingVatInvoice(true);

            const result = await withMinimumDelay(adminOrderService.updateVatInvoiceStatus(order.id, vatInvoiceForm));

            setOrder(result);
            setVatInvoiceForm({
                status: '',
                admin_note: result?.vatInvoiceRequest?.adminNote || '',
            });

            toast.success('Đã cập nhật trạng thái hóa đơn đỏ');
            onUpdated?.();
        } catch (error) {
            toast.error(error?.message || 'Không thể cập nhật trạng thái hóa đơn đỏ');
        } finally {
            setSavingVatInvoice(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3">
            <LoadingOverlay
                show={savingStatus || savingVatInvoice}
                text={savingVatInvoice ? 'Đang cập nhật hóa đơn đỏ...' : 'Đang cập nhật trạng thái đơn hàng...'}
                description={
                    savingVatInvoice
                        ? 'Hệ thống đang kiểm tra luồng trạng thái hóa đơn đỏ và lưu dữ liệu xử lý.'
                        : 'Hệ thống đang kiểm tra quyền, trạng thái hợp lệ và cập nhật dữ liệu đơn hàng.'
                }
            />

            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết đơn hàng</h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {order?.orderCode ? `Mã đơn: ${order.orderCode}` : 'Đang tải dữ liệu đơn hàng...'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading || !order ? (
                    <div className="flex min-h-[520px] items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">Đang tải chi tiết đơn hàng...</p>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="space-y-5">
                                <Section title="Sản phẩm trong đơn" description={`${order.items.length || 0} sản phẩm`}>
                                    {order.items.length > 0 ? (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {order.items.map((item) => (
                                                <OrderItemRow key={item.id} item={item} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                                            Không có sản phẩm trong đơn.
                                        </div>
                                    )}
                                </Section>

                                <Section title="Lịch sử xử lý">
                                    {order.statusHistories.length > 0 ? (
                                        <div className="space-y-3">
                                            {order.statusHistories.map((history) => (
                                                <div
                                                    key={history.id}
                                                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                                                            <CheckCircle2 size={16} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {history.oldStatusText || 'Khởi tạo đơn hàng'} {'->'} {history.newStatusText || '—'}
                                                            </p>

                                                            {history.note && (
                                                                <p className="mt-1 text-sm text-slate-500">{history.note}</p>
                                                            )}

                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {history.createdAt || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">Chưa có lịch sử xử lý.</p>
                                    )}
                                </Section>
                            </div>

                            <aside className="space-y-5">
                                <Section title="Thông tin đơn hàng">
                                    <div className="grid gap-3">
                                        <InfoLine label="Mã đơn" value={order.orderCode || `#${order.id}`} />
                                        <InfoLine label="Ngày đặt" value={order.createdAt || '—'} />
                                        <InfoLine label="Trạng thái đơn" value={order.statusText} />
                                        <InfoLine label="Số sản phẩm" value={order.itemCount} />
                                        {order.expiredAt && <InfoLine label="Hết hạn" value={order.expiredAt} />}
                                        {order.cancelReason && (
                                            <InfoLine label="Lý do hủy" value={getCancelReasonText(order.cancelReason)} />
                                        )}
                                    </div>
                                </Section>

                                <Section title="Khách hàng">
                                    <div className="grid gap-3">
                                        <InfoLine label="Tên" value={order.customer.name || '—'} />
                                        <InfoLine label="Email" value={order.customer.email || '—'} />
                                        <InfoLine label="Số điện thoại" value={order.customer.phone || '—'} />
                                    </div>
                                </Section>

                                <Section title="Người nhận">
                                    <div className="grid gap-3">
                                        <InfoLine label="Tên người nhận" value={order.receiver.name || '—'} />
                                        <InfoLine label="Số điện thoại" value={order.receiver.phone || '—'} />
                                        <InfoLine label="Địa chỉ" value={order.receiver.address || '—'} />
                                    </div>
                                </Section>

                                <Section title="Thanh toán">
                                    <div className="grid gap-3">
                                        <InfoLine label="Phương thức" value={getPaymentMethodText(order.paymentMethod)} />
                                        <InfoLine label="Trạng thái thanh toán" value={getPaymentStatusText(order.paymentStatus)} />
                                        {order.payment?.transactionId && (
                                            <InfoLine label="Mã giao dịch" value={order.payment.transactionId} />
                                        )}
                                    </div>
                                </Section>

                                {order.vatInvoiceRequest && (
                                    <>
                                        <Section title="Yêu cầu hóa đơn đỏ">
                                            <div className="grid gap-3">
                                                <InfoLine
                                                    label="Trạng thái"
                                                    value={getVatInvoiceStatusText(order.vatInvoiceRequest.status)}
                                                />
                                                <InfoLine
                                                    label="Tên đơn vị"
                                                    value={order.vatInvoiceRequest.companyName || '—'}
                                                />
                                                <InfoLine
                                                    label="Mã số thuế"
                                                    value={order.vatInvoiceRequest.taxCode || '—'}
                                                />
                                                <InfoLine
                                                    label="Email nhận"
                                                    value={order.vatInvoiceRequest.invoiceEmail || '—'}
                                                />
                                                <InfoLine
                                                    label="Ngày yêu cầu"
                                                    value={order.vatInvoiceRequest.createdAt || '—'}
                                                />
                                                <InfoLine
                                                    label="Nhân viên xử lý"
                                                    value={order.vatInvoiceRequest.processedBy?.name || '—'}
                                                />
                                                <InfoLine
                                                    label="Bắt đầu xử lý"
                                                    value={order.vatInvoiceRequest.processedAt || '—'}
                                                />
                                                <InfoLine
                                                    label="Hoàn tất"
                                                    value={order.vatInvoiceRequest.fulfilledAt || '—'}
                                                />
                                                <InfoLine
                                                    label="Ghi chú xử lý"
                                                    value={order.vatInvoiceRequest.adminNote || '—'}
                                                />
                                            </div>
                                        </Section>

                                        <Section title="Xử lý hóa đơn đỏ">
                                            {nextVatInvoiceStatuses.length > 0 ? (
                                                <form onSubmit={handleUpdateVatInvoiceStatus} className="space-y-4">
                                                    <Field label="Chuyển trạng thái hóa đơn đỏ">
                                                        <select
                                                            value={vatInvoiceForm.status}
                                                            onChange={(e) => updateVatInvoiceForm('status', e.target.value)}
                                                            className={controlClass}
                                                        >
                                                            <option value="">Chọn trạng thái tiếp theo</option>
                                                            {nextVatInvoiceStatuses.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {getVatInvoiceStatusText(status)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </Field>

                                                    <Field
                                                        label={
                                                            vatInvoiceForm.status === 'rejected'
                                                                ? 'Lý do từ chối'
                                                                : 'Ghi chú xử lý'
                                                        }
                                                    >
                                                        <textarea
                                                            value={vatInvoiceForm.admin_note}
                                                            onChange={(e) => updateVatInvoiceForm('admin_note', e.target.value)}
                                                            rows={3}
                                                            placeholder={
                                                                vatInvoiceForm.status === 'rejected'
                                                                    ? 'Nhập lý do từ chối hóa đơn đỏ'
                                                                    : 'Ghi chú xử lý nếu có'
                                                            }
                                                            className={textareaClass}
                                                        />
                                                    </Field>

                                                    <button
                                                        type="submit"
                                                        disabled={savingVatInvoice}
                                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                                    >
                                                        {savingVatInvoice ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Save size={16} />
                                                        )}
                                                        Cập nhật hóa đơn đỏ
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950">
                                                    Yêu cầu hóa đơn đỏ ở trạng thái hiện tại không thể chuyển tiếp.
                                                </div>
                                            )}
                                        </Section>
                                    </>
                                )}

                                <Section title="Tổng tiền">
                                    <div className="space-y-2 text-sm">
                                        <MoneyLine label="Tạm tính" value={order.summary.subTotal} />
                                        <MoneyLine label="Phí vận chuyển" value={order.summary.shippingFee} />
                                        <MoneyLine label="Giảm giá" value={order.summary.discount} negative />
                                        <MoneyLine
                                            label="Tổng cộng"
                                            value={order.summary.grandTotal || order.summary.total}
                                            strong
                                        />
                                    </div>
                                </Section>

                                <Section title="Xử lý đơn hàng">
                                    {nextStatuses.length > 0 ? (
                                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                                            <Field label="Chuyển trạng thái đơn hàng">
                                                <select
                                                    value={statusForm.status}
                                                    onChange={(e) => updateStatusForm('status', e.target.value)}
                                                    className={controlClass}
                                                >
                                                    <option value="">Chọn trạng thái tiếp theo</option>
                                                    {nextStatuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {getDisplayOrderStatusText(status, order.fulfillmentMethod)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>

                                            {statusForm.status === 'cancelled' && (
                                                <Field label="Lý do hủy">
                                                    <textarea
                                                        value={statusForm.cancel_reason}
                                                        onChange={(e) => updateStatusForm('cancel_reason', e.target.value)}
                                                        rows={3}
                                                        placeholder="Nhập lý do hủy đơn"
                                                        className={textareaClass}
                                                    />
                                                </Field>
                                            )}

                                            <Field label="Ghi chú nội bộ">
                                                <textarea
                                                    value={statusForm.note}
                                                    onChange={(e) => updateStatusForm('note', e.target.value)}
                                                    rows={3}
                                                    placeholder="Ghi chú nếu có"
                                                    className={textareaClass}
                                                />
                                            </Field>

                                            <button
                                                type="submit"
                                                disabled={savingStatus}
                                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                            >
                                                {savingStatus ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Save size={16} />
                                                )}
                                                Cập nhật trạng thái đơn hàng
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950">
                                            Đơn hàng ở trạng thái hiện tại không thể chuyển tiếp.
                                        </div>
                                    )}
                                </Section>
                            </aside>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onOpenChange={(openState) => {
                    setConfirmDialog((prev) => ({
                        ...prev,
                        open: openState,
                    }));
                }}
            />
        </div>
    );
}

function OrderItemRow({ item }) {
    return (
        <div className="flex gap-3 px-4 py-4">
            <img
                src={item.thumbnail}
                alt={item.productName}
                className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                onError={(e) => {
                    e.currentTarget.src = '/images/no-image.png';
                }}
            />

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">{item.productName || 'Sản phẩm'}</p>

                <p className="mt-1 text-xs text-slate-500">{renderVariantText(item.variant)}</p>

                {item.promotion && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                        Có áp dụng khuyến mãi
                    </p>
                )}

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {item.originalPrice > item.finalPrice && (
                        <span className="line-through">{formatMoney(item.originalPrice)}</span>
                    )}

                    {item.discountAmount > 0 && <span>Giảm {formatMoney(item.discountAmount)}</span>}
                </div>
            </div>

            <div className="text-right">
                <p className="font-semibold text-slate-900 dark:text-white">{formatMoney(item.finalPrice)}</p>
                <p className="mt-1 text-xs text-slate-500">x {item.quantity}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatMoney(item.total)}</p>
            </div>
        </div>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            {children}
        </label>
    );
}

function InfoLine({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="max-w-[190px] text-right text-sm font-semibold text-slate-900 dark:text-white">
                {value || '—'}
            </span>
        </div>
    );
}

function MoneyLine({ label, value, negative = false, strong = false }) {
    const number = Number(value || 0);

    return (
        <div className="flex items-center justify-between gap-3">
            <span className={strong ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}>{label}</span>

            <span
                className={
                    strong
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-semibold text-slate-700 dark:text-slate-200'
                }
            >
                {negative && number > 0 ? '-' : ''}
                {formatMoney(number)}
            </span>
        </div>
    );
}

function renderVariantText(variant = {}) {
    const parts = [];

    if (variant.sku) parts.push(`SKU: ${variant.sku}`);
    if (variant.size) parts.push(`Size ${variant.size}`);
    if (variant.color) parts.push(variant.color);

    return parts.length ? parts.join(' · ') : 'Không có phân loại';
}

const controlClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const textareaClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
