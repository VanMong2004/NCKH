import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import imgRegister from '../../images/imgRegister.png';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const DEPARTMENTS = [
    'Chọn Khoa',
    'Công nghệ thông tin',
    'Quản trị Kinh doanh',
    'Quản lý công nghiệp',
    'Kiến trúc',
    'Kỹ thuật Xây dựng',
    'Kỹ thuật Cơ khí',
    'Kỹ thuật Điện',
];

export default function Register() {
    const navigate = useNavigate()
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        studentId: '',
        department: 'Chọn Khoa / Viện',
        cohortYear: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
        if (!formData.studentId.trim()) newErrors.studentId = 'Vui lòng nhập mã số sinh viên';
        if (formData.department === 'Chọn Khoa') newErrors.department = 'Vui lòng chọn Khoa';
        if (!formData.cohortYear.trim()) newErrors.cohortYear = 'Vui lòng nhập khóa / năm nhập học';

        if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!formData.email.includes('@')) newErrors.email = 'Email không hợp lệ';

        if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
        else if (formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';

        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await register({
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
            });
            toast.success('Đăng ký thành công');
            navigate('/auth/dangnhap', { replace: true });
        } catch (error) {
            console.error(error);
            toast.error('Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-page">
            {/* LEFT IMAGE */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
                <img src={imgRegister} alt="University Hallway" className="w-full h-full object-cover opacity-60" />
                <div className="absolute bottom-0 left-0 p-12 z-10">
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                        Gia nhập cộng đồng sinh viên CTUT.
                    </h2>
                    <p className="text-white/80 text-lg max-w-md">
                        Tạo tài khoản ngay hôm nay để mua sắm đồng phục và dụng cụ học tập chính hãng.
                    </p>
                </div>
            </div>

            {/* FORM */}
            <div className="w-full lg:w-1/2 flex justify-center p-4 md:p-10 lg:p-14 bg-surface overflow-y-auto">
                <div className="w-full max-w-2xl mx-auto">
                    <Link to="/" className="lg:hidden flex items-center text-muted mb-6 hover:text-title">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Trang chủ
                    </Link>

                    <div className="mb-6 text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold text-title">Đăng ký</h1>
                    </div>

                    {/* OAuth */}
                    <div className="flex gap-4 justify-center w-full mb-8">
                        <button className="w-full btn-secondary flex items-center justify-center gap-2">
                            <FcGoogle size={20} />
                            Google
                        </button>
                    </div>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-default" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-surface text-muted uppercase text-xs">
                                Hoặc đăng ký bằng email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Họ và tên</label>
                                <input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Nguyễn Văn A"
                                    className={`input-base w-full ${errors.fullName ? 'input-error' : ''}`}
                                />
                                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
                            </div>

                            <div>
                                <label className="label">Mã số sinh viên</label>
                                <input
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleInputChange}
                                    placeholder="KTPM2211xxx"
                                    className={`input-base w-full ${errors.studentId ? 'input-error' : ''}`}
                                />
                                {errors.studentId && <p className="error-text">{errors.studentId}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Khoa</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className={`input-base w-full ${errors.department ? 'input-error' : ''}`}
                                >
                                    {DEPARTMENTS.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                                {errors.department && <p className="error-text">{errors.department}</p>}
                            </div>

                            <div>
                                <label className="label">Khóa (Năm nhập học)</label>
                                <input
                                    name="cohortYear"
                                    value={formData.cohortYear}
                                    onChange={handleInputChange}
                                    placeholder="K10 (2022)"
                                    className={`input-base w-full ${errors.cohortYear ? 'input-error' : ''}`}
                                />
                                {errors.cohortYear && <p className="error-text">{errors.cohortYear}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="sv@ctut.edu.vn"
                                className={`input-base w-full ${errors.email ? 'input-error' : ''}`}
                            />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`input-base w-full pr-10 ${errors.password ? 'input-error' : ''}`}
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

                            <div>
                                <label className="label">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`input-base w-full pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-title"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                className="mt-1 w-4 h-4 accent-blue-600"
                            />
                            <label className="text-sm text-body">
                                Tôi đồng ý với{' '}
                                <Link to="/dieukhoan" className="btn-link font-semibold">
                                    Điều khoản dịch vụ
                                </Link>{' '}
                                và{' '}
                                <Link to="/chinhsachbaomat" className="btn-link font-semibold">
                                    Chính sách bảo mật
                                </Link>
                            </label>
                        </div>
                        {errors.agreeToTerms && <p className="error-text">{errors.agreeToTerms}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full btn-primary py-3 ${loading ? 'btn-loading' : ''}`}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>

                    <p className="text-center text-body text-sm mt-6 pb-6">
                        Bạn đã có tài khoản?{' '}
                        <Link to="/auth/dangnhap" className="btn-link font-semibold">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
