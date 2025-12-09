import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import socketService from '../services/socketService';
import cryptoService from '../services/cryptoService';

export default function ChatPage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [encryptionKey, setEncryptionKey] = useState(null);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Load conversation and messages
    useEffect(() => {
        loadConversation();
        loadMessages();

        // Join conversation room
        socketService.joinConversation(conversationId);

        // Listen for new messages
        socketService.on('message:new', handleNewMessage);
        socketService.on('typing:user', handleTyping);

        return () => {
            socketService.leaveConversation(conversationId);
            socketService.removeAllListeners('message:new');
            socketService.removeAllListeners('typing:user');
        };
    }, [conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversation = async () => {
        try {
            const response = await axios.get('/api/conversations');
            const conv = response.data.find(c => c.id === conversationId);
            setConversation(conv);

            // Generate or load encryption key for this conversation
            await initializeEncryptionKey();
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
        // Check if we have a key in localStorage for this conversation
        const storedKey = localStorage.getItem(`conv_key_${conversationId}`);

        if (storedKey) {
            const key = await cryptoService.importKey(storedKey);
            setEncryptionKey(key);
        } else {
            // Generate new key and store it
            const key = await cryptoService.generateKey();
            const exportedKey = await cryptoService.exportKey(key);
            localStorage.setItem(`conv_key_${conversationId}`, exportedKey);
            setEncryptionKey(key);
        }
    };

    const handleNewMessage = (message) => {
        if (message.conversationId === conversationId) {
            setMessages(prev => [...prev, message]);
        }
    };

    const handleTyping = ({ userId, conversationId: typingConvId, isTyping }) => {
        if (typingConvId === conversationId && userId !== user.id) {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (isTyping) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);

        // Send typing indicator
        socketService.startTyping(conversationId);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socketService.stopTyping(conversationId);
        }, 2000);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        const text = messageInput.trim();
        if (!text || !encryptionKey || sending) return;

        setSending(true);
        socketService.stopTyping(conversationId);

        try {
            // Encrypt message
            const { encryptedContent, iv } = await cryptoService.encrypt(text, encryptionKey);

            // Send via socket
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

    const decryptMessage = async (message) => {
        if (!encryptionKey) return '[Chargement...]';

        try {
            return await cryptoService.decrypt(
                message.encryptedContent,
                message.iv,
                encryptionKey
            );
        } catch (error) {
            return '[Erreur de déchiffrement]';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    return (
        <div className="chat-screen active">
            <div className="chat-view active">
                <div className="chat-header">
                    <button className="back-button" onClick={() => navigate('/conversations')}>
                        ←
                    </button>
                    <h2 className="current-chat-name">{getConversationName()}</h2>
                    <div className="header-actions">
                        <span className="encryption-indicator">🔒</span>
                    </div>
                </div>

                <div className="messages-container">
                    {messages.map((message) => {
                        const isSent = message.senderId === user.id;

                        return (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isSent={isSent}
                                decryptMessage={decryptMessage}
                                formatTime={formatTime}
                            />
                        );
                    })}

                    {typingUsers.size > 0 && (
                        <div className="typing-indicator">
                            <div className="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <form className="message-input-container" onSubmit={sendMessage}>
                    <input
                        type="text"
                        className="message-input"
                        placeholder="Tapez un message..."
                        value={messageInput}
                        onChange={handleInputChange}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className="send-button"
                        disabled={!messageInput.trim() || sending}
                    >
                        📤
                    </button>
                </form>
            </div>
        </div>
    );
}

// Message bubble component with async decryption
function MessageBubble({ message, isSent, decryptMessage, formatTime }) {
    const [decryptedText, setDecryptedText] = useState('[Déchiffrement...]');

    useEffect(() => {
        let mounted = true;

        decryptMessage(message).then(text => {
            if (mounted) {
                setDecryptedText(text);
            }
        });

        return () => { mounted = false; };
    }, [message]);

    return (
        <div className={`message ${isSent ? 'sent' : 'received'}`}>
            <div className="message-avatar">
                {message.sender.username.charAt(0).toUpperCase()}
            </div>
            <div className="message-content">
                <div className="message-bubble">{decryptedText}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
        </div>
    );
}
