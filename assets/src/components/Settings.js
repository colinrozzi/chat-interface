// Settings panel component
import { settingsStore } from '../store/settings.js';
import { conversationStore } from '../store/conversations.js';
import { uiStore } from '../store/ui.js';
import { sendAction } from '../services/websocket.js';
import { createUpdateSettingsRequest } from '../services/messageProtocol.js';

/**
 * Initialize the settings panel component
 * @param {HTMLElement} panelElement - The panel element
 * @param {HTMLElement} closeButtonElement - The close button element
 * @param {HTMLFormElement} formElement - The settings form element
 */
export function initSettings(panelElement, closeButtonElement, formElement) {
    // Store references
    const settingsPanel = panelElement;
    const closeSettingsBtn = closeButtonElement;
    const settingsForm = formElement;
    
    // UI element references
    const temperatureInput = document.getElementById('temperature-input');
    const temperatureValue = document.getElementById('temperature-value');
    const modelSelect = document.getElementById('model-select');
    const maxTokensInput = document.getElementById('max-tokens-input');
    const systemPromptInput = document.getElementById('system-prompt-input');
    const titleInput = document.getElementById('title-input');
    
    // Set up event listeners
    closeSettingsBtn.addEventListener('click', () => {
        uiStore.toggleSettingsPanel(false);
    });
    
    settingsForm.addEventListener('submit', saveSettings);
    
    if (temperatureInput && temperatureValue) {
        temperatureInput.addEventListener('input', updateTemperatureValue);
    }
    
    // Register for store updates
    settingsStore.onSettingsUpdate(updateSettingsForm);
    uiStore.onSettingsPanelToggle(handleSettingsPanelToggle);
    
    /**
     * Handle settings panel visibility toggle
     * @param {boolean} isOpen - Whether the panel is open
     */
    function handleSettingsPanelToggle(isOpen) {
        if (isOpen) {
            settingsPanel.classList.remove('collapsed');
            
            // Load settings for active conversation
            const conversationId = conversationStore.getActiveConversation();
            if (conversationId) {
                sendAction('get_settings', { conversation_id: conversationId });
            }
        } else {
            settingsPanel.classList.add('collapsed');
        }
    }
    
    /**
     * Update temperature display
     */
    function updateTemperatureValue() {
        if (temperatureInput && temperatureValue) {
            temperatureValue.textContent = temperatureInput.value;
        }
    }
    
    /**
     * Update settings form with values from store
     * @param {string} conversationId - The conversation ID
     * @param {Object} settings - The settings object
     */
    function updateSettingsForm(conversationId, settings) {
        if (!settings) return;
        
        // Update model select
        if (modelSelect) {
            modelSelect.value = settings.model_config.model || 'claude-3-7-sonnet-20250219';
        }
        
        // Update temperature
        if (temperatureInput && temperatureValue) {
            // Use the server setting if defined, otherwise default to 0.7
            const temp = settings.temperature !== undefined ? settings.temperature : 0.7;
            temperatureInput.value = temp;
            temperatureValue.textContent = temp;
        }
        
        // Update max tokens
        if (maxTokensInput) {
            maxTokensInput.value = settings.max_tokens || 4096;
        }
        
        // Update system prompt
        if (systemPromptInput) {
            systemPromptInput.value = settings.system_prompt || '';
        }
        
        // Update title
        if (titleInput) {
            const conversation = conversationStore.getConversation(conversationId);
            if (conversation) {
                titleInput.value = conversation.title || '';
            }
        }
    }
    
    /**
     * Save settings
     * @param {Event} event - The submit event
     */
    function saveSettings(event) {
        event.preventDefault();
        
        const conversationId = conversationStore.getActiveConversation();
        if (!conversationId) {
            showMessage('No active conversation');
            return;
        }
        
        const formData = new FormData(settingsForm);
        
        // Create a correctly formatted settings object that matches the protocol
        const settings = {
            model_config: {
                model: formData.get('model'),
                provider: 'anthropic'
            },
            temperature: parseFloat(formData.get('temperature')),
            max_tokens: parseInt(formData.get('max_tokens')),
            title: formData.get('title'),
            system_prompt: formData.get('system_prompt') || null,
            additional_params: {}, // Include empty object for additional parameters
            mcp_servers: [] // Include empty array for MCP servers
        };
        
        // Send update to server
        const request = createUpdateSettingsRequest(conversationId, settings);
        sendAction(request.action, {
            conversation_id: request.conversation_id,
            settings: request.settings
        });
        
        // Update local conversation title
        if (settings.title) {
            conversationStore.updateConversationTitle(conversationId, settings.title);
        }
        
        showMessage('Settings updated successfully');
        
        // Close settings panel
        uiStore.toggleSettingsPanel(false);
    }
    
    /**
     * Show a temporary notification message
     * @param {string} message - The notification message
     */
    function showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-notification';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
    
    /**
     * Reset settings form to blank/default values
     */
    function resetSettingsForm() {
        // Clear model select (default is first option)
        if (modelSelect) {
            modelSelect.selectedIndex = 0;
        }
        
        // Reset temperature to default
        if (temperatureInput && temperatureValue) {
            temperatureInput.value = 0.7;
            temperatureValue.textContent = 0.7;
        }
        
        // Reset max tokens
        if (maxTokensInput) {
            maxTokensInput.value = 4096;
        }
        
        // Clear system prompt
        if (systemPromptInput) {
            systemPromptInput.value = '';
        }
        
        // Clear title
        if (titleInput) {
            titleInput.value = '';
        }
    }
    
    // Initialize the settings panel
    settingsPanel.classList.add('collapsed');
    resetSettingsForm();
    
    // Return public methods
    return {
        open: () => uiStore.toggleSettingsPanel(true),
        close: () => uiStore.toggleSettingsPanel(false),
        isOpen: () => uiStore.isSettingsPanelOpen(),
        reset: resetSettingsForm
    };
}
