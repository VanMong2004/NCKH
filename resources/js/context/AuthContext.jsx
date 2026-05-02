import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // [SỬA] Khởi động app: nếu có token thì gọi /me để lấy user thật
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                const data = await authService.me();

                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            } catch (error) {
                console.error('initAuth error:', error);

                // [SỬA] token hỏng/hết hạn thì xóa sạch
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // [SỬA] Đăng nhập
    const login = async (email, password) => {
        const data = await authService.login({ email, password });

        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        return data;
    };

    // [SỬA] Đăng ký
    const register = async (payload) => {
        const data = await authService.register(payload);

        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        return data;
    };

    // [SỬA] Đăng xuất
    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
