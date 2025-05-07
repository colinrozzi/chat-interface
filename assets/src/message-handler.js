/**
 * Message Handler
 * Processes WebSocket messages from the chat-interface backend
 */

export class MessageHandler {
    constructor(stateManager, uiManager) {
        this.stateManager = stateManager;
        this.uiManager = uiManager;
    }
    
    /**
     * Handle a message from the server
     * @param {Object} message - The message received from the server
     */
    handleServerMessage(message) {
        console.log('Received message:', message);
        
        switch (message.type) {
            case 'conversation_created':
                this.handleConversationCreated(message);
                break;
                
            case 'conversation_list':
                this.handleConversationList(message);
                break;
                
            case 'messages':
                this.handleMessages(message);
                break;
                
            case 'conversation':
                this.handleConversation(message);
                break;
                
            case 'settings':
                this.handleSettings(message);
                break;
                
            case 'settings_updated':
                this.handleSettingsUpdated(message);
                break;
                
            case 'error':
                this.handleError(message);
                break;
                
            case 'message_by_id':
                this.handleMessageById(message);
                break;
                
            case 'head_id':
                this.handleHeadId(message);
                break;
                
            case 'success':
                // Generic success, no specific handling needed
                break;
                
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    
    /**
     * Handle conversation_created message
     * @param {Object} message - The conversation_created message
     */
    handleConversationCreated(message) {
        const conversationId = message.conversation_id;
        
        // Set as current conversation
        this.stateManager.setCurrentConversationId(conversationId);
        
        // Add to conversations if not already there
        if (!this.stateManager.getConversations()[conversationId]) {
            const now = Date.now();
            this.stateManager.addConversation({
                id: conversationId,
                title: `Conversation ${conversationId.substring(0, 8)}`,
                created_at: now,
                updated_at: now,
                message_count: 0
            });
        }
        
        // Update UI
        this.uiManager.updateConversationList();
        this.uiManager.showConversationView();
        
        // Get conversation settings
        this.requestConversationSettings(conversationId);
    }
    
    /**
     * Handle conversation_list message
     * @param {Object} message - The conversation_list message
     */
    handleConversationList(message) {
        // Store conversations
        this.stateManager.setConversations(message.conversations);
        
        // Update UI
        this.uiManager.updateConversationList();
        
        // If no current conversation and we have conversations, select the most recent one
        const currentId = this.stateManager.getCurrentConversationId();
        const conversations = this.stateManager.getConversations();
        
        if (!currentId && Object.keys(conversations).length > 0) {
            // Find the most recent conversation
            const sortedIds = Object.keys(conversations).sort((a, b) => {
                return conversations[b].updated_at - conversations[a].updated_at;
            });
            
            const mostRecentId = sortedIds[0];
            this.stateManager.setCurrentConversationId(mostRecentId);
            
            // Request conversation history and settings
            this.requestConversationHistory(mostRecentId);
            this.requestConversationSettings(mostRecentId);
            
            // Update UI
            this.uiManager.updateConversationList();
            this.uiManager.showConversationView();
        }
    }
    
    /**
     * Handle messages message
     * @param {Object} message - The messages message
     */
    handleMessages(message) {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Update messages in UI
        this.uiManager.updateMessagesDisplay(message.messages);
    }
    
    /**
     * Handle conversation message
     * @param {Object} message - The conversation message
     */
    handleConversation(message) {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Update messages in UI
        this.uiManager.updateMessagesDisplay(message.messages);
    }
    
    /**
     * Handle settings message
     * @param {Object} message - The settings message
     */
    handleSettings(message) {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Store settings
        this.stateManager.setSettings(message.settings);
    }
    
    /**
     * Handle settings_updated message
     * @param {Object} message - The settings_updated message
     */
    handleSettingsUpdated(message) {
        // No specific handling needed, could show a success toast
        console.log('Settings updated for conversation:', message.conversation_id);
    }
    
    /**
     * Handle error message
     * @param {Object} message - The error message
     */
    handleError(message) {
        console.error('Error:', message.error_code, message.message);
        
        // Show error to user
        this.uiManager.showError(message.error_code, message.message);
    }
    
    /**
     * Handle message_by_id message (for chain-based navigation)
     * @param {Object} message - The message_by_id message
     */
    handleMessageById(message) {
        // This would be used for chain-based navigation, not implemented in basic UI
        console.log('Received message by ID:', message.message);
    }
    
    /**
     * Handle head_id message (for chain-based navigation)
     * @param {Object} message - The head_id message
     */
    handleHeadId(message) {
        // This would be used for chain-based navigation, not implemented in basic UI
        console.log('Received head ID:', message.head_id);
    }
    
    /**
     * Request conversation history
     * @param {string} conversationId - The conversation ID
     */
    requestConversationHistory(conversationId) {
        // This would trigger a WebSocket message to get history
        // In the current architecture, this is handled by the UI manager's event system
    }
    
    /**
     * Request conversation settings
     * @param {string} conversationId - The conversation ID
     */
    requestConversationSettings(conversationId) {
        // This would trigger a WebSocket message to get settings
        // In the current architecture, this is handled by the UI manager's event system
    }
}
