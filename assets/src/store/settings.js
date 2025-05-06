// Settings state management

// Default settings
const DEFAULT_SETTINGS = {
    model_config: {
        model: 'claude-3-7-sonnet-20250219',
        provider: 'anthropic'
    },
    temperature: 0.7,
    max_tokens: 4096,
    system_prompt: '',
    title: 'New Conversation',
    additional_params: {},
    mcp_servers: []
};

// Settings store state
const state = {
    // Map of conversation ID to settings
    settingsByConversationId: {},
    // Callbacks
    callbacks: {
        onSettingsUpdate: []
    }
};

/**
 * Initialize the settings store
 */
function init() {
    state.settingsByConversationId = {};
}

/**
 * Reset the settings store to initial state
 */
function reset() {
    state.settingsByConversationId = {};
}

/**
 * Get settings for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Object} The settings object
 */
function getSettings(conversationId) {
    return state.settingsByConversationId[conversationId] || { ...DEFAULT_SETTINGS };
}

/**
 * Set settings for a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object} settings - The settings object
 */
function setSettings(conversationId, settings) {
    // Merge with default settings to ensure all required fields are present
    state.settingsByConversationId[conversationId] = {
        ...DEFAULT_SETTINGS,
        ...settings
    };
    
    triggerCallbacks('onSettingsUpdate', conversationId, state.settingsByConversationId[conversationId]);
}

/**
 * Update specific settings for a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object} settingsUpdates - The settings updates object
 */
function updateSettings(conversationId, settingsUpdates) {
    const currentSettings = getSettings(conversationId);
    
    // Merge updates with current settings
    const updatedSettings = {
        ...currentSettings,
        ...settingsUpdates
    };
    
    // Handle nested objects
    if (settingsUpdates.model_config) {
        updatedSettings.model_config = {
            ...currentSettings.model_config,
            ...settingsUpdates.model_config
        };
    }
    
    if (settingsUpdates.additional_params) {
        updatedSettings.additional_params = {
            ...currentSettings.additional_params,
            ...settingsUpdates.additional_params
        };
    }
    
    setSettings(conversationId, updatedSettings);
}

/**
 * Get the default settings
 * @returns {Object} The default settings object
 */
function getDefaultSettings() {
    return { ...DEFAULT_SETTINGS };
}

/**
 * Register a callback for when settings are updated
 * @param {Function} callback - The callback function(conversationId, settings)
 */
function onSettingsUpdate(callback) {
    state.callbacks.onSettingsUpdate.push(callback);
}

/**
 * Trigger registered callbacks
 * @param {string} type - The callback type
 * @param {string} conversationId - The conversation ID
 * @param {Object} settings - The settings object
 */
function triggerCallbacks(type, conversationId, settings) {
    if (state.callbacks[type]) {
        state.callbacks[type].forEach(callback => callback(conversationId, settings));
    }
}

// Export the settings store
export const settingsStore = {
    init,
    reset,
    getSettings,
    setSettings,
    updateSettings,
    getDefaultSettings,
    onSettingsUpdate
};
