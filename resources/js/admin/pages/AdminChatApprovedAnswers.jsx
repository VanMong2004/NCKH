import {
    Bot,
    CheckCircle2,
    FileCheck2,
    Loader2,
    PencilLine,
    Plus,
    RefreshCw,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import adminChatApprovedAnswerService from '../services/adminChatApprovedAnswerService';

const defaultFilters = {
    keyword: '',
    status: '',
    is_active: '',
    page: 1,
};

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'approved', label: 'Đã duyệt' },
];

const activeOptions = [
    { value: '', label: 'Tất cả hiển thị' },
    { value: '1', label: 'Đang bật' },
    { value: '0', label: 'Đang tắt' },
];

const emptyForm = {
    question: '',
    answer: '',
    intent: 'static_knowledge',
    intentSignature: '',
    status: 'draft',
    isActive: true,
    effectiveFrom: '',
    effectiveTo: '',
    sourceType: '',
    sourceReference: '',
};

export default function AdminChatApprovedAnswers() {
    const [answers, setAnswers] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });
    const [filters, setFilters] = useState(defaultFilters);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionId, setActionId] = useState('');
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    const summary = useMemo(() => ({
        total: meta.total,
        approved: answers.filter((item) => item.status === 'approved').length,
        active: answers.filter((item) => item.isActive).length,
        totalUse: answers.reduce((sum, item) => sum + (item.useCount || 0), 0),
    }), [answers, meta.total]);

    const loadAnswers = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const result = await adminChatApprovedAnswerService.getAnswers(filters);
            setAnswers(result.answers || []);
            setMeta(result.meta || {
                currentPage: 1,
                lastPage: 1,
                total: 0,
            });
        } catch (error) {
            toast.error(error.message || 'Không thể tải thư viện câu trả lời');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters]);

    useEffect(() => {
        loadAnswers();
    }, [loadAnswers]);

    function updateFilter(name, value) {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: name === 'page' ? value : 1,
        }));
    }

    function resetFilters() {
        setFilters(defaultFilters);
    }

    function openCreateForm() {
        setSelected(null);
        setForm(emptyForm);
    }

    function openEditForm(item) {
        setSelected(item);
        setForm({
            question: item.question || '',
            answer: item.answer || '',
            intent: item.intent || 'static_knowledge',
            intentSignature: item.intentSignature || '',
            status: item.status || 'draft',
            isActive: item.isActive,
            effectiveFrom: toDatetimeLocal(item.effectiveFrom),
            effectiveTo: toDatetimeLocal(item.effectiveTo),
            sourceType: item.sourceType || '',
            sourceReference: item.sourceReference || '',
        });
    }

    function updateForm(name, value) {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);

            const payload = {
                question: form.question,
                answer: form.answer,
                intent: form.intent,
                intent_signature: form.intentSignature || null,
                status: form.status,
                is_active: form.isActive,
                effective_from: form.effectiveFrom || null,
                effective_to: form.effectiveTo || null,
                source_type: form.sourceType || null,
                source_reference: form.sourceReference || null,
            };

            const saved = selected
                ? await adminChatApprovedAnswerService.updateAnswer(selected.id, payload)
                : await adminChatApprovedAnswerService.createAnswer(payload);

            toast.success(selected ? 'Đã cập nhật câu trả lời duyệt sẵn' : 'Đã tạo câu trả lời duyệt sẵn');

            if (selected) {
                setAnswers((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
                openEditForm(saved);
            } else {
                openEditForm(saved);
                await loadAnswers(true);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể lưu câu trả lời duyệt sẵn');
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(item) {
        try {
            setActionId(`toggle-${item.id}`);
            const updated = await adminChatApprovedAnswerService.toggleAnswer(item.id);
            setAnswers((prev) => prev.map((answer) => (answer.id === updated.id ? updated : answer)));
            if (selected?.id === updated.id) {
                openEditForm(updated);
            }
            toast.success(updated.isActive ? 'Đã bật câu trả lời' : 'Đã tắt câu trả lời');
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật trạng thái câu trả lời');
        } finally {
            setActionId('');
        }
    }

    function handleDelete(item) {
        setConfirmDialog({
            open: true,
            title: 'Xóa câu trả lời duyệt sẵn',
            message: `Bạn muốn xóa câu hỏi "${item.question}" khỏi thư viện?`,
            description: 'Thao tác này chỉ xóa bản ghi thư viện, không xóa hội thoại gốc.',
            confirmText: 'Xóa',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setActionId(`delete-${item.id}`);
                    await adminChatApprovedAnswerService.deleteAnswer(item.id);
                    setAnswers((prev) => prev.filter((answer) => answer.id !== item.id));
                    if (selected?.id === item.id) {
                        openCreateForm();
                    }
                    toast.success('Đã xóa câu trả lời duyệt sẵn');
                } catch (error) {
                    toast.error(error.message || 'Không thể xóa câu trả lời duyệt sẵn');
                } finally {
                    setActionId('');
                }
            },
        });
    }

    return (
        <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <FileCheck2 size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Thư viện câu trả lời AI</h1>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Quản lý các câu trả lời tĩnh đã kiểm duyệt để chatbot ưu tiên tái sử dụng trước khi tra cứu tài liệu.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => loadAnswers(true)}
                            disabled={refreshing || loading}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Làm mới
                        </button>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 text-sm font-extrabold text-white transition hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Plus size={16} />
                            Tạo mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng câu trả lời" value={summary.total} tone="blue" icon={Bot} desc="Tất cả bản ghi thư viện" />
                <StatCard label="Đã duyệt" value={summary.approved} tone="emerald" icon={CheckCircle2} desc="Sẵn sàng cho chatbot" />
                <StatCard label="Đang bật" value={summary.active} tone="violet" icon={ToggleRight} desc="Được phép chatbot sử dụng" />
                <StatCard label="Lượt tái sử dụng" value={summary.totalUse} tone="amber" icon={PencilLine} desc="Tổng số lần đã dùng" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
                            <div className="relative">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={filters.keyword}
                                    onChange={(event) => updateFilter('keyword', event.target.value)}
                                    placeholder="Tìm theo câu hỏi hoặc câu trả lời..."
                                    className={`${inputClass} pl-9`}
                                />
                            </div>

                            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className={selectClass}>
                                {statusOptions.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>

                            <select value={filters.is_active} onChange={(event) => updateFilter('is_active', event.target.value)} className={selectClass}>
                                {activeOptions.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>

                            <button type="button" onClick={resetFilters} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                                Xóa lọc
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingBox />
                    ) : answers.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <div className="overflow-x-auto">
                                <table className="min-w-[920px] w-full text-left">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-extrabold">Câu hỏi</th>
                                            <th className="px-4 py-3 font-extrabold">Intent</th>
                                            <th className="px-4 py-3 font-extrabold">Trạng thái</th>
                                            <th className="px-4 py-3 font-extrabold">Lượt dùng</th>
                                            <th className="px-4 py-3 font-extrabold">Hiển thị</th>
                                            <th className="px-4 py-3 text-right font-extrabold">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {answers.map((item) => {
                                            const isToggling = actionId === `toggle-${item.id}`;
                                            const isDeleting = actionId === `delete-${item.id}`;

                                            return (
                                                <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                                    <td className="px-4 py-4">
                                                        <button type="button" onClick={() => openEditForm(item)} className="text-left">
                                                            <p className="line-clamp-2 font-extrabold text-slate-900 dark:text-white">{item.question}</p>
                                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.answer}</p>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{item.intent}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={['inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold', item.statusClass].join(' ')}>
                                                            {item.statusText}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{item.useCount}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={['inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold', item.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'].join(' ')}>
                                                            {item.isActive ? 'Đang bật' : 'Đang tắt'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggle(item)}
                                                                disabled={isToggling || isDeleting}
                                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                            >
                                                                {isToggling ? <Loader2 size={15} className="animate-spin" /> : item.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                                {item.isActive ? 'Tắt' : 'Bật'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditForm(item)}
                                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-200 px-3 text-xs font-extrabold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                                            >
                                                                <PencilLine size={15} />
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(item)}
                                                                disabled={isToggling || isDeleting}
                                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                                            >
                                                                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                                <span className="text-slate-500">Trang {meta.currentPage}/{meta.lastPage} - {meta.total} mục</span>
                                <div className="flex gap-2">
                                    <button type="button" disabled={meta.currentPage <= 1} onClick={() => updateFilter('page', meta.currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-50 dark:border-slate-800">
                                        Trước
                                    </button>
                                    <button type="button" disabled={meta.currentPage >= meta.lastPage} onClick={() => updateFilter('page', meta.currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-50 dark:border-slate-800">
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{selected ? 'Chỉnh sửa câu trả lời' : 'Tạo câu trả lời mới'}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Dùng cho tri thức tĩnh đã được kiểm duyệt.
                            </p>
                        </div>
                        {selected ? (
                            <button type="button" onClick={openCreateForm} className="text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300">
                                Tạo form mới
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Câu hỏi</label>
                            <textarea value={form.question} onChange={(event) => updateForm('question', event.target.value)} rows={3} className={textareaClass} placeholder="VD: Chính sách đổi trả như thế nào?" />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Câu trả lời</label>
                            <textarea value={form.answer} onChange={(event) => updateForm('answer', event.target.value)} rows={7} className={textareaClass} placeholder="Nhập câu trả lời đã duyệt..." />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Loại intent</label>
                                <input value={form.intent} onChange={(event) => updateForm('intent', event.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Chữ ký intent</label>
                                <input value={form.intentSignature} onChange={(event) => updateForm('intentSignature', event.target.value)} className={inputClass} placeholder="Không bắt buộc" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Trạng thái</label>
                                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)} className={selectClass}>
                                    {statusOptions.filter((item) => item.value !== '').map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm('isActive', event.target.checked)} />
                                Cho phép chatbot sử dụng bản ghi này
                            </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Hiệu lực từ</label>
                                <input type="datetime-local" value={form.effectiveFrom} onChange={(event) => updateForm('effectiveFrom', event.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Hiệu lực đến</label>
                                <input type="datetime-local" value={form.effectiveTo} onChange={(event) => updateForm('effectiveTo', event.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Loại nguồn gốc</label>
                                <input value={form.sourceType} onChange={(event) => updateForm('sourceType', event.target.value)} className={inputClass} placeholder="VD: chat_message" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Mã tham chiếu nguồn</label>
                                <input value={form.sourceReference} onChange={(event) => updateForm('sourceReference', event.target.value)} className={inputClass} placeholder="VD: chat_message:15" />
                            </div>
                        </div>
                    </div>

                    {selected ? (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                            <p><span className="font-bold">Số lần đã dùng:</span> {selected.useCount}</p>
                            <p><span className="font-bold">Lần dùng gần nhất:</span> {selected.lastUsedAt || '-'}</p>
                            <p><span className="font-bold">Cập nhật lúc:</span> {selected.updatedAt || '-'}</p>
                        </div>
                    ) : null}

                    <button type="submit" disabled={saving} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 text-sm font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600">
                        {saving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                        {saving ? 'Đang lưu...' : selected ? 'Cập nhật câu trả lời' : 'Tạo câu trả lời'}
                    </button>
                </form>
            </div>

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
        </div>
    );
}

function toDatetimeLocal(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

function LoadingBox() {
    return (
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center">
                <Loader2 size={30} className="mx-auto animate-spin text-blue-700 dark:text-blue-300" />
                <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">Đang tải thư viện câu trả lời...</p>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Bot size={26} />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">Chưa có câu trả lời duyệt sẵn</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Tạo thư viện câu trả lời đã kiểm duyệt để chatbot tái sử dụng cho FAQ, chính sách và hướng dẫn tĩnh.
            </p>
        </div>
    );
}

const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-500/10';

const selectClass =
    'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-500/10';

const textareaClass =
    'w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-500/10';
