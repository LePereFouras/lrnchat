import { getRandomValues } from 'react-native-quick-crypto';

// Mobile Crypto Service using Web Crypto API polyfill
class CryptoService {
    async generateKey() {
        try {
            const key = await global.crypto.subtle.generateKey(
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
    }

    async exportKey(key) {
        try {
            const exported = await global.crypto.subtle.exportKey('raw', key);
            return this.arrayBufferToBase64(exported);
        } catch (error) {
            console.error('Error exporting key:', error);
            throw error;
        }
    }

    async importKey(keyData) {
        try {
            const keyBuffer = this.base64ToArrayBuffer(keyData);
            const key = await global.crypto.subtle.importKey(
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
    }

    async encrypt(message, key) {
        try {
            const iv = getRandomValues(new Uint8Array(12));
            const encoder = new TextEncoder();
            const data = encoder.encode(message);

            const encrypted = await global.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );

            return {
                encryptedContent: this.arrayBufferToBase64(encrypted),
                iv: this.arrayBufferToBase64(iv.buffer)
            };
        } catch (error) {
            console.error('Error encrypting:', error);
            throw error;
        }
    }

    async decrypt(encryptedContent, ivString, key) {
        try {
            const encryptedData = this.base64ToArrayBuffer(encryptedContent);
            const iv = this.base64ToArrayBuffer(ivString);

            const decrypted = await global.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedData
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Error decrypting:', error);
            return '[Message décrypté impossible]';
        }
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}

export default new CryptoService();
