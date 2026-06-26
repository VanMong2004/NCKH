import { Bot, DatabaseZap, FileText, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import aiService from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

export default function FloatingAIChat() {
    const { user } = useAuth();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [conversationId, setConversationId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open && !historyLoaded) {
            loadHistory();
        }
    }, [open, historyLoaded]);

    useEffect(() => {
        if (open) {
            window.setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [messages, loading]);

    async function loadHistory() {
        try {
            const latest = await aiService.latestConversation();

            setMessages(latest.messages || []);
            setConversationId(latest.conversationId || null);
        } catch {
            setMessages([]);
            setConversationId(null);
        } finally {
            setHistoryLoaded(true);
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    function normalizeText(value) {
        return String(value || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }

    function hasAnsweredQuestion(messages = [], question = '') {
        const normalizedQuestion = normalizeText(question);

        return messages.some((item) => {
            const currentQuestion = normalizeText(item.question);
            const hasSameQuestion =
                currentQuestion === normalizedQuestion ||
                currentQuestion.includes(normalizedQuestion) ||
                normalizedQuestion.includes(currentQuestion);

            return hasSameQuestion && Boolean(item.answer);
        });
    }

    async function recoverLatestAnswer(question, currentConversationId = null) {
        const delays = [800, 1800, 3000];

        for (const delay of delays) {
            await sleep(delay);

            const latest = currentConversationId
                ? await aiService.conversation(currentConversationId)
                : await aiService.latestConversation();

            const recoveredMessages = latest.messages || [];

            if (hasAnsweredQuestion(recoveredMessages, question)) {
                return {
                    conversationId: latest.id || latest.conversationId || currentConversationId || null,
                    messages: recoveredMessages,
                };
            }
        }

        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const text = message.trim();

        if (!text || loading) return;

        const tempMessage = {
            id: `temp-${Date.now()}`,
            question: text,
            answer: '',
            source: 'local',
            sources: [],
            toolCalls: [],
            conversationId,
        };

        setMessages((prev) => [...prev, tempMessage]);
        setMessage('');

        try {
            setLoading(true);

            const result = await aiService.chat(text, conversationId);

            setConversationId(result.conversationId || conversationId);

            setMessages((prev) => [...prev.filter((item) => item.id !== tempMessage.id), result]);
        } catch (error) {
            try {
                const recovered = await recoverLatestAnswer(text, conversationId);

                if (recovered?.messages?.length) {
                    setMessages(recovered.messages);
                    setConversationId(recovered.conversationId || conversationId);

                    toast.info('AI phản hồi hơi chậm, mình đã tải lại câu trả lời.');
                    return;
                }
            } catch {
                // Không làm gì thêm, rơi xuống thông báo lỗi nhẹ bên dưới.
            }

            setMessages((prev) =>
                prev.map((item) =>
                    item.id === tempMessage.id
                        ? {
                              ...item,
                              answer: 'AI phản hồi chậm hoặc kết nối bị ngắt tạm thời. Bạn có thể gửi lại câu hỏi hoặc đóng/mở lại khung chat để tải hội thoại mới nhất.',
                              source: 'error',
                          }
                        : item,
                ),
            );

            toast.error(error.message || 'AI chưa thể phản hồi lúc này');
        } finally {
            setLoading(false);
        }
    }

    function quickAsk(text) {
        setMessage(text);

        window.setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }

    function handleNewChat() {
        setMessages([]);
        setConversationId(null);
        setHistoryLoaded(true);
        setMessage('');

        window.setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-white shadow-xl transition hover:bg-blue-900 md:bottom-6"
                aria-label="Mở trợ lý AI"
            >
                <MessageCircle size={26} />
            </button>

            {open && (
                <div className="fixed inset-x-3 bottom-20 z-[70] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:bottom-6 md:right-6 md:left-auto md:w-[410px]">
                    <div className="flex items-center justify-between bg-blue-950 px-5 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                                <Bot size={22} />
                            </div>

                            <div>
                                <h3 className="font-extrabold">Trợ lý AI CTUT Store</h3>

                                <p className="text-xs text-blue-100">
                                    {user ? `Xin chào ${user.name || 'bạn'}` : 'Hỗ trợ sản phẩm, đơn hàng, chính sách'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleNewChat}
                                className="rounded-xl px-3 py-2 text-xs font-bold text-blue-50 hover:bg-white/10"
                            >
                                Mới
                            </button>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-xl p-2 hover:bg-white/10"
                                aria-label="Đóng trợ lý AI"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[55vh] min-h-[390px] overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900">
                        {messages.length === 0 && !loading && <WelcomeBox onAsk={quickAsk} />}

                        <div className="space-y-4">
                            {messages.map((item) => (
                                <ChatPair key={item.id} item={item} />
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    <Loader2 size={16} className="animate-spin" />
                                    AI đang tra cứu dữ liệu.
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Nhập câu hỏi về sản phẩm, đơn hàng, chính sách..."
                                maxLength={2000}
                                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />

                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Gửi câu hỏi"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                            AI dùng dữ liệu sản phẩm và tài liệu tri thức đã được quản trị viên duyệt.
                        </p>
                    </form>
                </div>
            )}
        </>
    );
}

function WelcomeBox({ onAsk }) {
    const suggestions = [
        'Shop có bán áo CTUT không?',
        'Tôi muốn tìm sản phẩm làm quà tặng',
        'Chính sách đổi trả như thế nào?',
    ];

    return (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <Bot size={21} />
                </div>

                <div>
                    <h4 className="font-bold text-blue-950 dark:text-white">Xin chào, mình có thể hỗ trợ gì?</h4>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Bạn có thể hỏi về sản phẩm, giá, size, màu sắc, tồn kho, đơn hàng hoặc chính sách của CTUT
                        Store.
                    </p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onAsk(item)}
                        className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                    >
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ChatPair({ item }) {
    return (
        <div className="space-y-3">
            {item.question && (
                <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-blue-950 px-4 py-3 text-sm leading-6 text-white">
                    {item.question}
                </div>
            )}

            {item.answer ? (
                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                    <div className="whitespace-pre-line">
                        {item.answer}
                    </div>

                    <ChatProducts
                        products={item.products}
                    />

                    <ChatSources
                        sources={item.sources}
                    />

                    <ChatToolCalls
                        toolCalls={item.toolCalls}
                    />
                </div>
            ) : (
                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-slate-400 shadow-sm dark:bg-slate-950 dark:text-slate-500">
                    Đang chờ AI phản hồi.
                </div>
            )}
        </div>
    );
}

function ChatAnswer({ text = '' }) {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;

    const imageMatch = [...text.matchAll(imageRegex)];
    const linkMatch = [...text.matchAll(linkRegex)];

    let content = text;

    imageMatch.forEach((m) => {
        content = content.replace(m[0], '');
    });

    linkMatch.forEach((m) => {
        content = content.replace(m[0], '');
    });

    const productLink = linkMatch.find((m) =>
        m[2].includes('/product/')
    )?.[2];

    return (
        <>
            <div className="whitespace-pre-line">
                {content.trim()}
            </div>

            {imageMatch.map((m, index) => (
                <ChatImage
                    key={index}
                    src={m[2]}
                    alt={m[1]}
                    productLink={productLink}
                />
            ))}

            {productLink && (
                <a
                    href={productLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-xl bg-blue-950 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900"
                >
                    Xem sản phẩm
                </a>
            )}
        </>
    );
}

function ChatImage({ src, alt, productLink }) {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block text-sm font-semibold text-blue-700 underline"
            >
                Xem ảnh sản phẩm
            </a>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            onClick={() => {
                if (productLink) {
                    window.open(productLink, '_blank');
                } else {
                    window.open(src, '_blank');
                }
            }}
            className="mt-3 w-full cursor-pointer rounded-xl border border-slate-200 object-cover transition hover:opacity-90 dark:border-slate-700"
        />
    );
}

function ChatSources({ sources = [] }) {
    const visibleSources = sources.filter((item) => item.filename || item.fileId);

    if (!visibleSources.length) return null;

    return (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <FileText size={14} />
                Tài liệu tham khảo
            </div>

            <div className="space-y-1">
                {visibleSources.slice(0, 3).map((source, index) => (
                    <div
                        key={`${source.fileId || source.filename}-${index}`}
                        className="text-xs leading-5 text-slate-600 dark:text-slate-300"
                    >
                        <span className="font-bold">{source.filename || source.fileId}</span>
                        {source.quote && <span className="text-slate-500"> — {source.quote}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChatToolCalls({ toolCalls = [] }) {
    if (!toolCalls.length) return null;

    return (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                <DatabaseZap size={14} />
                Đã tra cứu dữ liệu hệ thống
            </div>
        </div>
    );
}

function formatPrice(product) {
    const min = Number(product.min_price || 0);
    const max = Number(product.max_price || 0);

    if (!min && !max) return 'Liên hệ';

    const formatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    });

    if (min && max && min !== max) {
        return `${formatter.format(min)} - ${formatter.format(max)}`;
    }

    return formatter.format(min || max);
}

function ChatProducts({ products = [] }) {
    if (!products.length) return null;

    return (
        <div className="mt-3 space-y-3">
            {products.slice(0, 3).map((product) => {
                const productUrl = product.product_url || `/product/${product.slug}`;
                const imageUrl = product.image_url || product.thumbnail || '/images/no-image.png';

                return (
                    <a
                        key={product.id}
                        href={productUrl}
                        className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-500/10"
                    >
                        <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                            onError={(e) => {
                                e.currentTarget.src = '/images/no-image.png';
                            }}
                        />

                        <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-sm font-black text-blue-950 dark:text-white">
                                {product.name}
                            </div>

                            <div className="mt-1 text-sm font-black text-red-600">
                                {formatPrice(product)}
                            </div>

                            <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {product.in_stock || product.available_stock > 0
                                    ? `Còn ${product.available_stock || product.stock || 0} sản phẩm`
                                    : 'Hết hàng'}
                            </div>

                            <div className="mt-2 inline-flex rounded-lg bg-blue-950 px-3 py-1.5 text-xs font-bold text-white">
                                Xem chi tiết
                            </div>
                        </div>
                    </a>
                );
            })}
        </div>
    );
}