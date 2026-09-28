import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, updateProfile as apiUpdateProfile } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('cs_user')); } catch { return null; }
    });

    function saveUser(u) {
        setUser(u);
        if (u) sessionStorage.setItem('cs_user', JSON.stringify(u));
        else sessionStorage.removeItem('cs_user');
    }

    async function login(voterId, password) {
        const { user: u } = await apiLogin({ voterId, password });
        saveUser(u);
        return u;
    }

    async function register(data) {
        const { user: u } = await apiRegister(data);
        saveUser(u);
        return u;
    }

    async function updateProfile(data) {
        const { user: u } = await apiUpdateProfile(user.id, data);
        saveUser(u);
        return u;
    }

    function logout() {
        saveUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
