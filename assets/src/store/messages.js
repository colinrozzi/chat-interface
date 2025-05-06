// Messages state management

// Messages store state
const state = {
    // Map of conversation ID to array of messages
    messagesByConversationId: {},
    // Callbacks
    callbacks: {
        onMessageAdd: [],
        onMessagesUpdate: [],
        onMessagesCleared: []
    }
};

/**
 * Initialize the messages store
 */
function init() {
    state.messagesByConversationId = {};
}

/**
 * Reset the messages store to initial state
 */
function reset() {
    state.messagesByConversationId = {};
    triggerCallbacks('onMessagesCleared');
}

/**
 * Add a message to a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object} message - The message object
 */
function addMessage(conversationId, message) {
    if (!state.messagesByConversationId[conversationId]) {
        state.messagesByConversationId[conversationId] = [];
    }
    
    state.messagesByConversationId[conversationId].push(message);
    triggerCallbacks('onMessageAdd', message, conversationId);
    triggerCallbacks('onMessagesUpdate', state.messagesByConversationId[conversationId], conversationId);
}

/**
 * Add multiple messages to a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object[]} messages - The message objects
 */
function addMessages(conversationId, messages) {
    if (!state.messagesByConversationId[conversationId]) {
        state.messagesByConversationId[conversationId] = [];
    }
    
    state.messagesByConversationId[conversationId] = [
        ...state.messagesByConversationId[conversationId],
        ...messages
    ];
    
    messages.forEach(message => {
        triggerCallbacks('onMessageAdd', message, conversationId);
    });
    
    triggerCallbacks('onMessagesUpdate', state.messagesByConversationId[conversationId], conversationId);
}

/**
 * Set all messages for a conversation (replacing any existing)
 * @param {string} conversationId - The conversation ID
 * @param {Object[]} messages - The message objects
 */
function setMessages(conversationId, messages) {
    state.messagesByConversationId[conversationId] = [...messages];
    triggerCallbacks('onMessagesUpdate', state.messagesByConversationId[conversationId], conversationId);
}

/**
 * Get all messages for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Object[]} Array of message objects
 */
function getMessages(conversationId) {
    return state.messagesByConversationId[conversationId] || [];
}

/**
 * Clear all messages for the current conversation
 */
function clearMessages() {
    // We don't remove the messages from the store, just notify that they should be cleared from the UI
    triggerCallbacks('onMessagesCleared');
}

/**
 * Register a callback for when a message is added
 * @param {Function} callback - The callback function(message, conversationId)
 */
function onMessageAdd(callback) {
    state.callbacks.onMessageAdd.push(callback);
}

/**
 * Register a callback for when messages are updated
 * @param {Function} callback - The callback function(messages, conversationId)
 */
function onMessagesUpdate(callback) {
    state.callbacks.onMessagesUpdate.push(callback);
}

/**
 * Register a callback for when messages are cleared
 * @param {Function} callback - The callback function()
 */
function onMessagesCleared(callback) {
    state.callbacks.onMessagesCleared.push(callback);
}

/**
 * Trigger registered callbacks
 * @param {string} type - The callback type
 * @param {*} data - The primary data to pass to callbacks
 * @param {*} [extraData] - Optional additional data
 */
function triggerCallbacks(type, data, extraData) {
    if (state.callbacks[type]) {
        state.callbacks[type].forEach(callback => callback(data, extraData));
    }
}

// Export the messages store
export const messageStore = {
    init,
    reset,
    addMessage,
    addMessages,
    setMessages,
    getMessages,
    clearMessages,
    onMessageAdd,
    onMessagesUpdate,
    onMessagesCleared
};
