import { useEffect, useState } from 'react';

import AuthLayout from '../components/auth/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';
import homeService from '../services/homeService';


export default function Register() {
    const [siteContent, setSiteContent] = useState(null);

    useEffect(() => {
        loadSiteContent();
    }, []);

    async function loadSiteContent() {
        try {
            const data = await homeService.getSiteContent();

            setSiteContent(data || null);
        } catch (error) {
            console.error('LOAD SITE CONTENT ERROR:', error);
            setSiteContent(null);
        }
    }

    return (
        <AuthLayout
            siteContent={siteContent}
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
