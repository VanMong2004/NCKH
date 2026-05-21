import AuthLayout from '../components/auth/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';

export default function Register() {
    return (
        <AuthLayout
            title="Bắt đầu mua sắm cùng hệ thống"
            description="Tạo tài khoản để đặt hàng, theo dõi đơn hàng và nhận thông báo từ cửa hàng."
            question="Đã có tài khoản?"
            linkText="Đăng nhập"
            linkHref="/login"
            showInfoCard
        >
            <RegisterForm />
        </AuthLayout>
    );
}
