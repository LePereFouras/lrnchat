import * as SecureStore from 'expo-secure-store';

// Secure storage wrapper for React Native
class SecureStorage {
    async setItem(key, value) {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('SecureStore setItem error:', error);
            throw error;
        }
    }

    async getItem(key) {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('SecureStore getItem error:', error);
            return null;
        }
    }

    async removeItem(key) {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('SecureStore removeItem error:', error);
        }
    }

    async clear() {
        // Note: SecureStore doesn't have a clear all method
        // You'll need to track keys and delete them individually
        const keysToDelete = ['token', 'user'];
        for (const key of keysToDelete) {
            await this.removeItem(key);
        }
    }
}

export default new SecureStorage();
