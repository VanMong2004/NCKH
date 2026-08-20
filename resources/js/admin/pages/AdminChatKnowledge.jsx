import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    Clock3,
    DatabaseZap,
    FileText,
    Loader2,
    RefreshCw,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
    UploadCloud,
    X,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import adminChatKnowledgeService from '../services/adminChatKnowledgeService';

const defaultFilters = {
    keyword: '',
    status: '',
    is_active: '',
};

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'completed', label: 'Hoàn tất' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'cancelled', label: 'Đã hủy' },
];

const activeOptions = [
    { value: '', label: 'Tất cả hiển thị' },
    { value: '1', label: 'Đang bật' },
    { value: '0', label: 'Đang tắt' },
];

export default function AdminChatKnowledge() {
    const [files, setFiles] = useState([]);

    const [summary, setSummary] = useState({
        total: 0,
        active: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        cancelled: 0,
    });

    const [filters, setFilters] = useState(defaultFilters);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [actionId, setActionId] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);

    const [form, setForm] = useState({
        title: '',
        documentKey: '',
        description: '',
    });

    const [expandedId, setExpandedId] = useState(null);

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        description: '',
        confirmText: 'Xác nhận',
        type: 'info',
        onConfirm: null,
    });

    const hasProcessing = useMemo(() => {
        return files.some((item) => ['pending', 'processing'].includes(item.status));
    }, [files]);

    const statCards = [
        {
            label: 'Tổng tài liệu',
            value: summary.total,
            icon: FileText,
            desc: 'Tất cả file tri thức',
            tone: 'blue',
        },
        {
            label: 'Đang bật',
            value: summary.active,
            icon: ToggleRight,
            desc: 'Được dùng cho chatbot',
            tone: 'emerald',
        },
        {
            label: 'Hoàn tất',
            value: summary.completed,
            icon: CheckCircle2,
            desc: 'Đã sẵn sàng tra cứu',
            tone: 'violet',
        },
        {
            label: 'Đang xử lý',
            value: summary.processing,
            icon: Loader2,
            desc: 'Chờ OpenAI đồng bộ',
            tone: 'amber',
            iconClassName: summary.processing ? 'animate-spin' : '',
        },
    ];

    const loadFiles = useCallback(
        async (silent = false) => {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const data = await adminChatKnowledgeService.getFiles(filters);

                setFiles(data.files || []);
                setSummary(
                    data.summary || {
                        total: 0,
                        active: 0,
                        completed: 0,
                        processing: 0,
                        failed: 0,
                        cancelled: 0,
                    },
                );
            } catch (error) {
                toast.error(error.message || 'Không thể tải danh sách tài liệu AI');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [filters],
    );

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    useEffect(() => {
        if (!hasProcessing) return undefined;

        const timer = window.setInterval(() => {
            loadFiles(true);
        }, 15000);

        return () => window.clearInterval(timer);
    }, [hasProcessing, loadFiles]);

    function updateFilter(name, value) {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function resetFilters() {
        setFilters(defaultFilters);
    }

    function handleSelectFile(event) {
        const file = event.target.files?.[0] || null;

        setSelectedFile(file);

        if (file && !form.title) {
            setForm((prev) => ({
                ...prev,
                title: file.name.replace(/\.[^/.]+$/, ''),
            }));
        }
    }

    function updateForm(name, value) {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleUpload(event) {
        event.preventDefault();

        if (!selectedFile) {
            toast.warning('Vui lòng chọn tài liệu cần upload');
            return;
        }

        try {
            setUploading(true);

            await adminChatKnowledgeService.uploadFile({
                file: selectedFile,
                title: form.title,
                documentKey: form.documentKey,
                description: form.description,
            });

            toast.success('Upload tài liệu AI thành công');

            setSelectedFile(null);
            setForm({
                title: '',
                documentKey: '',
                description: '',
            });

            const fileInput = document.getElementById('chat-knowledge-file-input');
            if (fileInput) fileInput.value = '';

            await loadFiles(true);
        } catch (error) {
            toast.error(error.message || 'Không thể upload tài liệu AI');
        } finally {
            setUploading(false);
        }
    }

    async function handleToggle(file) {
        try {
            setActionId(`toggle-${file.id}`);

            await adminChatKnowledgeService.toggleFile(file.id);

            toast.success(file.isActive ? 'Đã tắt tài liệu' : 'Đã bật tài liệu');

            await loadFiles(true);
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật trạng thái tài liệu');
        } finally {
            setActionId('');
        }
    }

    function handleDelete(file) {
        setConfirmDialog({
            open: true,
            title: 'Xóa tài liệu AI',
            message: `Bạn muốn xóa tài liệu "${file.title}" khỏi kho tri thức AI?`,
            description: 'Thao tác này sẽ gỡ file khỏi OpenAI Vector Store nếu tài liệu đã được đồng bộ.',
            confirmText: 'Xóa tài liệu',
            type: 'danger',
            onConfirm: async () => {
                await deleteFile(file);
            },
        });
    }

    async function deleteFile(file) {
        try {
            setActionId(`delete-${file.id}`);

            await adminChatKnowledgeService.deleteFile(file.id);

            toast.success('Đã xóa tài liệu AI');

            await loadFiles(true);
        } catch (error) {
            toast.error(error.message || 'Không thể xóa tài liệu AI');
        } finally {
            setActionId('');
        }
    }

    return (
        <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            <Bot size={22} />
                        </div>

                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Tài liệu AI</h1>

                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Quản lý tài liệu tri thức cho chatbot: upload file, theo dõi trạng thái xử lý và bật/tắt
                                tài liệu đang dùng.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadFiles(true)}
                        disabled={refreshing || loading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((item) => (
                    <StatCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        tone={item.tone}
                        icon={item.icon}
                        desc={item.desc}
                        iconClassName={item.iconClassName || ''}
                    />
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
                <UploadForm
                    form={form}
                    selectedFile={selectedFile}
                    uploading={uploading}
                    onSubmit={handleUpload}
                    onChange={updateForm}
                    onSelectFile={handleSelectFile}
                />

                <div className="space-y-4">
                    <FilterBar filters={filters} onChange={updateFilter} onReset={resetFilters} />

                    {loading ? (
                        <LoadingBox />
                    ) : files.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <FileTable
                            files={files}
                            expandedId={expandedId}
                            actionId={actionId}
                            onToggleExpand={setExpandedId}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
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

function UploadForm({ form, selectedFile, uploading, onSubmit, onChange, onSelectFile }) {
    return (
        <form
            onSubmit={onSubmit}
            className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="mb-4">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Upload tài liệu mới</h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Hỗ trợ PDF, DOC, DOCX, TXT, MD. Tối đa 20MB.
                </p>
            </div>

            <label
                htmlFor="chat-knowledge-file-input"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-blue-500/5"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                    <UploadCloud size={24} />
                </div>

                <p className="mt-3 text-sm font-extrabold text-slate-800 dark:text-white">
                    {selectedFile ? selectedFile.name : 'Chọn tài liệu để upload'}
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Bấm để chọn file'}
                </p>

                <input
                    id="chat-knowledge-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={onSelectFile}
                    className="hidden"
                />
            </label>

            <div className="mt-4 space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Tiêu đề</label>

                    <input
                        value={form.title}
                        onChange={(event) => onChange('title', event.target.value)}
                        placeholder="VD: Chính sách tuyển sinh 2026"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Mô tả</label>

                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Mã tài liệu</label>

                        <input
                            value={form.documentKey}
                            onChange={(event) => onChange('documentKey', event.target.value)}
                            placeholder="VD: chinh-sach-tuyen-sinh"
                            className={inputClass}
                        />

                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Dùng cùng mã này khi upload phiên bản mới để chỉ thay thế đúng tài liệu đó.
                        </p>
                    </div>

                    <textarea
                        value={form.description}
                        onChange={(event) => onChange('description', event.target.value)}
                        placeholder="Ghi chú ngắn về nội dung tài liệu..."
                        rows={4}
                        className={textareaClass}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={uploading}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 text-sm font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                {uploading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
                {uploading ? 'Đang upload...' : 'Upload lên AI'}
            </button>

            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="flex gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />

                    <span>
                        Sau khi upload, file có thể ở trạng thái “Đang xử lý”. N8N sẽ đồng bộ lại trạng thái hoàn
                        tất/thất bại.
                    </span>
                </div>
            </div>
        </form>
    );
}

function FilterBar({ filters, onChange, onReset }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_160px_auto]">
                <div className="relative">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        value={filters.keyword}
                        onChange={(event) => onChange('keyword', event.target.value)}
                        placeholder="Tìm theo tiêu đề, tên file, mô tả..."
                        className={`${inputClass} pl-9`}
                    />
                </div>

                <select
                    value={filters.status}
                    onChange={(event) => onChange('status', event.target.value)}
                    className={selectClass}
                >
                    {statusOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.is_active}
                    onChange={(event) => onChange('is_active', event.target.value)}
                    className={selectClass}
                >
                    {activeOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={onReset}
                    className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    Xóa lọc
                </button>
            </div>
        </div>
    );
}

function FileTable({ files, expandedId, actionId, onToggleExpand, onToggle, onDelete }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="min-w-[940px] w-full text-left">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-extrabold">Tài liệu</th>
                            <th className="px-4 py-3 font-extrabold">Dung lượng</th>
                            <th className="px-4 py-3 font-extrabold">Trạng thái</th>
                            <th className="px-4 py-3 font-extrabold">Hiển thị</th>
                            <th className="px-4 py-3 font-extrabold">Cập nhật</th>
                            <th className="px-4 py-3 text-right font-extrabold">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {files.map((file) => {
                            const isExpanded = expandedId === file.id;
                            const isToggling = actionId === `toggle-${file.id}`;
                            const isDeleting = actionId === `delete-${file.id}`;
                            const isManageable = file.manageable !== false;

                            return (
                                <tr
                                    key={file.id}
                                    className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                >
                                    <td className="px-4 py-4">
                                        <FileInfo file={file} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
                                    </td>

                                    <td className="px-4 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        {file.sizeText}
                                    </td>

                                    <td className="px-4 py-4">
                                        <span
                                            className={[
                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold',
                                                file.statusClass,
                                            ].join(' ')}
                                        >
                                            <StatusIcon status={file.status} />
                                            {file.statusText}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <ActiveBadge active={file.isActive} />
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        <p>{file.updatedAt || '-'}</p>
                                        <p className="mt-1 text-xs">Tạo: {file.createdAt || '-'}</p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onToggle(file)}
                                                disabled={!isManageable || isToggling || isDeleting}
                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                title={isManageable ? '' : 'File này đang được đọc trực tiếp từ OpenAI Vector Store, chưa có bản ghi local để bật/tắt.'}
                                            >
                                                {isToggling ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : file.isActive ? (
                                                    <ToggleRight size={16} />
                                                ) : (
                                                    <ToggleLeft size={16} />
                                                )}

                                                {file.isActive ? 'Tắt' : 'Bật'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDelete(file)}
                                                disabled={!isManageable || isToggling || isDeleting}
                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                                title={isManageable ? '' : 'File này đang được đọc trực tiếp từ OpenAI Vector Store, chưa có bản ghi local để xóa từ trang này.'}
                                            >
                                                {isDeleting ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={15} />
                                                )}
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
        </div>
    );
}

function FileInfo({ file, isExpanded, onToggleExpand }) {
    const hasDetail = file.openaiFileId || file.vectorStoreFileId || file.vectorStoreId || file.errorMessage;

    return (
        <div className="flex gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <FileText size={19} />
            </div>

            <div className="min-w-0">
                <p className="line-clamp-1 font-extrabold text-slate-900 dark:text-white">{file.title}</p>

                <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {file.originalName || 'Không rõ tên file'}
                </p>

                {file.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {file.description}
                    </p>
                )}

                {hasDetail && (
                    <button
                        type="button"
                        onClick={() => onToggleExpand(isExpanded ? null : file.id)}
                        className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300"
                    >
                        {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>
                )}

                {isExpanded && <FileDetail file={file} />}
            </div>
        </div>
    );
}

function FileDetail({ file }) {
    return (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {file.openaiFileId && (
                <p className="break-all">
                    <span className="font-bold">OpenAI file:</span> {file.openaiFileId}
                </p>
            )}

            {file.vectorStoreId && (
                <p className="break-all">
                    <span className="font-bold">Vector store:</span> {file.vectorStoreId}
                </p>
            )}

            {file.vectorStoreFileId && (
                <p className="break-all">
                    <span className="font-bold">Vector file:</span> {file.vectorStoreFileId}
                </p>
            )}

            {file.errorMessage && (
                <p className="break-words rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    <span className="font-bold">Lỗi:</span> {file.errorMessage}
                </p>
            )}
        </div>
    );
}

function ActiveBadge({ active }) {
    return (
        <span
            className={[
                'inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold',
                active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            ].join(' ')}
        >
            {active ? 'Đang bật' : 'Đang tắt'}
        </span>
    );
}

function LoadingBox() {
    return (
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center">
                <Loader2 size={30} className="mx-auto animate-spin text-blue-700 dark:text-blue-300" />

                <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">Đang tải tài liệu AI...</p>
            </div>
        </div>
    );
}

function StatusIcon({ status }) {
    if (status === 'completed') return <CheckCircle2 size={15} />;
    if (status === 'failed') return <XCircle size={15} />;
    if (status === 'cancelled') return <X size={15} />;
    if (status === 'processing') return <Loader2 size={15} className="animate-spin" />;

    return <Clock3 size={15} />;
}

function EmptyState() {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <DatabaseZap size={26} />
            </div>

            <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">Chưa có tài liệu AI</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Upload tài liệu tuyển sinh, chính sách, hướng dẫn hoặc nội dung sản phẩm để chatbot có nguồn tri thức
                trả lời chính xác hơn.
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
