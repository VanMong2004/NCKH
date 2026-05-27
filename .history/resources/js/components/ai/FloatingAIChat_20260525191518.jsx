import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import aiService from '../../services/aiService';

export default function FloatingAIChat() {
    const { user } = useAuth();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        if (open && user && !historyLoaded) {
            loadHistory();
        }
    }, [open, user, historyLoaded]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [messages, loading]);

    async function loadHistory() {
        try {
            const data = await aiService.history();
            setMessages(data);
            setHistoryLoaded(true);
        } catch {
            setMessages([]);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const text = message.trim();

        if (!text) return;

        if (!user) {
            toast.warning('Vui lòng đăng nhập để sử dụng trợ lý AI');
            return;
        }

        const tempMessage = {
            id: `temp-${Date.now()}`,
            question: text,
            answer: '',
            source: 'local',
        };

        setMessages((prev) => [...prev, tempMessage]);
        setMessage('');

        try {
            setLoading(true);

            const result = await aiService.chat(text);

            setMessages((prev) => [...prev.filter((item) => item.id !== tempMessage.id), result]);
        } catch (error) {
            setMessages((prev) => prev.filter((item) => item.id !== tempMessage.id));

            toast.error(error.message || 'AI chưa thể phản hồi lúc này');
        } finally {
            setLoading(false);
        }
    }

    function quickAsk(text) {
        setMessage(text);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-white shadow-xl transition hover:bg-blue-900 md:bottom-6"
            >
                <MessageCircle size={26} />
            </button>

            {open && (
                <div className="fixed inset-x-3 bottom-20 z-[70] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:bottom-6 md:right-6 md:left-auto md:w-[390px]">
                    <div className="flex items-center justify-between bg-blue-950 px-5 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                                <Bot size={22} />
                            </div>

                            <div>
                                <h3 className="font-extrabold">Trợ lý AI</h3>

                                <p className="text-xs text-blue-100">Hỗ trợ sản phẩm, đơn hàng, chiến dịch</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-xl p-2 hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="max-h-[55vh] min-h-[380px] overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900">
                        {messages.length === 0 && <WelcomeBox onAsk={quickAsk} />}

                        <div className="space-y-4">
                            {messages.map((item) => (
                                <ChatPair key={item.id} item={item} />
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    <Loader2 size={16} className="animate-spin" />
                                    AI đang trả lời...
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
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Nhập câu hỏi..."
                                maxLength={2000}
                                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />

                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950 text-white disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>

                        <p className="mt-2 text-xs text-slate-400">AI hiện đang dùng dữ liệu mô phỏng từ hệ thống.</p>
                    </form>
                </div>
            )}
        </>
    );
}

function WelcomeBox({ onAsk }) {
    const suggestions = ['Tôi muốn tìm áo CTU', 'Đơn hàng của tôi ở đâu?', 'Có chiến dịch nào đang mở?'];

    return (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950">
            <h4 className="font-bold text-blue-950 dark:text-white">Xin chào, mình có thể hỗ trợ gì?</h4>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Bạn có thể hỏi về sản phẩm, đơn hàng hoặc chiến dịch.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onAsk(item)}
                        className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
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
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-blue-950 px-4 py-3 text-sm text-white">
                    {item.question}
                </div>
            )}

            {item.answer && (
                <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                    {item.answer}
                </div>
            )}
        </div>
    );
}
