import { Copy, Eye, Loader2, Mail, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import { contactStatusOptions } from '../mappers/adminContactMapper';
import adminContactService from '../services/adminContactService';

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
];

export default function AdminContacts() {
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        subject: '',
        date_from: '',
        date_to: '',
        sort: 'latest',
        page: 1,
        per_page: 10,
    });
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 10 });
    const [detail, setDetail] = useState({ open: false, contact: null });
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(filters.keyword.trim()), 350);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedKeyword,
        filters.status,
        filters.subject,
        filters.date_from,
        filters.date_to,
        filters.sort,
        filters.page,
        filters.per_page,
    ]);

    async function loadContacts() {
        try {
            setLoading(true);
            const result = await adminContactService.getContacts({
                keyword: debouncedKeyword || undefined,
                status: filters.status || undefined,
                subject: filters.subject || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
                sort: filters.sort,
                page: filters.page,
                per_page: filters.per_page,
            });

            setContacts(result.contacts || []);
            setStats(result.stats || {});
            setMeta(result.meta || { currentPage: 1, lastPage: 1, total: 0, perPage: filters.per_page });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách liên hệ');
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(key, value) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1,
        }));
    }

    function resetFilters() {
        setFilters({
            keyword: '',
            status: '',
            subject: '',
            date_from: '',
            date_to: '',
            sort: 'latest',
            page: 1,
            per_page: 10,
        });
        setDebouncedKeyword('');
    }

    async function openDetail(contact) {
        try {
            const detailContact = await adminContactService.getContact(contact.id);
            setDetail({ open: true, contact: detailContact });
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết liên hệ');
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        await adminContactService.deleteContact(deleteTarget.id);
        toast.success('Đã xóa liên hệ');
        setDeleteTarget(null);
        await loadContacts();
    }

    async function handleSaved(updated) {
        setDetail({ open: true, contact: updated });
        await loadContacts();
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Liên hệ</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý các yêu cầu liên hệ được gửi từ website.
                    </p>
                </div>

                <button type="button" onClick={loadContacts} disabled={loading} className={secondaryButtonClass}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    Làm mới
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Tổng liên hệ" value={stats.total || 0} tone="blue" icon={Mail} />
                <StatCard label="Chờ xử lý" value={stats.pending || 0} tone="amber" />
                <StatCard label="Đang xử lý" value={stats.processing || 0} tone="violet" />
                <StatCard label="Đã phản hồi" value={stats.replied || 0} tone="emerald" />
                <StatCard label="Đã đóng" value={stats.closed || 0} tone="slate" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-3">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={filters.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder="Tìm tên, email, SĐT..."
                                className={controlClass + ' pl-9'}
                            />
                        </div>
                        <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className={controlClass + ' lg:col-span-2'}>
                            {contactStatusOptions.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <input value={filters.subject} onChange={(e) => updateFilter('subject', e.target.value)} placeholder="Chủ đề" className={controlClass + ' lg:col-span-2'} />
                        <input type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} className={controlClass + ' lg:col-span-1'} />
                        <input type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} className={controlClass + ' lg:col-span-1'} />
                        <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className={controlClass + ' lg:col-span-1'}>
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <button type="button" onClick={resetFilters} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 lg:col-span-2">
                            Xóa lọc
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr>
                                <Th>Người gửi</Th>
                                <Th>Email</Th>
                                <Th>Số điện thoại</Th>
                                <Th>Chủ đề</Th>
                                <Th>Trạng thái</Th>
                                <Th>Ngày gửi</Th>
                                <Th className="text-right">Thao tác</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Loader2 size={26} className="mx-auto animate-spin text-blue-600" />
                                        <p className="mt-3 text-sm text-slate-500">Đang tải liên hệ...</p>
                                    </td>
                                </tr>
                            ) : contacts.length > 0 ? (
                                contacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                                        <Td className="font-semibold text-slate-900 dark:text-white">{contact.fullName || 'Không có tên'}</Td>
                                        <Td>{contact.email}</Td>
                                        <Td>{contact.phone || '—'}</Td>
                                        <Td><span className="line-clamp-1 max-w-[260px]">{contact.subject}</span></Td>
                                        <Td><StatusBadge status={contact.status} text={contact.statusText} /></Td>
                                        <Td>{contact.createdAt || '—'}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openDetail(contact)} className={smallButtonClass}>
                                                    <Eye size={15} /> Chi tiết
                                                </button>
                                                <button type="button" onClick={() => setDeleteTarget(contact)} className={dangerButtonClass}>
                                                    <Trash2 size={15} /> Xóa
                                                </button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Mail size={30} className="mx-auto text-slate-300" />
                                        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">Chưa có liên hệ nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={meta} loading={loading} perPage={filters.per_page} onPage={(page) => updateFilter('page', page)} onPerPage={(value) => updateFilter('per_page', value)} showing={contacts.length} />
            </section>

            <ContactDetailModal
                contact={detail.contact}
                open={detail.open}
                onClose={() => setDetail({ open: false, contact: null })}
                onSaved={handleSaved}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Xóa liên hệ"
                message={`Bạn muốn xóa liên hệ của ${deleteTarget?.fullName || deleteTarget?.email || 'người dùng này'}?`}
                description="Liên hệ sẽ được ẩn khỏi danh sách xử lý chính."
                confirmText="Xóa liên hệ"
                type="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}

