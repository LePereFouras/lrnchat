// LRN CHAT - Main Application Logic
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.conversations = [];
        this.currentConversation = null;
        this.keys = {}; // Store encryption keys for each conversation

        this.init();
    }

    init() {
        // Load saved data
        this.loadFromStorage();

        // Initialize UI
        this.initializeElements();
        this.attachEventListeners();

        // Check if user is already logged in
        if (this.currentUser) {
            this.showChatScreen();
        }
    }

    initializeElements() {
        // Screens
        this.loginScreen = document.getElementById('loginScreen');
        this.chatScreen = document.getElementById('chatScreen');

        // Login elements
        this.usernameInput = document.getElementById('username');
        this.loginBtn = document.getElementById('loginBtn');

        // Chat elements
        this.conversationsView = document.getElementById('conversationsView');
        this.chatView = document.getElementById('chatView');
        this.conversationsList = document.getElementById('conversationsList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.currentChatName = document.getElementById('currentChatName');
        this.emptyState = document.getElementById('emptyState');

        // Buttons
        this.newChatBtn = document.getElementById('newChatBtn');
        this.backBtn = document.getElementById('backBtn');
        this.logoutBtn = document.getElementById('logoutBtn');

        // Modal
        this.newChatModal = document.getElementById('newChatModal');
        this.newChatNameInput = document.getElementById('newChatName');
        this.createChatBtn = document.getElementById('createChatBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelModalBtn = document.getElementById('cancelModalBtn');
    }

    attachEventListeners() {
        // Login
        this.loginBtn.addEventListener('click', () => this.login());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Chat navigation
        this.backBtn.addEventListener('click', () => this.showConversationsList());
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.newChatBtn.addEventListener('click', () => this.openNewChatModal());

        // Messages
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Modal
        this.closeModalBtn.addEventListener('click', () => this.closeNewChatModal());
        this.cancelModalBtn.addEventListener('click', () => this.closeNewChatModal());
        this.createChatBtn.addEventListener('click', () => this.createNewChat());
        this.newChatNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createNewChat();
        });
    }

    // Authentication
    login() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.usernameInput.focus();
            return;
        }

        this.currentUser = username;
        this.saveToStorage();
        this.showChatScreen();
    }

    logout() {
        this.currentUser = null;
        this.conversations = [];
        this.currentConversation = null;
        this.keys = {};
        localStorage.clear();
        sessionStorage.clear();
        this.usernameInput.value = '';
        this.showLoginScreen();
    }

    // Screen Management
    showLoginScreen() {
        this.loginScreen.classList.add('active');
        this.chatScreen.classList.remove('active');
        setTimeout(() => this.usernameInput.focus(), 300);
    }

    showChatScreen() {
        this.loginScreen.classList.remove('active');
        this.chatScreen.classList.add('active');
        this.showConversationsList();
    }

    showConversationsList() {
        this.conversationsView.classList.add('active');
        this.chatView.classList.remove('active');
        this.currentChatName.textContent = 'Conversations';
        this.backBtn.style.display = 'none';
        this.renderConversations();
    }

    showChatView() {
        this.conversationsView.classList.remove('active');
        this.chatView.classList.add('active');
        this.backBtn.style.display = 'flex';
        this.messageInput.focus();
    }

    // Conversations Management
    async createNewChat() {
        const name = this.newChatNameInput.value.trim();
        if (!name) {
            this.newChatNameInput.focus();
            return;
        }

        // Generate encryption key for this conversation
        const key = await CryptoManager.generateKey();
        const exportedKey = await CryptoManager.exportKey(key);

        const conversation = {
            id: Date.now().toString(),
            name: name,
            messages: [],
            createdAt: Date.now(),
            keyData: exportedKey
        };

        this.conversations.unshift(conversation);
        this.keys[conversation.id] = key;
        this.saveToStorage();
        this.closeNewChatModal();
        this.openConversation(conversation.id);
    }

    async openConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversation = conversation;

        // Load encryption key
        if (!this.keys[conversationId]) {
            this.keys[conversationId] = await CryptoManager.importKey(conversation.keyData);
        }

        this.currentChatName.textContent = conversation.name;
        this.showChatView();
        await this.renderMessages();
    }

    deleteConversation(conversationId) {
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        delete this.keys[conversationId];
        this.saveToStorage();
        this.renderConversations();
    }

    // Messages Management
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || !this.currentConversation) return;

        const key = this.keys[this.currentConversation.id];
        const encryptedText = await CryptoManager.encrypt(text, key);

        const message = {
            id: Date.now().toString(),
            text: encryptedText,
            sender: this.currentUser,
            timestamp: Date.now(),
            encrypted: true
        };

        // Find conversation and add message
        const conversation = this.conversations.find(c => c.id === this.currentConversation.id);
        if (conversation) {
            conversation.messages.push(message);
            this.saveToStorage();
        }

        this.messageInput.value = '';
        await this.renderMessages();
        this.scrollToBottom();
    }

    async renderMessages() {
        if (!this.currentConversation) return;

        const conversation = this.conversations.find(c => c.id === this.currentConversation.id);
        if (!conversation) return;

        this.messagesContainer.innerHTML = '';
        const key = this.keys[this.currentConversation.id];

        for (const message of conversation.messages) {
            const decryptedText = message.encrypted
                ? await CryptoManager.decrypt(message.text, key)
                : message.text;

            const messageEl = this.createMessageElement(message, decryptedText);
            this.messagesContainer.appendChild(messageEl);
        }
    }

    createMessageElement(message, decryptedText) {
        const isSent = message.sender === this.currentUser;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.sender.charAt(0).toUpperCase();

        const content = document.createElement('div');
        content.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = decryptedText;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);

        content.appendChild(bubble);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        return messageDiv;
    }

    renderConversations() {
        this.conversationsList.innerHTML = '';

        if (this.conversations.length === 0) {
            this.emptyState.classList.add('active');
            return;
        }

        this.emptyState.classList.remove('active');

        this.conversations.forEach(conversation => {
            const item = this.createConversationElement(conversation);
            this.conversationsList.appendChild(item);
        });
    }

    createConversationElement(conversation) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.onclick = () => this.openConversation(conversation.id);

        const avatar = document.createElement('div');
        avatar.className = 'conversation-avatar';
        avatar.textContent = conversation.name.charAt(0).toUpperCase();

        const details = document.createElement('div');
        details.className = 'conversation-details';

        const top = document.createElement('div');
        top.className = 'conversation-top';

        const name = document.createElement('div');
        name.className = 'conversation-name';
        name.textContent = conversation.name;

        const time = document.createElement('div');
        time.className = 'conversation-time';
        time.textContent = this.formatDate(conversation.createdAt);

        const preview = document.createElement('div');
        preview.className = 'conversation-preview';
        const messageCount = conversation.messages.length;
        preview.textContent = messageCount > 0
            ? `${messageCount} message${messageCount > 1 ? 's' : ''} (chiffré${messageCount > 1 ? 's' : ''})`
            : 'Aucun message';

        top.appendChild(name);
        top.appendChild(time);
        details.appendChild(top);
        details.appendChild(preview);
        item.appendChild(avatar);
        item.appendChild(details);

        return item;
    }

    // Modal Management
    openNewChatModal() {
        this.newChatModal.classList.add('active');
        this.newChatNameInput.value = '';
        setTimeout(() => this.newChatNameInput.focus(), 300);
    }

    closeNewChatModal() {
        this.newChatModal.classList.remove('active');
    }

    // Utilities
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Today
        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return this.formatTime(timestamp);
        }

        // Yesterday
        if (diff < 172800000) {
            return 'Hier';
        }

        // This week
        if (diff < 604800000) {
            const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            return days[date.getDay()];
        }

        // Older
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // Storage
    saveToStorage() {
        if (this.currentUser) {
            localStorage.setItem('lrn_user', this.currentUser);
        }

        // Save conversations (with encrypted messages)
        const conversationsData = this.conversations.map(conv => ({
            id: conv.id,
            name: conv.name,
            messages: conv.messages,
            createdAt: conv.createdAt,
            keyData: conv.keyData
        }));

        localStorage.setItem('lrn_conversations', JSON.stringify(conversationsData));
    }

    async loadFromStorage() {
        const user = localStorage.getItem('lrn_user');
        if (user) {
            this.currentUser = user;
        }

        const conversationsData = localStorage.getItem('lrn_conversations');
        if (conversationsData) {
            try {
                this.conversations = JSON.parse(conversationsData);

                // Load encryption keys
                for (const conv of this.conversations) {
                    if (conv.keyData) {
                        this.keys[conv.id] = await CryptoManager.importKey(conv.keyData);
                    }
                }
            } catch (error) {
                console.error('Error loading conversations:', error);
                this.conversations = [];
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChatApp();
});
