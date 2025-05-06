// Conversation state management
import { extractTextFromMessage } from '../services/messageProtocol.js';

// Conversation store state
const state = {
    conversations: [],
    activeConversationId: null,
    callbacks: {
        onActiveConversationChange: [],
        onConversationsUpdate: []
    }
};

/**
 * Initialize the conversation store
 */
function init() {
    // Initial state is empty
    state.conversations = [];
    state.activeConversationId = null;
}

/**
 * Reset the conversation store to initial state
 */
function reset() {
    state.conversations = [];
    state.activeConversationId = null;
    triggerCallbacks('onConversationsUpdate', state.conversations);
    triggerCallbacks('onActiveConversationChange', null);
}

/**
 * Set the active conversation
 * @param {string} conversationId - The ID of the conversation to make active
 */
function setActiveConversation(conversationId) {
    if (state.activeConversationId !== conversationId) {
        state.activeConversationId = conversationId;
        triggerCallbacks('onActiveConversationChange', conversationId);
    }
}

/**
 * Get the active conversation ID
 * @returns {string|null} The active conversation ID
 */
function getActiveConversation() {
    return state.activeConversationId;
}

/**
 * Add a new conversation
 * @param {Object} conversation - The conversation object to add
 */
function addConversation(conversation) {
    // Check if conversation already exists
    const existing = state.conversations.findIndex(c => c.id === conversation.id);
    
    if (existing >= 0) {
        // Update existing conversation
        state.conversations[existing] = conversation;
    } else {
        // Add new conversation
        state.conversations.push(conversation);
    }
    
    // Sort conversations by updated_at (most recent first)
    sortConversations();
    
    // Notify listeners
    triggerCallbacks('onConversationsUpdate', state.conversations);
}

/**
 * Add/update multiple conversations
 * @param {Object[]} conversations - The conversation objects to add/update
 */
function setConversations(conversations) {
    state.conversations = conversations;
    sortConversations();
    triggerCallbacks('onConversationsUpdate', state.conversations);
}

/**
 * Sort conversations by updated_at timestamp (newest first)
 */
function sortConversations() {
    state.conversations.sort((a, b) => 
        (b.updated_at || 0) - (a.updated_at || 0)
    );
}

/**
 * Update conversation preview with the most recent message
 * @param {string} conversationId - The conversation ID
 * @param {Object} [message] - Optional message to use for preview
 */
function updateConversationPreview(conversationId, message) {
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    if (message) {
        const messageText = extractTextFromMessage(message);
        conversation.last_message_preview = messageText.substring(0, 50) + 
            (messageText.length > 50 ? '...' : '');
    }
    
    conversation.updated_at = Date.now();
    conversation.message_count = (conversation.message_count || 0) + 1;
    
    sortConversations();
    triggerCallbacks('onConversationsUpdate', state.conversations);
}

/**
 * Update conversation title
 * @param {string} conversationId - The conversation ID
 * @param {string} title - The new title
 */
function updateConversationTitle(conversationId, title) {
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    conversation.title = title;
    triggerCallbacks('onConversationsUpdate', state.conversations);
}

/**
 * Get a conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Object|null} The conversation object
 */
function getConversation(conversationId) {
    return state.conversations.find(c => c.id === conversationId) || null;
}

/**
 * Get all conversations
 * @returns {Object[]} Array of conversation objects
 */
function getConversations() {
    return state.conversations;
}

/**
 * Register a callback for when the active conversation changes
 * @param {Function} callback - The callback function
 */
function onActiveConversationChange(callback) {
    state.callbacks.onActiveConversationChange.push(callback);
}

/**
 * Register a callback for when the conversations list updates
 * @param {Function} callback - The callback function
 */
function onConversationsUpdate(callback) {
    state.callbacks.onConversationsUpdate.push(callback);
}

/**
 * Trigger registered callbacks
 * @param {string} type - The callback type
 * @param {*} data - The data to pass to callbacks
 */
function triggerCallbacks(type, data) {
    if (state.callbacks[type]) {
        state.callbacks[type].forEach(callback => callback(data));
    }
}

// Export the conversation store
export const conversationStore = {
    init,
    reset,
    setActiveConversation,
    getActiveConversation,
    addConversation,
    setConversations,
    updateConversationPreview,
    updateConversationTitle,
    getConversation,
    getConversations,
    onActiveConversationChange,
    onConversationsUpdate
};
