import { ChevronRight, Home, Loader2, Mail, MessageCircle, RefreshCcw, Send, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import ContactForm from '../components/contact/ContactForm';
import ContactInfo from '../components/contact/ContactInfo';
import ContactSupport from '../components/contact/ContactSupport';
import MainLayout from '../layout/MainLayout';
import contactService from '../services/contactService';

export default function Contact() {
    const [contactInfo, setContactInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadContactInfo();
    }, []);

    async function loadContactInfo() {
        try {
            setLoadingInfo(true);
            setError('');

            const result = await contactService.getInfo();
            setContactInfo(result);
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Không thể tải thông tin liên hệ';

            setError(message);
            toast.error(message);
        } finally {
            setLoadingInfo(false);
        }
    }

    async function handleSubmit(payload) {
        try {
            setSubmitting(true);

            const result = await contactService.submit(payload);

            toast.success(result.responseMessage || 'Gửi liên hệ thành công');
            return true;
        } catch (err) {
            const validationErrors = err?.response?.data?.errors;
            const message = err?.response?.data?.message || err.message || 'Không thể gửi liên hệ';

            if (validationErrors) {
                const firstError = Object.values(validationErrors)?.[0]?.[0];

                toast.error(firstError || message);
            } else {
                toast.error(message);
            }

            return false;
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <MainLayout>
            <main className="bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <Breadcrumb />

                    <ContactHero />

                    {loadingInfo ? (
                        <ContactLoading />
                    ) : error && !contactInfo ? (
                        <ContactError message={error} onRetry={loadContactInfo} />
                    ) : (
                        <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
                            <div className="min-w-0 space-y-7">
                                <ContactForm submitting={submitting} onSubmit={handleSubmit} />

                                <ContactSupport />
                            </div>

                            <aside className="space-y-7">
                                <ContactInfo info={contactInfo} />

                                <ContactQuickNote />
                            </aside>
                        </section>
                    )}
                </div>
            </main>
        </MainLayout>
    );
}

function Breadcrumb() {
    return (
        <nav className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Home size={14} className="text-blue-950 dark:text-blue-300" />

            <ChevronRight size={14} />

            <Link to="/" className="transition hover:text-blue-950 dark:hover:text-blue-300">
                Trang chủ
            </Link>

            <ChevronRight size={14} />

            <span className="text-blue-950 dark:text-blue-300">Liên hệ</span>
        </nav>
    );
}

function ContactHero() {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:p-10">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/10" />
            <div className="absolute -bottom-12 left-10 h-40 w-40 rounded-full bg-sky-100 blur-3xl dark:bg-sky-500/10" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <Sparkles size={14} />
                        Trung tâm liên hệ
                    </div>

                    <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-blue-950 dark:text-white md:text-5xl">
                        Liên hệ và hỗ trợ
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                        Gửi câu hỏi, phản hồi hoặc yêu cầu hỗ trợ liên quan đến đơn hàng, thanh toán, chiến dịch và tài
                        khoản người dùng.
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                        <MessageCircle size={24} />
                    </div>

                    <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Cần hỗ trợ nhanh?</h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Hãy mô tả rõ vấn đề để bộ phận hỗ trợ phản hồi chính xác hơn.
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-white dark:bg-blue-600">
                        <Send size={16} />
                        Phản hồi sớm nhất có thể
                    </div>
                </div>
            </div>
        </section>
    );
}

function ContactLoading() {
    return (
        <section className="mt-7 rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Loader2 size={26} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-black text-blue-950 dark:text-white">Đang tải thông tin liên hệ...</p>
        </section>
    );
}

function ContactError({ message, onRetry }) {
    return (
        <section className="mt-7 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <RefreshCcw size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-blue-950 dark:text-white">Không thể tải trang liên hệ</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
                <RefreshCcw size={16} />
                Thử lại
            </button>
        </section>
    );
}

function ContactQuickNote() {
    return (
        <section className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:to-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                <Mail size={21} />
            </div>

            <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-white">Lưu ý khi gửi liên hệ</h2>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li>Nhập đúng email để nhận phản hồi.</li>
                <li>Nêu rõ mã đơn hàng hoặc chiến dịch nếu có.</li>
                <li>Không gửi nhiều yêu cầu trùng nội dung trong thời gian ngắn.</li>
            </ul>
        </section>
    );
}
