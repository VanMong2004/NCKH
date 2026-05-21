import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
    return (
        <AuthLayout
            title="Chào mừng quay lại"
            description="Đăng nhập để mua hàng, quản lý giỏ hàng và theo dõi đơn hàng."
            question="Chưa có tài khoản?"
            linkText="Đăng ký"
            linkHref="/register"
            showInfoCard
        >
            <LoginForm />
        </AuthLayout>
    );
}
