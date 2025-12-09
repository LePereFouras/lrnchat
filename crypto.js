// Crypto Module - Web Crypto API for AES-GCM Encryption
const CryptoManager = {
    // Generate a new encryption key for a conversation
    async generateKey() {
        try {
            const key = await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
            return key;
        } catch (error) {
            console.error('Error generating key:', error);
            throw error;
        }
    },

    // Export key to store it
    async exportKey(key) {
        try {
            const exported = await window.crypto.subtle.exportKey('raw', key);
            return this.arrayBufferToBase64(exported);
        } catch (error) {
            console.error('Error exporting key:', error);
            throw error;
        }
    },

    // Import key from storage
    async importKey(keyData) {
        try {
            const keyBuffer = this.base64ToArrayBuffer(keyData);
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
            return key;
        } catch (error) {
            console.error('Error importing key:', error);
            throw error;
        }
    },

    // Encrypt a message
    async encrypt(message, key) {
        try {
            // Generate random IV (Initialization Vector)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            // Encode message
            const encoder = new TextEncoder();
            const data = encoder.encode(message);

            // Encrypt
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);

            return this.arrayBufferToBase64(combined.buffer);
        } catch (error) {
            console.error('Error encrypting:', error);
            throw error;
        }
    },

    // Decrypt a message
    async decrypt(encryptedData, key) {
        try {
            // Convert from base64
            const combined = this.base64ToArrayBuffer(encryptedData);
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            // Decrypt
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );

            // Decode
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Error decrypting:', error);
            return '[Message décrypté impossible]';
        }
    },

    // Helper: ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    // Helper: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
};

// Export for use in app.js
window.CryptoManager = CryptoManager;
