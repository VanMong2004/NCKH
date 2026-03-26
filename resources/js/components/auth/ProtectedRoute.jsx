import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
    const location = useLocation();
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-muted">
                Đang kiểm tra đăng nhập...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth/dangnhap" replace state={{from: location.pathname}}/>;
    }

    return children;
}
