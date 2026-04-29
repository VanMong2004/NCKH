import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Khởi động app: đọc user đã lưu
    // useEffect(() => {
    //     const savedUser = localStorage.getItem('user');
    //     const token = localStorage.getItem('token');

    //     if (savedUser && token) {
    //         setUser(JSON.parse(savedUser));
    //     }

    //     setIsLoading(false);
    // }, []);
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const data = await authService.me();

                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            } catch (error) {
                // token hết hạn
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await authService.login({ email, password });

        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        return data;
    };

    const register = async (payload) => {
        const data = await authService.register(payload);

        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        return data;
    };

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
