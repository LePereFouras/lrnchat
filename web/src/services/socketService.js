import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io('http://localhost:3000', {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from WebSocket server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    // Join a conversation room
    joinConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('conversation:join', conversationId);
        }
    }

    // Leave a conversation room
    leaveConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('conversation:leave', conversationId);
        }
    }

    // Send a message
    sendMessage(data) {
        if (this.socket) {
            this.socket.emit('message:send', data);
        }
    }

    // Typing indicators
    startTyping(conversationId) {
        if (this.socket) {
            this.socket.emit('typing:start', { conversationId });
        }
    }

    stopTyping(conversationId) {
        if (this.socket) {
            this.socket.emit('typing:stop', { conversationId });
        }
    }

    // Mark message as read
    markAsRead(messageId, conversationId) {
        if (this.socket) {
            this.socket.emit('message:read', { messageId, conversationId });
        }
    }

    // Event listeners
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);

            // Store listener for cleanup
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);

            // Remove from stored listeners
            if (this.listeners.has(event)) {
                const callbacks = this.listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }

    removeAllListeners(event) {
        if (this.socket) {
            this.socket.removeAllListeners(event);
            this.listeners.delete(event);
        }
    }
}

// Export singleton instance
export default new SocketService();
