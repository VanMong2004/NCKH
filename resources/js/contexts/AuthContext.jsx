import { createContext, useContext, useEffect, useState } from 'react';

import authService from '../services/authService';
import guestTokenService from '../services/guestTokenService';

const AuthContext = createContext();

const TOKEN_KEY = 'ctut_token';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    useEffect(() => {
        initializeAuth();
    }, []);

    async function initializeAuth() {
        try {
            const token = localStorage.getItem(TOKEN_KEY);

            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await authService.me();

            setUser(response.data);
        } catch (error) {
            console.error('initializeAuth', error);

            localStorage.removeItem(TOKEN_KEY);

            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email, password) {
        const response = await authService.login({
            email,
            password,
            guest_token: guestTokenService.peekToken(),
        });

        const token = response.data.token;
        const user = response.data.user;

        localStorage.setItem(TOKEN_KEY, token);

        setUser(user);

        return response;
    }

    async function loginWithGoogle(credential) {
        const response = await authService.google({
            credential,
            guest_token: guestTokenService.peekToken(),
        });

        const token = response.data.token;
        const user = response.data.user;

        localStorage.setItem(TOKEN_KEY, token);

        setUser(user);

        return response;
    }

    async function register(payload) {
        const response = await authService.register({
            ...payload,
            guest_token: guestTokenService.peekToken(),
        });

        const token = response.data.token;
        const user = response.data.user;

        localStorage.setItem(TOKEN_KEY, token);

        setUser(user);

        return response;
    }

    async function logout() {
        try {
            await authService.logout();
        } catch (error) {
            console.log(error);
        }

        localStorage.removeItem(TOKEN_KEY);

        setUser(null);
        guestTokenService.resetToken();
    }

    async function refreshUser() {
        try {
            const response = await authService.me();

            setUser(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,

                login,
                loginWithGoogle,
                register,
                logout,
                refreshUser,

                isLoading,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
