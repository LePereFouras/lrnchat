import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = isLogin
                ? await login(formData.username, formData.password)
                : await register(formData.username, formData.email, formData.password);

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="login-screen active">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo">🔐</div>
                        <h1 className="app-title">LRN CHAT</h1>
                    </div>
                    <p className="app-subtitle">Messagerie chiffrée de bout en bout</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            name="username"
                            placeholder="Nom d'utilisateur"
                            className="login-input"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email (optionnel)"
                                className="login-input"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Mot de passe"
                            className="login-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? 'Pas encore de compte ?' : 'Déjà inscrit ?'}
                        <button
                            type="button"
                            className="toggle-auth-button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? 'S\'inscrire' : 'Se connecter'}
                        </button>
                    </p>
                </div>

                <div className="security-badge">
                    <span className="security-icon">🔒</span>
                    <span className="security-text">Chiffrement AES-256 GCM</span>
                </div>
            </div>
        </div>
    );
}
