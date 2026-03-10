import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            toast.info('Vui lòng đăng nhập trước');
        }
    }, [user]);

    if (!user) {
        return <Navigate to="/auth/dangnhap" replace />;
    }

    return children;
}
