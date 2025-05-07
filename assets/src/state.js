/**
 * State Manager
 * Manages the application state for the Claude Chat frontend
 */

export class StateManager {
    constructor() {
        this.state = {
            // WebSocket connection status
            connected: false,
            
            // Current conversation
            currentConversationId: null,
            
            // Map of conversation IDs to conversation objects
            conversations: {},
            
            // Current conversation messages
            messages: [],
            
            // Default settings
            settings: {
                model_config: {
                    model: 'claude-3-7-sonnet-20250219',
                    provider: 'anthropic'
                },
                temperature: 0.7,
                max_tokens: 1024,
                system_prompt: 'You are Claude, a helpful AI assistant created by Anthropic.',
                title: 'New Conversation',
                mcp_servers: []
            }
        };
    }
    
    // Connection state
    
    setConnected(connected) {
        this.state.connected = connected;
        return this;
    }
    
    isConnected() {
        return this.state.connected;
    }
    
    // Conversation management
    
    setCurrentConversationId(conversationId) {
        this.state.currentConversationId = conversationId;
        return this;
    }
    
    getCurrentConversationId() {
        return this.state.currentConversationId;
    }
    
    getCurrentConversation() {
        const id = this.getCurrentConversationId();
        return id ? this.state.conversations[id] : null;
    }
    
    setConversations(conversations) {
        this.state.conversations = conversations;
        return this;
    }
    
    getConversations() {
        return this.state.conversations;
    }
    
    addConversation(conversation) {
        this.state.conversations[conversation.id] = conversation;
        return this;
    }
    
    // Message management
    
    setMessages(messages) {
        this.state.messages = messages;
        return this;
    }
    
    getMessages() {
        return this.state.messages;
    }
    
    addMessage(message) {
        this.state.messages.push(message);
        return this;
    }
    
    // Settings management
    
    setSettings(settings) {
        this.state.settings = settings;
        return this;
    }
    
    getSettings() {
        return this.state.settings;
    }
}
