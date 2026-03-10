import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    // Load user từ localStorage khi reload trang
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (email, password) => {
        // Demo: không check password
        const fakeUser = {
            name: 'Lê Văn Mộng',
            email,
            avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=0D8ABC&color=fff',
        };

        localStorage.setItem('user', JSON.stringify(fakeUser));
        setUser(fakeUser);
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
