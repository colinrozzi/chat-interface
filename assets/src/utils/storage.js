// Local storage utilities

const STORAGE_PREFIX = 'chat_interface_';

/**
 * Save data to localStorage with the app prefix
 * @param {string} key - The storage key
 * @param {*} value - The value to store
 */
export function saveToStorage(key, value) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(prefixedKey, serializedValue);
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Load data from localStorage with the app prefix
 * @param {string} key - The storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The stored value or defaultValue
 */
export function loadFromStorage(key, defaultValue = null) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const serializedValue = localStorage.getItem(prefixedKey);
        
        if (serializedValue === null) {
            return defaultValue;
        }
        
        return JSON.parse(serializedValue);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove data from localStorage with the app prefix
 * @param {string} key - The storage key
 */
export function removeFromStorage(key) {
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        localStorage.removeItem(prefixedKey);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

/**
 * Clear all app-specific data from localStorage
 */
export function clearAppStorage() {
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        return true;
    } catch (error) {
        console.error('Error clearing app localStorage:', error);
        return false;
    }
}

/**
 * Check if a key exists in localStorage
 * @param {string} key - The storage key
 * @returns {boolean} True if the key exists
 */
export function hasStorageKey(key) {
    const prefixedKey = STORAGE_PREFIX + key;
    return localStorage.getItem(prefixedKey) !== null;
}

/**
 * Get all app storage keys
 * @returns {string[]} Array of app storage keys (without prefix)
 */
export function getAppStorageKeys() {
    return Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .map(key => key.substring(STORAGE_PREFIX.length));
}
