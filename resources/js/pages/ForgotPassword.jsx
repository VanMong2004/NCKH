import AuthLayout from '../components/auth/AuthLayout';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

export default function ForgotPassword() {
    return (
        <AuthLayout
            title="Khôi phục mật khẩu"
            description="Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu và tiếp tục sử dụng hệ thống."
            question="Đã nhớ mật khẩu?"
            linkText="Đăng nhập"
            linkHref="/login"
            showInfoCard
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
}
