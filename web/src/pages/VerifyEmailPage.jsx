import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState('');

    React.useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setError('Token de vérification manquant');
                return;
            }

            try {
                const response = await axios.get(`/api/auth/verify-email?token=${token}`);
                setStatus('success');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err) {
                setStatus('error');
                setError(err.response?.data?.error || 'La vérification a échoué');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="login-screen active">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo">🔐</div>
                        <h1 className="app-title">LRN CHAT</h1>
                    </div>
                </div>

                <div className="verification-content">
                    {status === 'verifying' && (
                        <>
                            <div className="verification-icon">⏳</div>
                            <h2>Vérification en cours...</h2>
                            <p>Veuillez patienter pendant que nous vérifions votre email.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="verification-icon">✅</div>
                            <h2>Email vérifié !</h2>
                            <p>Votre compte a été activé avec succès.</p>
                            <p>Redirection vers la page de connexion...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="verification-icon">❌</div>
                            <h2>Erreur de vérification</h2>
                            <p className="error-message">{error}</p>
                            <button
                                className="login-button"
                                onClick={() => navigate('/login')}
                            >
                                Retour à la connexion
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
