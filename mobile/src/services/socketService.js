import { io } from 'socket.io-client';

// Update with your backend URL
const SOCKET_URL = 'http://localhost:3000'; // Change to your server IP for testing on device

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
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
        }
    }

    joinConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('conversation:join', conversationId);
        }
    }

    leaveConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('conversation:leave', conversationId);
        }
    }

    sendMessage(data) {
        if (this.socket) {
            this.socket.emit('message:send', data);
        }
    }

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

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    removeAllListeners(event) {
        if (this.socket) {
            this.socket.removeAllListeners(event);
        }
    }
}

export default new SocketService();
