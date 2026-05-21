import { KeyRound } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';

import AuthLayout from '../components/auth/AuthLayout';
import PasswordInput from '../components/auth/PasswordInput';
import authService from '../services/authService';

export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const token = params.get('token') || '';
    const email = params.get('email') || '';

    const [form, setForm] = useState({
        password: '',
        password_confirmation: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    }

    function validate() {
        const nextErrors = {};

        if (!token) nextErrors.token = 'Token đặt lại mật khẩu không hợp lệ';
        if (!email) nextErrors.email = 'Email đặt lại mật khẩu không hợp lệ';

        if (!form.password) {
            nextErrors.password = 'Vui lòng nhập mật khẩu mới';
        } else if (form.password.length < 6) {
            nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
        }

        if (form.password_confirmation !== form.password) {
            nextErrors.password_confirmation = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            const response = await authService.resetPassword({
                token,
                email,
                password: form.password,
                password_confirmation: form.password_confirmation,
            });

            toast.success(response.message || 'Đặt lại mật khẩu thành công');
            navigate('/login', { replace: true });
        } catch (err) {
            setErrors(normalizeErrors(err));
            toast.error(err.message || 'Không thể đặt lại mật khẩu');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Đặt lại mật khẩu"
            description="Tạo mật khẩu mới để tiếp tục sử dụng tài khoản của bạn."
            question="Đã có tài khoản?"
            linkText="Đăng nhập"
            linkHref="/login"
            showInfoCard
        >
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:p-10">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                    <KeyRound size={38} />
                </div>

                <h1 className="text-center text-3xl font-extrabold text-blue-950 dark:text-white">Đặt lại mật khẩu</h1>

                <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nhập mật khẩu mới cho tài khoản:
                </p>

                <p className="mt-1 text-center text-sm font-bold text-blue-700 dark:text-blue-300">
                    {email || 'Email không hợp lệ'}
                </p>

                {(errors.token || errors.email) && (
                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        {errors.token || errors.email}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <PasswordInput
                        name="password"
                        label="Mật khẩu mới"
                        placeholder="Nhập mật khẩu mới"
                        value={form.password}
                        onChange={handleChange}
                        error={errors.password}
                    />

                    <PasswordInput
                        name="password_confirmation"
                        label="Xác nhận mật khẩu"
                        placeholder="Nhập lại mật khẩu mới"
                        value={form.password_confirmation}
                        onChange={handleChange}
                        error={errors.password_confirmation}
                    />

                    <button
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-950 py-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                    >
                        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </button>
                </form>
            </section>
        </AuthLayout>
    );
}

function normalizeErrors(err) {
    const result = {};

    Object.entries(err.errors || {}).forEach(([key, value]) => {
        result[key] = Array.isArray(value) ? value[0] : value;
    });

    return result;
}
