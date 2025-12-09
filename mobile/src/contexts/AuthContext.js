import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import secureStorage from '../services/secureStorage';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Update this with your backend URL
const API_URL = 'http://localhost:3000'; // Change to your server IP for testing on device

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios defaults
    useEffect(() => {
        axios.defaults.baseURL = API_URL;

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedToken = await secureStorage.getItem('token');

                if (storedToken) {
                    setToken(storedToken);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

                    const response = await axios.get('/api/users/me');
                    setUser(response.data);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
                await logout();
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password
            });

            const { user, token } = response.data;
            setUser(user);
            setToken(token);

            await secureStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post('/api/auth/register', {
                username,
                email,
                password
            });

            const { user, token } = response.data;
            setUser(user);
            setToken(token);

            await secureStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        await secureStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
