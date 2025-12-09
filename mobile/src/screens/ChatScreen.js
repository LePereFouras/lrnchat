import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import socketService from '../services/socketService';
import cryptoService from '../services/cryptoService';
import secureStorage from '../services/secureStorage';

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { conversationId } = route.params;
    const { user } = useAuth();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState(null);

    const flatListRef = useRef(null);

    useEffect(() => {
        loadConversation();
        loadMessages();
        initializeEncryptionKey();

        socketService.joinConversation(conversationId);
        socketService.on('message:new', handleNewMessage);

        return () => {
            socketService.leaveConversation(conversationId);
            socketService.removeAllListeners('message:new');
        };
    }, [conversationId]);

    const loadConversation = async () => {
        try {
            const response = await axios.get('/api/conversations');
            const conv = response.data.find(c => c.id === conversationId);
            setConversation(conv);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const loadMessages = async () => {
        try {
            const response = await axios.get(`/api/conversations/${conversationId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeEncryptionKey = async () => {
        const storedKey = await secureStorage.getItem(`conv_key_${conversationId}`);

        if (storedKey) {
            const key = await cryptoService.importKey(storedKey);
            setEncryptionKey(key);
        } else {
            const key = await cryptoService.generateKey();
            const exportedKey = await cryptoService.exportKey(key);
            await secureStorage.setItem(`conv_key_${conversationId}`, exportedKey);
            setEncryptionKey(key);
        }
    };

    const handleNewMessage = (message) => {
        if (message.conversationId === conversationId) {
            setMessages(prev => [...prev, message]);
        }
    };

    const sendMessage = async () => {
        const text = messageInput.trim();
        if (!text || !encryptionKey || sending) return;

        setSending(true);

        try {
            const { encryptedContent, iv } = await cryptoService.encrypt(text, encryptionKey);

            socketService.sendMessage({
                conversationId,
                encryptedContent,
                iv,
                tempId: Date.now()
            });

            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const getConversationName = () => {
        if (!conversation) return 'Chargement...';
        if (conversation.name) return conversation.name;

        const otherMember = conversation.members.find(m => m.userId !== user.id);
        return otherMember?.user.username || 'Conversation';
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }) => {
        const isSent = item.senderId === user.id;

        return (
            <MessageBubble
                message={item}
                isSent={isSent}
                encryptionKey={encryptionKey}
                formatTime={formatTime}
            />
        );
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getConversationName()}</Text>
                <Text style={styles.encryptionIndicator}>🔒</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Tapez un message..."
                    placeholderTextColor="#8b5cf6"
                    value={messageInput}
                    onChangeText={setMessageInput}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!messageInput.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!messageInput.trim() || sending}
                >
                    <Text style={styles.sendButtonText}>📤</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

function MessageBubble({ message, isSent, encryptionKey, formatTime }) {
    const [decryptedText, setDecryptedText] = useState('[Déchiffrement...]');

    useEffect(() => {
        let mounted = true;

        if (encryptionKey) {
            cryptoService.decrypt(message.encryptedContent, message.iv, encryptionKey)
                .then(text => {
                    if (mounted) {
                        setDecryptedText(text);
                    }
                });
        }

        return () => { mounted = false; };
    }, [message, encryptionKey]);

    return (
        <View style={[styles.messageContainer, isSent && styles.messageContainerSent]}>
            <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>
                    {message.sender.username.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.messageContent}>
                <View style={[styles.messageBubble, isSent && styles.messageBubbleSent]}>
                    <Text style={styles.messageText}>{decryptedText}</Text>
                </View>
                <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0118',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0118',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'rgba(26, 11, 46, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(138, 92, 246, 0.3)',
    },
    backButton: {
        marginRight: 12,
    },
    backButtonText: {
        fontSize: 24,
        color: '#fff',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    encryptionIndicator: {
        fontSize: 16,
    },
    messagesList: {
        padding: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    messageContainerSent: {
        flexDirection: 'row-reverse',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(138, 92, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageAvatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    messageContent: {
        maxWidth: '70%',
        marginLeft: 8,
    },
    messageBubble: {
        backgroundColor: 'rgba(26, 11, 46, 0.8)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(138, 92, 246, 0.3)',
    },
    messageBubbleSent: {
        backgroundColor: 'rgba(138, 92, 246, 0.3)',
        borderColor: 'rgba(168, 85, 247, 0.5)',
    },
    messageText: {
        color: '#fff',
        fontSize: 15,
    },
    messageTime: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'rgba(26, 11, 46, 0.8)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(138, 92, 246, 0.3)',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(138, 92, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(138, 92, 246, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#fff',
        maxHeight: 100,
        marginRight: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#a855f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },
    sendButtonText: {
        fontSize: 20,
    },
});
