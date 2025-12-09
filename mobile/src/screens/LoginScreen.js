import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.logo}>🔐</Text>
                    <Text style={styles.title}>LRN CHAT</Text>
                    <Text style={styles.subtitle}>Messagerie chiffrée de bout en bout</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom d'utilisateur"
                        placeholderTextColor="#8b5cf6"
                        value={formData.username}
                        onChangeText={(text) => setFormData({ ...formData, username: text })}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {!isLogin && (
                        <TextInput
                            style={styles.input}
                            placeholder="Email (optionnel)"
                            placeholderTextColor="#8b5cf6"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Mot de passe"
                        placeholderTextColor="#8b5cf6"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isLogin ? 'Se connecter' : "S'inscrire"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        <Text style={styles.toggleText}>
                            {isLogin ? 'Pas encore de compte ? ' : 'Déjà inscrit ? '}
                            <Text style={styles.toggleLink}>
                                {isLogin ? "S'inscrire" : 'Se connecter'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.security}>
                    <Text style={styles.securityText}>🔒 Chiffrement AES-256 GCM</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0118',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: '#a855f7',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    form: {
        marginBottom: 32,
    },
    input: {
        backgroundColor: 'rgba(138, 92, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(138, 92, 246, 0.3)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        marginBottom: 16,
    },
    button: {
        backgroundColor: 'linear-gradient(135deg, #6366f1, #a855f7)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: '#ef4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    toggleText: {
        color: '#9ca3af',
        textAlign: 'center',
    },
    toggleLink: {
        color: '#a855f7',
        fontWeight: '600',
    },
    security: {
        alignItems: 'center',
    },
    securityText: {
        color: '#6ee7b7',
        fontSize: 12,
    },
});
