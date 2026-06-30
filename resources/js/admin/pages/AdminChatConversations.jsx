import {
    Bot,
    Box,
    CornerDownRight,
    Loader2,
    MessageSquareText,
    RefreshCcw,
    Search,
    UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getChatConversationStatusText } from '../mappers/adminChatConversationMapper';
import adminChatConversationService from '../services/adminChatConversationService';
import StatCard from '../components/ui/StatCard';

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'expired', label: 'Đã hết hạn' },
    { value: 'closed', label: 'Đã đóng' },
];

const sortOptions = [
    { value: 'latest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'most_messages', label: 'Nhiều tin nhắn' },
];

export default function AdminChatConversations() {
    const [conversations, setConversations] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [closeLoading, setCloseLoading] = useState(false);
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        date_from: '',
        date_to: '',
        sort: 'latest',
        page: 1,
        per_page: 10,
    });

    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedKeyword(filters.keyword.trim());
        }, 350);

        return () => window.clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        loadConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedKeyword, filters.status, filters.date_from, filters.date_to, filters.sort, filters.page, filters.per_page]);

    useEffect(() => {
        loadStatistics();
    }, []);

    async function loadStatistics() {
        try {
            const result = await adminChatConversationService.getStatistics();
            setStatistics(result);
        } catch {
            setStatistics(null);
        }
    }

    async function loadConversations() {
        try {
            setLoading(true);
            const result = await adminChatConversationService.getConversations({
                keyword: debouncedKeyword || undefined,
                status: filters.status || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
                sort: filters.sort,
                page: filters.page,
                per_page: filters.per_page,
            });

            setConversations(result.conversations || []);
            setMeta(result.meta || meta);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải danh sách hội thoại AI');
        } finally {
            setLoading(false);
        }
    }

    async function refreshAll() {
        await Promise.all([loadConversations(), loadStatistics()]);
    }

    async function openDetail(conversation) {
        try {
            setDetailLoading(true);
            const detail = await adminChatConversationService.getConversation(conversation.id);
            setSelected(detail);
        } catch (error) {
            toast.error(error?.message || 'Không thể tải chi tiết hội thoại');
        } finally {
            setDetailLoading(false);
        }
    }

    async function closeSelectedConversation() {
        if (!selected || selected.status === 'closed') return;

        try {
            setCloseLoading(true);
            const updated = await adminChatConversationService.closeConversation(selected.id);

            setSelected((prev) => ({
                ...prev,
                ...updated,
                messages: prev?.messages || [],
            }));
            setConversations((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
            toast.success('Đã đóng hội thoại AI');
        } catch (error) {
            toast.error(error?.message || 'Không thể đóng hội thoại AI');
        } finally {
            setCloseLoading(false);
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
            date_from: '',
            date_to: '',
            sort: 'latest',
            page: 1,
            per_page: 10,
        });
        setDebouncedKeyword('');
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Hội thoại AI</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi lịch sử chatbot, ngữ cảnh tóm tắt và các phiên chat của user/guest.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={refreshAll}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                    <RefreshCcw size={16} />
                    Làm mới
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng phiên" value={statistics?.totalSessions || 0} tone="blue" />
                <StatCard label="Đang hoạt động" value={statistics?.activeSessions || 0} tone="green" />
                <StatCard label="Tổng tin nhắn" value={statistics?.totalMessages || 0} tone="violet" />
                <StatCard label="AI phản hồi" value={statistics?.assistantMessages || 0} tone="amber" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            value={filters.keyword}
                            onChange={(e) => updateFilter('keyword', e.target.value)}
                            placeholder="Tìm theo user, guest token, nội dung..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                    </div>

                    <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <input type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                    <input type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />

                    <button type="button" onClick={resetFilters} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
                        Xóa lọc
                    </button>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-slate-500">
                            <Loader2 className="mr-2 animate-spin" size={18} />
                            Đang tải hội thoại...
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="py-16 text-center text-sm text-slate-500">Chưa có hội thoại phù hợp.</div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {conversations.map((conversation) => (
                                <ConversationRow
                                    key={conversation.id}
                                    conversation={conversation}
                                    active={selected?.id === conversation.id}
                                    onClick={() => openDetail(conversation)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                        <span className="text-slate-500">
                            Trang {meta.currentPage}/{meta.lastPage} - {meta.total} phiên
                        </span>
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

                <ChatDetailPanel
                    conversation={selected}
                    loading={detailLoading}
                    closeLoading={closeLoading}
                    onCloseConversation={closeSelectedConversation}
                />
            </div>
        </div>
    );
}

function ConversationRow({ conversation, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'block w-full px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60',
                active ? 'bg-blue-50/70 dark:bg-blue-500/10' : '',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <MessageSquareText size={16} className="text-blue-700" />
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {conversation.title}
                        </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                        {conversation.user ? `${conversation.user.name} - ${conversation.user.email}` : `Guest: ${conversation.guestToken || 'Không có token'}`}
                    </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    {conversation.statusText}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{conversation.messagesCount} tin nhắn</span>
                <span>Cập nhật: {conversation.lastMessageAt || '-'}</span>
                {conversation.summary ? <span>Có summary</span> : null}
            </div>
        </button>
    );
}

function ChatDetailPanel({ conversation, loading, closeLoading, onCloseConversation }) {
    const messageGroups = useMemo(() => groupMessages(conversation?.messages || []), [conversation]);

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <Loader2 className="mr-2 inline animate-spin" size={18} />
                Đang tải chi tiết...
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <Bot className="mx-auto mb-3 text-slate-400" size={32} />
                Chọn một hội thoại để xem chi tiết.
            </div>
        );
    }

    return (
        <aside className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{conversation.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                    {conversation.user ? `${conversation.user.name} - ${conversation.user.email}` : `Guest: ${conversation.guestToken || 'Không có token'}`}
                </p>
                <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {getChatConversationStatusText(conversation.status)}
                </div>
                {conversation.status !== 'closed' ? (
                    <button
                        type="button"
                        onClick={onCloseConversation}
                        disabled={closeLoading}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                        {closeLoading ? 'Đang đóng...' : 'Đóng hội thoại'}
                    </button>
                ) : null}
            </div>

            {conversation.summary ? (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                    <div className="mb-1 text-xs font-black uppercase">Tóm tắt ngữ cảnh</div>
                    {conversation.summary}
                </div>
            ) : null}

            <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
                {messageGroups.map((group) => (
                    <MessagePair key={group.question?.id || group.replies[0]?.id} group={group} />
                ))}
            </div>
        </aside>
    );
}

function MessagePair({ group }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            {group.question ? <MessageBubble message={group.question} /> : null}

            {group.replies.map((reply) => (
                <div key={reply.id} className="mt-3 border-l-2 border-blue-200 pl-3 dark:border-blue-500/40">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400">
                        <CornerDownRight size={13} />
                        Trả lời cho #{reply.parentMessageId || group.question?.id || 'không rõ'}
                    </div>
                    <MessageBubble message={reply} />
                    <ProductPreview products={reply.products} />
                    <DebugPreview message={reply} />
                </div>
            ))}
        </div>
    );
}

function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const Icon = isUser ? UserRound : Bot;

    return (
        <div className={isUser ? 'text-right' : 'text-left'}>
            <div
                className={[
                    'inline-block max-w-[94%] rounded-2xl px-3 py-2 text-sm leading-6',
                    isUser
                        ? 'bg-blue-950 text-white'
                        : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
                ].join(' ')}
            >
                <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase opacity-70">
                    <Icon size={13} />
                    {isUser ? 'Người dùng' : 'AI'}
                </div>
                <div className="whitespace-pre-line break-words">{message.content}</div>
                <div className="mt-1 text-[11px] opacity-60">
                    #{message.id}
                    {message.parentMessageId ? ` -> #${message.parentMessageId}` : ''}
                    {' · '}
                    {message.createdAt}
                </div>
            </div>
        </div>
    );
}

function ProductPreview({ products = [] }) {
    if (!products.length) return null;

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1 text-xs font-black text-slate-600 dark:text-slate-300">
                <Box size={14} />
                Sản phẩm được gợi ý
            </div>
            <div className="grid gap-2">
                {products.slice(0, 4).map((product) => (
                    <div key={product.id || product.slug || product.name} className="rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="font-black text-slate-900 dark:text-white">{product.name || 'Sản phẩm'}</div>
                        <div className="mt-1 text-slate-500">
                            {formatPrice(product)}
                            {product.stock_text ? ` · ${product.stock_text}` : ''}
                        </div>
                        {getProductUrl(product) ? (
                            <a href={getProductUrl(product)} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-bold text-blue-700 hover:underline dark:text-blue-300">
                                Xem sản phẩm
                            </a>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

function DebugPreview({ message }) {
    const toolCount = message.toolCalls?.length || 0;
    const sourceCount = message.sources?.length || 0;
    const debug = message.metadata?.debug || {};
    const intent = message.metadata?.intent || debug.intent || '';

    if (!toolCount && !sourceCount && !intent) return null;

    return (
        <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-[11px] dark:border-slate-800 dark:bg-slate-900">
            <summary className="cursor-pointer font-black text-slate-600 dark:text-slate-300">
                Debug chatbot
            </summary>

            <div className="mt-3 flex flex-wrap gap-2">
                {intent ? <DebugBadge label="Intent" value={intent} tone="blue" /> : null}
                <DebugBadge label="Tool" value={toolCount} tone="emerald" />
                <DebugBadge label="Sản phẩm" value={debug.product_count ?? message.products?.length ?? 0} tone="amber" />
                <DebugBadge label="RAG" value={sourceCount} tone="violet" />
                {debug.total_duration_ms ? <DebugBadge label="Tổng" value={`${debug.total_duration_ms}ms`} tone="slate" /> : null}
                {debug.tool_duration_ms ? <DebugBadge label="Tool time" value={`${debug.tool_duration_ms}ms`} tone="slate" /> : null}
            </div>

            {message.toolCalls?.length ? (
                <div className="mt-3 space-y-2">
                    {message.toolCalls.map((toolCall, index) => (
                        <div key={`${toolCall.name}-${index}`} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                            <div className="font-black text-slate-800 dark:text-slate-100">{toolCall.name || 'tool'}</div>
                            <div className="mt-1 text-slate-500">
                                found: {String(toolCall.summary?.found ?? toolCall.result?.found ?? 'unknown')}
                                {' · '}
                                products: {toolCall.summary?.product_count ?? toolCall.result?.products?.length ?? (toolCall.result?.product ? 1 : 0)}
                            </div>
                            <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-950 p-2 text-[10px] text-slate-100">
                                {safeJson({
                                    arguments: toolCall.arguments || {},
                                    summary: toolCall.summary || {},
                                })}
                            </pre>
                        </div>
                    ))}
                </div>
            ) : null}

            {message.sources?.length ? (
                <div className="mt-3 space-y-1">
                    {message.sources.map((source, index) => (
                        <div key={`${source.file_id || source.filename || index}`} className="rounded bg-violet-50 px-2 py-1 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                            {source.filename || source.file_id || 'Nguồn RAG'}
                        </div>
                    ))}
                </div>
            ) : null}
        </details>
    );
}

function DebugBadge({ label, value, tone = 'slate' }) {
    const toneClass = {
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    };

    return (
        <span className={`rounded-full px-2 py-1 font-bold ${toneClass[tone] || toneClass.slate}`}>
            {label}: {value}
        </span>
    );
}

function safeJson(value) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return '{}';
    }
}

function formatPrice(product = {}) {
    if (product.price_text) return product.price_text;

    if (product.price && typeof product.price !== 'object') {
        return String(product.price);
    }

    const min = product.price?.min ?? product.min_price;
    const max = product.price?.max ?? product.max_price;

    if (min && max && Number(min) !== Number(max)) {
        return `${formatMoney(min)} - ${formatMoney(max)}`;
    }

    if (min || max) {
        return formatMoney(min || max);
    }

    return 'Chưa có giá';
}

function formatMoney(value) {
    const number = Number(value || 0);

    if (!number) return '0 đ';

    return `${number.toLocaleString('vi-VN')} đ`;
}

function getProductUrl(product = {}) {
    return product.url || product.product_url || '';
}

function groupMessages(messages) {
    const questions = [];
    const questionMap = new Map();
    const orphanReplies = [];

    messages.forEach((message) => {
        if (message.role === 'user') {
            const group = { question: message, replies: [] };
            questions.push(group);
            questionMap.set(message.id, group);
            return;
        }

        if (message.parentMessageId && questionMap.has(message.parentMessageId)) {
            questionMap.get(message.parentMessageId).replies.push(message);
            return;
        }

        orphanReplies.push(message);
    });

    orphanReplies.forEach((reply) => {
        const previousQuestion = [...questions].reverse().find((group) => group.question?.id < reply.id);

        if (previousQuestion) {
            previousQuestion.replies.push(reply);
        } else {
            questions.push({ question: null, replies: [reply] });
        }
    });

    return questions;
}
