import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ConfirmDialog({
    open,
    title = 'Xác nhận thao tác',
    message = '',
    description = '',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'info',
    onConfirm,
    onOpenChange,
}) {
    const [loading, setLoading] = useState(false);

    const Icon = getIcon(type);
    const iconClass = getIconClass(type);
    const buttonClass = getButtonClass(type);

    async function handleConfirm() {
        if (!onConfirm) return;

        try {
            setLoading(true);
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-sm" />

                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start gap-4 p-5">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
                            <Icon size={24} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <AlertDialog.Title className="text-lg font-extrabold text-blue-950 dark:text-white">
                                    {title}
                                </AlertDialog.Title>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {message && (
                                <AlertDialog.Description className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {message}
                                </AlertDialog.Description>
                            )}

                            {description && (
                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
                        <AlertDialog.Cancel asChild>
                            <button
                                type="button"
                                disabled={loading}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {cancelText}
                            </button>
                        </AlertDialog.Cancel>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleConfirm}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
                        >
                            {loading ? 'Đang xử lý...' : confirmText}
                        </button>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}

function getIcon(type) {
    if (type === 'danger') return Trash2;
    if (type === 'warning') return AlertTriangle;
    if (type === 'success') return CheckCircle2;

    return Info;
}

function getIconClass(type) {
    if (type === 'danger') {
        return 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300';
    }

    if (type === 'warning') {
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300';
    }

    if (type === 'success') {
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300';
    }

    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
}

function getButtonClass(type) {
    if (type === 'danger') {
        return 'bg-red-600 hover:bg-red-700';
    }

    if (type === 'warning') {
        return 'bg-amber-600 hover:bg-amber-700';
    }

    if (type === 'success') {
        return 'bg-emerald-600 hover:bg-emerald-700';
    }

    return 'bg-blue-950 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600';
}

function getApiErrorMessage(error) {
    const errors = error?.response?.data?.errors || error?.raw?.errors || error?.errors || {};
    const firstError = Object.values(errors).flat().find(Boolean);

    return error?.response?.data?.message
        || error?.raw?.message
        || firstError
        || error?.message
        || 'Đã xảy ra lỗi, vui lòng thử lại';
}
