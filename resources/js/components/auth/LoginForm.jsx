import { Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';

import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import GoogleButton from './GoogleButton';
import { useAuth } from '../../contexts/AuthContext';
import { withMinimumDelay } from '../../utils/demoDelay';

function isAdminUser(user) {
    if (!user) return false;

    if (user.role === 'admin') return true;
    if (user.role?.name === 'admin') return true;
    if (Array.isArray(user.roles) && user.roles.includes('admin')) return true;

    return false;
}

export default function LoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const from = location.state?.from;

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

        if (!form.email.trim()) nextErrors.email = 'Vui lòng nhập email';
        if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            const response = await withMinimumDelay(login(form.email, form.password));
            const user = response.data?.user;

            toast.success(response.message || 'Đăng nhập thành công');

            redirectAfterLogin(user);
        } catch (err) {
            setErrors(normalizeErrors(err));
            toast.error(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    }

    function redirectAfterLogin(user) {
        if (isAdminUser(user)) {
            if (from && typeof from === 'object' && from.pathname?.startsWith('/admin')) {
                navigate(
                    {
                        pathname: from.pathname,
                        search: from.search || '',
                        hash: from.hash || '',
                    },
                    {
                        replace: true,
                        state: from.state || null,
                    },
                );

                return;
            }

            navigate('/admin/dashboard', { replace: true });
            return;
        }

        if (from && typeof from === 'object' && from.pathname) {
            navigate(
                {
                    pathname: from.pathname,
                    search: from.search || '',
                    hash: from.hash || '',
                },
                {
                    replace: true,
                    state: from.state || null,
                },
            );

            return;
        }

        if (typeof from === 'string') {
            navigate(from, { replace: true });
            return;
        }

        navigate('/', { replace: true });
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:p-10">
            <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Đăng nhập</h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Chào mừng bạn quay lại hệ thống.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <AuthInput
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="Nhập email"
                    icon={<Mail size={18} />}
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                />

                <PasswordInput
                    name="password"
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                />

                <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" className="h-4 w-4 accent-blue-950" />
                        Ghi nhớ
                    </label>

                    <Link to="/forgot-password" className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        Quên mật khẩu?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-950 py-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                <Divider />

                <GoogleButton />

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Chưa có tài khoản?
                    <Link
                        to="/register"
                        state={{ from }}
                        className="ml-2 font-bold text-blue-700 dark:text-blue-300"
                    >
                        Đăng ký
                    </Link>
                </p>
            </form>
        </section>
    );
}

function Divider() {
    return (
        <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-sm text-slate-500">hoặc</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
    );
}

function normalizeErrors(err) {
    const result = {};

    Object.entries(err.errors || {}).forEach(([key, value]) => {
        result[key] = Array.isArray(value) ? value[0] : value;
    });

    return result;
}