function ContactDetailModal({ open, contact, onClose, onSaved }) {
    const [status, setStatus] = useState('pending');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!contact) return;
        setStatus(contact.status || 'pending');
        setNote(contact.adminNote || '');
    }, [contact]);

    if (!open || !contact) return null;

    async function handleSave() {
        try {
            setSaving(true);
            let updated = contact;

            if (status !== contact.status) {
                updated = await adminContactService.updateStatus(contact.id, status);
            }

            updated = await adminContactService.updateNote(contact.id, note);
            toast.success('Đã lưu thông tin liên hệ');
            onSaved?.(updated);
        } catch (error) {
            toast.error(error?.message || 'Không thể lưu liên hệ');
        } finally {
            setSaving(false);
        }
    }

    async function copyEmail() {
        try {
            await navigator.clipboard.writeText(contact.email || '');
            toast.success('Đã copy email');
        } catch {
            toast.error('Không thể copy email');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết liên hệ</h2>
                        <p className="mt-1 text-sm text-slate-500">Xem nội dung, cập nhật trạng thái và ghi chú nội bộ.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Info label="Họ tên" value={contact.fullName || 'Không có tên'} />
                        <Info label="Ngày gửi" value={contact.createdAt || '—'} />
                        <Info label="Email" value={contact.email || '—'} action={<button type="button" onClick={copyEmail} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300"><Copy size={13} /> Copy</button>} />
                        <Info label="Số điện thoại" value={contact.phone || '—'} />
                    </div>

                    <Info label="Chủ đề" value={contact.subject || '—'} />

                    <div>
                        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Nội dung</p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                            {contact.message || 'Không có nội dung'}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Trạng thái</span>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={controlClass}>
                                {contactStatusOptions.filter((item) => item.value).map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>

                        <Info label="Thời điểm phản hồi" value={contact.repliedAt || 'Chưa phản hồi'} />
                    </div>

                    <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Ghi chú nội bộ</span>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="Ghi chú chỉ hiển thị trong admin..." className={textareaClass} />
                    </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                    <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Đóng</button>
                    <button type="button" onClick={handleSave} disabled={saving} className={primaryButtonClass}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}

function Info({ label, value, action }) {
    return (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                {action}
            </div>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}

function StatusBadge({ status, text }) {
    const classes = {
        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        processing: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
        replied: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    };

    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status] || classes.closed}`}>{text}</span>;
}

function Pagination({ meta, loading, perPage, showing, onPage, onPerPage }) {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-sm text-slate-500">Hiển thị <b>{showing}</b> / <b>{meta.total}</b> liên hệ</p>
            <div className="flex items-center gap-2">
                <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </select>
                <button type="button" disabled={meta.currentPage <= 1 || loading} onClick={() => onPage(Math.max(1, meta.currentPage - 1))} className={pageButtonClass}>Trước</button>
                <span className="min-w-[80px] text-center text-sm text-slate-500">{meta.currentPage}/{meta.lastPage}</span>
                <button type="button" disabled={meta.currentPage >= meta.lastPage || loading} onClick={() => onPage(Math.min(meta.lastPage, meta.currentPage + 1))} className={pageButtonClass}>Sau</button>
            </div>
        </div>
    );
}

function Th({ children, className = '' }) {
    return <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}>{children}</th>;
}

function Td({ children, className = '' }) {
    return <td className={`whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300 ${className}`}>{children}</td>;
}

const controlClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const textareaClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const secondaryButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
const primaryButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200';
const smallButtonClass = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800';
const dangerButtonClass = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10';
const pageButtonClass = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200';
