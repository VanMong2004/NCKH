import { FileText, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const defaultForm = {
    company_name: '',
    tax_code: '',
    company_address: '',
    invoice_email: '',
    note: '',
};

export default function VatInvoiceRequestModal({
    open,
    existingRequest,
    defaultEmail = '',
    submitting = false,
    downloading = false,
    onClose,
    onSubmit,
    onDownload,
}) {
    const [form, setForm] = useState(defaultForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        setForm({
            ...defaultForm,
            invoice_email: defaultEmail || '',
        });
        setErrors({});
    }, [defaultEmail, open]);

    if (!open) return null;

    function updateField(name, value) {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        const nextErrors = {};

        if (!form.company_name.trim()) {
            nextErrors.company_name = 'Vui lòng nhập tên đơn vị xuất hóa đơn';
        }

        if (!form.tax_code.trim()) {
            nextErrors.tax_code = 'Vui lòng nhập mã số thuế';
        }

        if (!form.company_address.trim()) {
            nextErrors.company_address = 'Vui lòng nhập địa chỉ xuất hóa đơn';
        }

        if (!form.invoice_email.trim()) {
            nextErrors.invoice_email = 'Vui lòng nhập email nhận hóa đơn';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.invoice_email.trim())) {
            nextErrors.invoice_email = 'Email nhận hóa đơn không hợp lệ';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) return;

        onSubmit?.({
            company_name: form.company_name.trim(),
            tax_code: form.tax_code.trim(),
            company_address: form.company_address.trim(),
            invoice_email: form.invoice_email.trim(),
            note: form.note.trim(),
        });
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <FileText size={22} />
                        </div>

                        <div>
                            <h2 className="text-lg font-extrabold text-blue-950 dark:text-white">
                                Yêu cầu hóa đơn đỏ
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Thông tin này sẽ được gửi cho admin xử lý hóa đơn VAT.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {existingRequest ? (
                    <div className="p-5">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                            <p className="font-bold text-emerald-700 dark:text-emerald-300">
                                Đơn hàng này đã có yêu cầu hóa đơn đỏ.
                            </p>
                            <div className="mt-3 space-y-2 text-slate-700 dark:text-slate-200">
                                <Info label="Trạng thái" value={getStatusText(existingRequest.status)} />
                                <Info label="Tên đơn vị" value={existingRequest.company_name} />
                                <Info label="Mã số thuế" value={existingRequest.tax_code} />
                                <Info label="Email nhận" value={existingRequest.invoice_email} />
                                <Info label="Ngày yêu cầu" value={existingRequest.created_at} />
                            </div>

                            {existingRequest.status !== 'rejected' && (
                                <button
                                    type="button"
                                    disabled={downloading}
                                    onClick={onDownload}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                                >
                                    {downloading && <Loader2 size={16} className="animate-spin" />}
                                    Tải PDF hóa đơn đỏ
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 p-5">
                        <Input
                            label="Tên đơn vị/cá nhân"
                            value={form.company_name}
                            error={errors.company_name}
                            onChange={(value) => updateField('company_name', value)}
                        />

                        <Input
                            label="Mã số thuế"
                            value={form.tax_code}
                            error={errors.tax_code}
                            onChange={(value) => updateField('tax_code', value)}
                        />

                        <Input
                            label="Địa chỉ xuất hóa đơn"
                            value={form.company_address}
                            error={errors.company_address}
                            onChange={(value) => updateField('company_address', value)}
                        />

                        <Input
                            label="Email nhận hóa đơn"
                            type="email"
                            value={form.invoice_email}
                            error={errors.invoice_email}
                            onChange={(value) => updateField('invoice_email', value)}
                        />

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-bold text-blue-950 dark:text-white">
                                Ghi chú
                            </span>
                            <textarea
                                rows={3}
                                value={form.note}
                                onChange={(e) => updateField('note', e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </label>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Hủy
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                Gửi yêu cầu
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function Input({ label, value, error, onChange, type = 'text' }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-blue-950 dark:text-white">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-blue-950 dark:bg-slate-950 dark:text-white ${
                    error ? 'border-red-300 dark:border-red-800' : 'border-slate-300 dark:border-slate-700'
                }`}
            />
            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </label>
    );
}

function Info({ label, value }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className="text-right font-bold">{value || '---'}</span>
        </div>
    );
}

function getStatusText(status) {
    const map = {
        pending: 'Đang chờ xử lý',
        approved: 'Đã duyệt',
        issued: 'Đã xuất hóa đơn',
        rejected: 'Từ chối',
    };

    return map[status] || status || 'Đang chờ xử lý';
}
