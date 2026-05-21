import { Info, Lock, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthInput from './AuthInput';
import authService from '../../services/authService';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    function validate() {
        if (!email.trim()) {
            setError('Vui lòng nhập email');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Email không đúng định dạng');
            return false;
        }

        setError('');
        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            const response = await authService.forgotPassword({ email });

            setSent(true);
            toast.success(response.message || 'Đã gửi hướng dẫn đặt lại mật khẩu');
        } catch (err) {
            setError(err.errors?.email?.[0] || err.errors?.email || '');
            toast.error(err.message || 'Không thể gửi yêu cầu');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900 md:p-10">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                <Mail size={46} />
                <span className="-ml-4 mt-12 rounded-full bg-blue-700 p-2 text-white">
                    <Lock size={18} />
                </span>
            </div>

            <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Quên mật khẩu?</h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
                Nhập email tài khoản để nhận mã OTP hoặc liên kết đặt lại mật khẩu.
            </p>

            {sent ? (
                <div className="mt-8 rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/30">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Yêu cầu đã được gửi.</p>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Vui lòng kiểm tra email và làm theo hướng dẫn.
                    </p>

                    <Link
                        to="/login"
                        className="mt-5 inline-block rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white dark:bg-blue-700"
                    >
                        Quay lại đăng nhập
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
                    <AuthInput
                        label="Email"
                        icon={<Mail size={18} />}
                        placeholder="Nhập email tài khoản"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        error={error}
                    />

                    <button
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-950 py-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                    >
                        <Send size={18} />
                        {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>

                    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                        <Info size={18} className="mt-0.5 shrink-0" />
                        <p>Hệ thống sẽ gửi mã OTP hoặc liên kết đặt lại mật khẩu qua email.</p>
                    </div>

                    <p className="text-center">
                        <Link to="/login" className="font-bold text-blue-700 dark:text-blue-300">
                            ‹ Quay lại đăng nhập
                        </Link>
                    </p>
                </form>
            )}
        </section>
    );
}
