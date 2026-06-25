import { useEffect, useState } from 'react';

import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import homeService from '../services/homeService';

export default function Login() {
    const [siteContent, setSiteContent] = useState(null);

    useEffect(() => {
        loadSiteContent();
    }, []);

    async function loadSiteContent() {
        try {
            const data = await homeService.getHomeData();

            console.log('HOME DATA:', data);
            console.log('SITE CONTENT:', data.site_content);

            setSiteContent(data.siteContent || data.site_content || null);
        } catch (error) {
            console.error('LOAD SITE CONTENT ERROR:', error);
            setSiteContent(null);
        }
    }

    return (
        <AuthLayout
            siteContent={siteContent}
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