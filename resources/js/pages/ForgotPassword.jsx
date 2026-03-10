import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Check } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Vui lòng nhập địa chỉ email của bạn');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Email không hợp lệ. Vui lòng kiểm tra lại');
            return;
        }

        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsSubmitted(true);
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    // ===== GIAO DIỆN SAU KHI GỬI EMAIL =====
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="card p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-8 h-8 text-success" />
                        </div>

                        <h2 className="text-2xl font-bold text-title mb-2">Vui lòng kiểm tra Email</h2>

                        <p className="text-body mb-6">
                            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                            <span className="font-semibold">{email}</span>
                        </p>

                        <p className="text-sm text-muted mb-8">
                            Liên kết sẽ hết hạn sau 24 giờ. Nếu bạn không thấy email trong hộp thư đến, hãy kiểm tra mục
                            Thư rác (Spam).
                        </p>

                        <Link to="/auth/dangnhap" className="btn-link inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ===== FORM NHẬP EMAIL =====
    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <h1 className="text-3xl font-bold text-title text-center mb-3">Quên mật khẩu?</h1>

                    <p className="text-center text-body mb-6">
                        Đừng lo lắng. Vui lòng nhập địa chỉ email liên kết với tài khoản CTUT của bạn để khôi phục.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="label">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Địa chỉ Email
                                </div>
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mssv@student.ctuet.edu.vn"
                                className="input-base w-full px-4 py-3"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="border-default rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                                <p className="text-error text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`btn-primary w-full py-3 ${isLoading ? 'btn-loading' : ''}`}
                        >
                            {isLoading ? 'Đang gửi yêu cầu...' : 'Gửi'}
                        </button>

                        {/* Back */}
                        <div className="text-center">
                            <Link to="/auth/dangnhap" className="btn-link inline-flex items-center gap-2 text-sm">
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-muted">
                    <p>© 2025 Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.</p>
                </div>
            </div>
        </div>
    );
}
