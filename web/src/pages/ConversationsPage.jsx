import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function ConversationsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Load conversations
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const response = await axios.get('/api/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Search users
    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await axios.get(`/api/users/search?q=${query}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };

    // Create new conversation
    const createConversation = async (userId) => {
        try {
            const response = await axios.post('/api/conversations', {
                type: 'DIRECT',
                memberIds: [userId]
            });

            // Navigate to the new conversation
            navigate(`/chat/${response.data.id}`);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 172800000) {
            return 'Hier';
        }
        if (diff < 604800000) {
            const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            return days[date.getDay()];
        }
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const getConversationName = (conversation) => {
        if (conversation.name) return conversation.name;

        // For direct chats, show the other user's name
        const otherMember = conversation.members.find(m => m.userId !== user.id);
        return otherMember?.user.username || 'Conversation';
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    return (
        <div className="chat-screen active">
            <div className="conversations-view active">
                <div className="chat-header">
                    <h2 className="current-chat-name">Conversations</h2>
                    <div className="header-actions">
                        <button className="icon-button" onClick={() => setShowNewChatModal(true)}>
                            ➕
                        </button>
                        <button className="icon-button logout-button" onClick={logout}>
                            🚪
                        </button>
                    </div>
                </div>

                <div className="conversations-container">
                    {conversations.length === 0 ? (
                        <div className="empty-state active">
                            <div className="empty-icon">💬</div>
                            <h3 className="empty-title">Aucune conversation</h3>
                            <p className="empty-description">
                                Créez une nouvelle conversation pour commencer à discuter
                            </p>
                            <button className="create-chat-button" onClick={() => setShowNewChatModal(true)}>
                                Nouvelle conversation
                            </button>
                        </div>
                    ) : (
                        <div className="conversations-list">
                            {conversations.map(conversation => (
                                <div
                                    key={conversation.id}
                                    className="conversation-item"
                                    onClick={() => navigate(`/chat/${conversation.id}`)}
                                >
                                    <div className="conversation-avatar">
                                        {getConversationName(conversation).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="conversation-details">
                                        <div className="conversation-top">
                                            <div className="conversation-name">
                                                {getConversationName(conversation)}
                                            </div>
                                            <div className="conversation-time">
                                                {conversation.messages[0]
                                                    ? formatTime(conversation.messages[0].timestamp)
                                                    : formatTime(conversation.createdAt)}
                                            </div>
                                        </div>
                                        <div className="conversation-preview">
                                            {conversation.messages[0]
                                                ? '🔒 Message chiffré'
                                                : 'Aucun message'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="modal-overlay active" onClick={() => setShowNewChatModal(false)}>
                    <div className="modal new-chat-modal active" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Nouvelle conversation</h3>
                            <button className="modal-close" onClick={() => setShowNewChatModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Rechercher un utilisateur..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />

                            {searching && <div className="search-loading">Recherche...</div>}

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="search-result-item"
                                            onClick={() => {
                                                createConversation(user.id);
                                                setShowNewChatModal(false);
                                            }}
                                        >
                                            <div className="conversation-avatar">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="user-info">
                                                <div className="username">{user.username}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                                <div className="no-results">Aucun utilisateur trouvé</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
