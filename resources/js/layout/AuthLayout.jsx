import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthHeader from '../components/auth/AuthHeader';
function AuthLayout() {
    return (
        <div>
            <AuthHeader />
            <div className="min-h-screen bg-gray-50">
                <Outlet />
            </div>
        </div>
    );
}

export default AuthLayout;
