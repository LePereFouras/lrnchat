import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function ConversationsScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

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

    const createConversation = async (userId) => {
        try {
            const response = await axios.post('/api/conversations', {
                type: 'DIRECT',
                memberIds: [userId]
            });

            setShowModal(false);
            navigation.navigate('Chat', { conversationId: response.data.id });
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const getConversationName = (conversation) => {
        if (conversation.name) return conversation.name;
        const otherMember = conversation.members.find(m => m.userId !== user.id);
        return otherMember?.user.username || 'Conversation';
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 172800000) return 'Hier';
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const renderConversation = ({ item }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {getConversationName(item).charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.conversationDetails}>
                <View style={styles.conversationTop}>
                    <Text style={styles.conversationName}>{getConversationName(item)}</Text>
                    <Text style={styles.conversationTime}>
                        {item.messages[0]
                            ? formatTime(item.messages[0].timestamp)
                            : formatTime(item.createdAt)}
                    </Text>
                </View>
                <Text style={styles.conversationPreview}>
                    {item.messages[0] ? '🔒 Message chiffré' : 'Aucun message'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Conversations</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setShowModal(true)} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>➕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>🚪</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>💬</Text>
                    <Text style={styles.emptyTitle}>Aucune conversation</Text>
                    <Text style={styles.emptyDescription}>
                        Créez une nouvelle conversation pour commencer à discuter
                    </Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => setShowModal(true)}
                    >
                        <Text style={styles.createButtonText}>Nouvelle conversation</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouvelle conversation</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un utilisateur..."
                            placeholderTextColor="#8b5cf6"
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoFocus
                        />

                        {searching && <ActivityIndicator color="#a855f7" style={styles.searchLoading} />}

                        {searchResults.length > 0 && (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.searchResultItem}
                                        onPress={() => createConversation(item.id)}
                                    >
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {item.username.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={styles.searchResultName}>{item.username}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                            <Text style={styles.noResults}>Aucun utilisateur trouvé</Text>
                        )}
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'rgba(26, 11, 46, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(138, 92, 246, 0.3)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 8,
    },
    iconButtonText: {
        fontSize: 20,
    },
    list: {
        padding: 8,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'rgba(26, 11, 46, 0.6)',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(138, 92, 246, 0.2)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(138, 92, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    conversationDetails: {
        flex: 1,
    },
    conversationTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    conversationTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    conversationPreview: {
        fontSize: 14,
        color: '#6b7280',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#a855f7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#1a0b2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalClose: {
        fontSize: 24,
        color: '#fff',
    },
    searchInput: {
        backgroundColor: 'rgba(138, 92, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(138, 92, 246, 0.3)',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#fff',
        marginBottom: 16,
    },
    searchLoading: {
        marginVertical: 16,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(26, 11, 46, 0.6)',
        borderRadius: 12,
        marginBottom: 8,
    },
    searchResultName: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 12,
    },
    noResults: {
        textAlign: 'center',
        color: '#9ca3af',
        marginTop: 16,
    },
});
