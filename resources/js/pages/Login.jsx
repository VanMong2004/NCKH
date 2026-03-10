import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import imgLogin from '../../images/imgLogin.png';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const from = location.state?.from || '/'
    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!formData.email.includes('@')) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setTimeout(() => {
            try {
                login(formData.email, formData.password);
                console.log('Đăng nhập thành công:', formData);
                navigate(from, {replace: true});
            } catch (error) {
                console.error('Đăng nhập thất bại:', error);
            } finally {
                setLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-page">
            {/* LEFT IMAGE */}
            <div className="hidden md:flex md:w-1/2 relative bg-gray-900">
                <img src={imgLogin} alt="imgLogin" className="w-full h-full object-cover opacity-60" />
                <div className="absolute bottom-0 left-0 p-12 z-10">
                    <div className="flex space-x-2 mb-6">
                        <span className="px-3 py-1 text-xs font-medium text-white bg-white/20 rounded-full">
                            Đồng phục
                        </span>
                        <span className="px-3 py-1 text-xs font-medium text-white bg-white/20 rounded-full">
                            Phụ kiện
                        </span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                        Trang bị hành trang thành công tại CTUT.
                    </h2>
                    <p className="text-white/80 text-lg max-w-md">
                        Địa chỉ tin cậy cung cấp trang phục, áo blouse và dụng cụ chuyên ngành được nhà trường phê
                        duyệt.
                    </p>
                </div>
            </div>

            {/* RIGHT FORM */}
            <div className="w-full md:w-1/2 flex justify-center p-4 md:p-10 lg:p-14 bg-surface overflow-y-auto">
                <div className="w-full max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-title mb-2">Đăng nhập</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="label">Email hoặc MSSV</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Nhập MSSV hoặc email của bạn"
                                    className={`input-base w-full pl-10 ${errors.email ? 'input-error' : ''}`}
                                />
                            </div>
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="label">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Nhập mật khẩu"
                                    className={`input-base w-full pl-10 pr-12 ${errors.password ? 'input-error' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-title"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="error-text">{errors.password}</p>}
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-body text-sm">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                Ghi nhớ đăng nhập
                            </label>
                            <Link to="/auth/quenmatkhau" className="btn-link text-sm">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full btn-primary py-3 ${loading ? 'btn-loading' : ''}`}
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-default" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface text-muted uppercase text-xs">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    {/* OAuth */}
                    <div className="flex justify-center w-full mb-6">
                        <button className="w-full btn-secondary flex items-center justify-center gap-2">
                            <FcGoogle size={20} />
                            Google
                        </button>
                    </div>

                    {/* Register */}
                    <p className="text-center text-sm text-body mt-6 pb-6">
                        Chưa có tài khoản?{' '}
                        <Link to="/auth/dangky" className="btn-link font-semibold">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
