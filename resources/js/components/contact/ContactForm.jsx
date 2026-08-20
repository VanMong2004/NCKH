import { AlertCircle, CheckCircle2, Loader2, Mail, MessageSquareText, Phone, Send, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const SUBJECT_OPTIONS = [
    'Hỗ trợ đơn hàng',
    'Hỗ trợ thanh toán',
    'Tư vấn khuyến mãi',
    'Yêu cầu đổi trả / hoàn trả',
    'Tài khoản người dùng',
    'Góp ý hệ thống',
    'Khác',
];

const INITIAL_FORM = {
    full_name: '',
    email: '',
    phone: '',
    subject: SUBJECT_OPTIONS[0],
    message: '',
};

export default function ContactForm({ submitting = false, initialValues = null, onSubmit }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const messageLength = useMemo(() => form.message.length, [form.message]);

    function updateField(field, value) {
        const normalizedValue = field === 'phone' ? normalizePhone(value) : value;

        setForm((prev) => ({
            ...prev,
            [field]: normalizedValue,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: '',
        }));

        setSubmitted(false);
    }
    async function handleSubmit(e) {
        e.preventDefault();

        const nextErrors = validateForm(form);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const success = await onSubmit({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone: normalizePhone(form.phone) || null,
            subject: form.subject.trim(),
            message: form.message.trim(),
        });

        if (success) {
            setForm({
                ...INITIAL_FORM,
                full_name: initialValues?.full_name || '',
                email: initialValues?.email || '',
                phone: normalizePhone(initialValues?.phone || ''),
            });
            setSubmitted(true);
        }
    }

    useEffect(() => {
        if (!initialValues) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            full_name: prev.full_name || initialValues.full_name || '',
            email: prev.email || initialValues.email || '',
            phone: prev.phone || normalizePhone(initialValues.phone || ''),
        }));
    }, [initialValues]);

    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <MessageSquareText size={13} />
                        Biểu mẫu liên hệ
                    </div>

                    <h2 className="mt-3 text-2xl font-black text-blue-950 dark:text-white">Gửi yêu cầu hỗ trợ</h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Điền đầy đủ thông tin bên dưới để bộ phận hỗ trợ tiếp nhận yêu cầu của bạn.
                    </p>
                </div>
            </div>

            {submitted ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <div className="flex gap-3">
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

                        <div>
                            <p className="font-black">Yêu cầu đã được gửi thành công.</p>
                            <p className="mt-1 leading-6">
                                Bộ phận hỗ trợ sẽ kiểm tra và phản hồi qua email bạn đã cung cấp.
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <FormField label="Họ và tên" required icon={UserRound} error={errors.full_name}>
                        <input
                            value={form.full_name}
                            onChange={(e) => updateField('full_name', e.target.value)}
                            placeholder="Nhập họ và tên"
                            className={inputClass(errors.full_name)}
                        />
                    </FormField>

                    <FormField label="Email" required icon={Mail} error={errors.email}>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="email@example.com"
                            className={inputClass(errors.email)}
                        />
                    </FormField>

                    <FormField label="Số điện thoại" icon={Phone} error={errors.phone}>
                        <input
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="Nhập số điện thoại"
                            className={inputClass(errors.phone)}
                        />
                    </FormField>

                    <FormField label="Chủ đề" required icon={MessageSquareText} error={errors.subject}>
                        <select
                            value={form.subject}
                            onChange={(e) => updateField('subject', e.target.value)}
                            className={inputClass(errors.subject)}
                        >
                            {SUBJECT_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </div>

                <FormField label="Nội dung liên hệ" required icon={MessageSquareText} error={errors.message}>
                    <textarea
                        value={form.message}
                        onChange={(e) => updateField('message', e.target.value)}
                        placeholder="Mô tả nội dung cần hỗ trợ..."
                        rows={7}
                        maxLength={2000}
                        className={[inputClass(errors.message), 'h-auto resize-none py-3 leading-7'].join(' ')}
                    />

                    <div className="mt-2 flex justify-between gap-3 text-xs font-semibold">
                        <span className="text-slate-400 dark:text-slate-500">Tối thiểu 10 ký tự</span>

                        <span
                            className={[
                                messageLength > 1800 ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500',
                            ].join(' ')}
                        >
                            {messageLength}/2000
                        </span>
                    </div>
                </FormField>

                <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />

                        <p>Thông tin liên hệ sẽ được lưu để bộ phận hỗ trợ xử lý và phản hồi.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={17} className="animate-spin" />
                                Đang gửi
                            </>
                        ) : (
                            <>
                                <Send size={17} />
                                Gửi liên hệ
                            </>
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}

function FormField({ label, required = false, icon: Icon, error, children }) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-blue-950 dark:text-white">
                {Icon ? <Icon size={16} className="text-blue-700 dark:text-blue-300" /> : null}
                {label}
                {required ? <span className="text-red-500">*</span> : null}
            </span>

            {children}

            {error ? <p className="mt-2 text-xs font-semibold text-red-500">{error}</p> : null}
        </label>
    );
}

function inputClass(error) {
    return [
        'h-12 w-full rounded-2xl border bg-white px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 dark:bg-slate-950 dark:text-white',
        error
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-500/50 dark:focus:ring-red-500/10'
            : 'border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:focus:border-blue-400 dark:focus:ring-blue-500/10',
    ].join(' ');
}

function validateForm(form) {
    const errors = {};

    if (!form.full_name.trim()) {
        errors.full_name = 'Vui lòng nhập họ và tên';
    }

    if (!form.email.trim()) {
        errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = 'Email không đúng định dạng';
    }

    const normalizedPhone = normalizePhone(form.phone);

    if (normalizedPhone && !/^0\d{9}$/.test(normalizedPhone)) {
        errors.phone = 'Số điện thoại phải gồm đúng 10 số và bắt đầu bằng số 0.';
    }

    if (!form.subject.trim()) {
        errors.subject = 'Vui lòng chọn chủ đề';
    }

    if (!form.message.trim()) {
        errors.message = 'Vui lòng nhập nội dung liên hệ';
    } else if (form.message.trim().length < 10) {
        errors.message = 'Nội dung liên hệ cần ít nhất 10 ký tự';
    } else if (form.message.trim().length > 2000) {
        errors.message = 'Nội dung liên hệ không được vượt quá 2000 ký tự';
    }

    return errors;
}

function normalizePhone(value) {
    return String(value || '')
        .replace(/[^\d]/g, '')
        .slice(0, 10);
}
