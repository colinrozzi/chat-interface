// Central state management for the chat interface
import { conversationStore } from './conversations.js';
import { messageStore } from './messages.js';
import { settingsStore } from './settings.js';
import { uiStore } from './ui.js';

// Initialize the application state
export function initStore() {
    // Initialize all stores
    conversationStore.init();
    messageStore.init();
    settingsStore.init();
    uiStore.init();
    
    // Connect the stores for cross-communication
    setupStoreConnections();
    
    return {
        conversations: conversationStore,
        messages: messageStore,
        settings: settingsStore,
        ui: uiStore
    };
}

// Set up connections between stores
function setupStoreConnections() {
    // When active conversation changes, load messages for that conversation
    conversationStore.onActiveConversationChange((conversationId) => {
        if (conversationId) {
            messageStore.clearMessages();
            // The actual loading of messages happens via WebSocket responses
        }
        
        // Update UI state
        uiStore.setActiveConversation(conversationId);
    });
    
    // When a message is received, update the conversation preview
    messageStore.onMessageAdd((message, conversationId) => {
        if (message.role === 'assistant') {
            conversationStore.updateConversationPreview(conversationId);
        }
    });
}

// Global application state
let store = null;

// Initialize the store singleton
export function init() {
    if (store === null) {
        store = initStore();
    }
    return store;
}

// Get the store singleton
export function getStore() {
    if (store === null) {
        store = initStore();
    }
    return store;
}

// Reset the entire application state
export function resetStore() {
    conversationStore.reset();
    messageStore.reset();
    settingsStore.reset();
    uiStore.reset();
}

export default {
    init,
    getStore,
    resetStore
};
