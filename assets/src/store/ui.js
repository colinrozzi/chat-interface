// UI state management

// UI store state
const state = {
    activeConversationId: null,
    isWaitingForResponse: false,
    showSidebar: window.innerWidth > 768,
    isDarkMode: false,
    settingsPanelOpen: false,
    callbacks: {
        onWaitingStateChange: [],
        onSidebarToggle: [],
        onThemeChange: [],
        onSettingsPanelToggle: []
    }
};

/**
 * Initialize the UI store
 */
function init() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        state.isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

/**
 * Reset the UI store to initial state
 */
function reset() {
    state.activeConversationId = null;
    state.isWaitingForResponse = false;
    state.settingsPanelOpen = false;
    // Don't reset theme or sidebar state
}

/**
 * Set the active conversation
 * @param {string} conversationId - The conversation ID
 */
function setActiveConversation(conversationId) {
    state.activeConversationId = conversationId;
}

/**
 * Get the active conversation ID
 * @returns {string|null} The active conversation ID
 */
function getActiveConversation() {
    return state.activeConversationId;
}

/**
 * Set the waiting for response state
 * @param {boolean} isWaiting - Whether we're waiting for a response
 */
function setWaitingForResponse(isWaiting) {
    if (state.isWaitingForResponse !== isWaiting) {
        state.isWaitingForResponse = isWaiting;
        triggerCallbacks('onWaitingStateChange', isWaiting);
    }
}

/**
 * Check if we're waiting for a response
 * @returns {boolean} True if waiting
 */
function isWaitingForResponse() {
    return state.isWaitingForResponse;
}

/**
 * Toggle the sidebar visibility
 * @param {boolean} [show] - Force show/hide
 */
function toggleSidebar(show) {
    if (show !== undefined) {
        state.showSidebar = show;
    } else {
        state.showSidebar = !state.showSidebar;
    }
    triggerCallbacks('onSidebarToggle', state.showSidebar);
}

/**
 * Check if the sidebar is visible
 * @returns {boolean} True if visible
 */
function isSidebarVisible() {
    return state.showSidebar;
}

/**
 * Toggle dark mode
 * @param {boolean} [isDark] - Force dark mode on/off
 */
function toggleDarkMode(isDark) {
    if (isDark !== undefined) {
        state.isDarkMode = isDark;
    } else {
        state.isDarkMode = !state.isDarkMode;
    }
    
    if (state.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    
    triggerCallbacks('onThemeChange', state.isDarkMode);
}

/**
 * Check if dark mode is active
 * @returns {boolean} True if dark mode
 */
function isDarkMode() {
    return state.isDarkMode;
}

/**
 * Toggle the settings panel
 * @param {boolean} [isOpen] - Force open/closed
 */
function toggleSettingsPanel(isOpen) {
    if (isOpen !== undefined) {
        state.settingsPanelOpen = isOpen;
    } else {
        state.settingsPanelOpen = !state.settingsPanelOpen;
    }
    triggerCallbacks('onSettingsPanelToggle', state.settingsPanelOpen);
}

/**
 * Check if the settings panel is open
 * @returns {boolean} True if open
 */
function isSettingsPanelOpen() {
    return state.settingsPanelOpen;
}

/**
 * Register a callback for when waiting state changes
 * @param {Function} callback - The callback function(isWaiting)
 */
function onWaitingStateChange(callback) {
    state.callbacks.onWaitingStateChange.push(callback);
}

/**
 * Register a callback for when sidebar visibility changes
 * @param {Function} callback - The callback function(isVisible)
 */
function onSidebarToggle(callback) {
    state.callbacks.onSidebarToggle.push(callback);
}

/**
 * Register a callback for when theme changes
 * @param {Function} callback - The callback function(isDarkMode)
 */
function onThemeChange(callback) {
    state.callbacks.onThemeChange.push(callback);
}

/**
 * Register a callback for when settings panel toggles
 * @param {Function} callback - The callback function(isOpen)
 */
function onSettingsPanelToggle(callback) {
    state.callbacks.onSettingsPanelToggle.push(callback);
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

// Export the UI store
export const uiStore = {
    init,
    reset,
    setActiveConversation,
    getActiveConversation,
    setWaitingForResponse,
    isWaitingForResponse,
    toggleSidebar,
    isSidebarVisible,
    toggleDarkMode,
    isDarkMode,
    toggleSettingsPanel,
    isSettingsPanelOpen,
    onWaitingStateChange,
    onSidebarToggle,
    onThemeChange,
    onSettingsPanelToggle
};
