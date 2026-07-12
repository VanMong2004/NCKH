import { Mail, Phone, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';

import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import GoogleButton from './GoogleButton';
import { useAuth } from '../../contexts/AuthContext';
import { withMinimumDelay } from '../../utils/demoDelay';

export default function RegisterForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth();

    const from = location.state?.from;

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        user_type: 'student',
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

        if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập họ tên';
        if (!form.email.trim()) nextErrors.email = 'Vui lòng nhập email';
        if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu';

        if (form.password && form.password.length < 6) {
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

            const response = await withMinimumDelay(register(form));

            toast.success(response.message || 'Đăng ký thành công');

            redirectAfterRegister();
        } catch (err) {
            setErrors(normalizeErrors(err));
            toast.error(err.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    }

    function redirectAfterRegister() {
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
            <h1 className="text-3xl font-extrabold text-blue-950 dark:text-white">Tạo tài khoản</h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Đăng ký để mua hàng và theo dõi đơn hàng.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <AuthInput
                    name="name"
                    label="Họ và tên"
                    placeholder="Nhập họ và tên"
                    icon={<User size={18} />}
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                />

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

                <AuthInput
                    name="phone"
                    label="Số điện thoại"
                    placeholder="Nhập số điện thoại"
                    icon={<Phone size={18} />}
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                />

                <PasswordInput
                    name="password"
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                />

                <PasswordInput
                    name="password_confirmation"
                    label="Xác nhận mật khẩu"
                    placeholder="Nhập lại mật khẩu"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    error={errors.password_confirmation}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-950 py-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-60 dark:bg-blue-700"
                >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>

                <Divider />

                <GoogleButton />

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Đã có tài khoản?
                    <Link
                        to="/login"
                        state={{
                            from,
                        }}
                        className="ml-2 font-bold text-blue-700 dark:text-blue-300"
                    >
                        Đăng nhập
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
