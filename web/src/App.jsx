import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import socketService from './services/socketService';
import LoginPage from './pages/LoginPage';
import ConversationsPage from './pages/ConversationsPage';
import ChatPage from './pages/ChatPage';

// Protected route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

// Socket connection manager
function SocketManager({ children }) {
    const { token, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && token) {
            socketService.connect(token);
        }

        return () => {
            if (isAuthenticated) {
                socketService.disconnect();
            }
        };
    }, [isAuthenticated, token]);

    return children;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <SocketManager>
            <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/conversations" /> : <LoginPage />}
                />
                <Route
                    path="/conversations"
                    element={
                        <ProtectedRoute>
                            <ConversationsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat/:conversationId"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/"
                    element={<Navigate to={isAuthenticated ? "/conversations" : "/login"} />}
                />
            </Routes>
        </SocketManager>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
