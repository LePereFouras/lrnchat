import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function LoginPage() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');

    const handleResendVerification = async () => {
        try {
            await axios.post('/api/auth/resend-verification', { email: unverifiedEmail });
            setSuccess('Email de vérification renvoyé ! Veuillez vérifier votre boîte mail.');
            setShowResendVerification(false);
            setError('');
        } catch (err) {
            setError('Impossible de renvoyer l\'email de vérification');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setShowResendVerification(false);
        setLoading(true);

        try {
            const result = isLogin
                ? await login(formData.username, formData.password)
                : await register(formData.username, formData.email, formData.password);

            if (!result.success) {
                // Check for email verification error
                if (result.error?.includes('Email non vérifié') || result.error?.includes('non vérifié')) {
                    setShowResendVerification(true);
                    setUnverifiedEmail(formData.email || '');
                }
                setError(result.error);
            } else if (!isLogin) {
                // Registration success
                setSuccess('Compte créé ! Veuillez vérifier votre email pour activer votre compte.');
        setForm Data({ username: '', email: '', password: '' });
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

                    <div className="input-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="login-input"
                            value={formData.email}
                            onChange={handleChange}
                            required={!isLogin}
                            autoComplete="email"
                        />
                    </div>

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
                    {success && <div className="success-message" style={{ color: '#6ee7b7', marginBottom: '16px', textAlign: 'center' }}>{success}</div>}

                    {showResendVerification && (
                        <button
                            type="button"
                            className="login-button"
                            onClick={handleResendVerification}
                            style={{ marginBottom: '12px', background: '#10b981' }}
                        >
                            📧 Renvoyer l'email de vérification
                        </button>
                    )}

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
                                setSuccess('');
                                setShowResendVerification(false);
                            }}
                        >
                            {isLogin ? 'S\'inscrire' : 'Se connecter'}
                        </button>
                    </p>
                </div>

                <div className="security-badge">
                    <span className="security-icon">🔒</span>
                    <span className="security-text">Chiffrement AES-256 GCM + Vérification Email</span>
                </div>
            </div>
        </div>
    );
}
