/**
 * Message Handler
 * Processes WebSocket messages from the chat-interface backend
 */

import { StateManager } from './state';
import { UIManager } from './ui';
import {
    ServerMessage,
    ConversationCreatedMessage,
    ConversationListMessage,
    MessageResponse,
    ErrorMessage,
    SettingsMessage,
    HistoryMessage,
    MessagesResponse,
    ConversationRenamedMessage,
    Message
} from './types';

export class MessageHandler {
    private stateManager: StateManager;
    private uiManager: UIManager;
    
    constructor(stateManager: StateManager, uiManager: UIManager) {
        this.stateManager = stateManager;
        this.uiManager = uiManager;
    }
    
    /**
     * Handle a message from the server
     * @param {ServerMessage} message - The message received from the server
     */
    handleServerMessage(message: ServerMessage): void {
        console.log('Received message:', message);
        
        switch (message.type) {
            case 'conversation_created':
                this.handleConversationCreated(message as ConversationCreatedMessage);
                break;
                
            case 'conversation_list':
                this.handleConversationList(message as ConversationListMessage);
                break;
                
            case 'message':
                this.handleMessage(message as MessageResponse);
                break;
                
            case 'conversation':
                this.handleHistory(message as HistoryMessage);
                break;
            
            case 'messages':
                this.handleMessages(message as MessagesResponse);
                break;
                
            case 'settings':
                this.handleSettings(message as SettingsMessage);
                break;
                
            case 'settings_updated':
                this.handleSettingsUpdated(message);
                break;
                
            case 'conversation_renamed':
                this.handleConversationRenamed(message as ConversationRenamedMessage);
                break;
                
            case 'error':
                this.handleError(message as ErrorMessage);
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
     * @param {ConversationCreatedMessage} message - The conversation_created message
     */
    handleConversationCreated(message: ConversationCreatedMessage): void {
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
     * @param {ConversationListMessage} message - The conversation_list message
     */
    handleConversationList(message: ConversationListMessage): void {
        // Use the conversations map directly
        const conversationsMap = message.conversations;
        
        // Store conversations
        this.stateManager.setConversations(conversationsMap);
        
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
     * Handle message response
     * @param {MessageResponse} message - The message response
     */
    handleMessage(message: MessageResponse): void {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Add message to state
        this.stateManager.addMessage(message.content);
        
        // Update UI
        this.uiManager.updateMessagesDisplay(this.stateManager.getMessages());
    }
    
    /**
     * Handle messages array response
     * @param {ServerMessage} message - The messages array response
     */
    handleMessages(message: MessagesResponse): void {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Set messages in state
        if (Array.isArray(message.messages)) {
            this.stateManager.setMessages(message.messages);
        }
        
        // Update UI
        this.uiManager.updateMessagesDisplay(this.stateManager.getMessages());
    }
    
    /**
     * Handle history message
     * @param {ServerMessage} message - The history message
     */
    handleHistory(message: HistoryMessage): void {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Set messages in state
        if (Array.isArray(message.messages)) {
            this.stateManager.setMessages(message.messages);
        }
        
        // Update UI
        this.uiManager.updateMessagesDisplay(this.stateManager.getMessages());
    }
    
    /**
     * Handle settings message
     * @param {SettingsMessage} message - The settings message
     */
    handleSettings(message: SettingsMessage): void {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Store settings
        this.stateManager.setSettings(message.settings);
        
        // Update UI
        this.uiManager.updateSettingsDisplay(message.settings);
    }
    
    /**
     * Handle settings_updated message
     * @param {ServerMessage} message - The settings_updated message
     */
    handleSettingsUpdated(message: ServerMessage): void {
        // No specific handling needed, could show a success toast
        console.log('Settings updated for conversation:', message.conversation_id);
    }
    
    /**
     * Handle conversation_renamed message
     * @param {ConversationRenamedMessage} message - The conversation_renamed message
     */
    handleConversationRenamed(message: ConversationRenamedMessage): void {
        const { conversation_id, title } = message;
        
        // Update the conversation title in state
        const conversations = this.stateManager.getConversations();
        if (conversations[conversation_id]) {
            conversations[conversation_id].title = title;
            
            // Update the current conversation display if this is the active conversation
            if (conversation_id === this.stateManager.getCurrentConversationId()) {
                this.uiManager.elements.conversationTitle.textContent = title;
            }
            
            // Update the conversation list
            this.uiManager.updateConversationList();
            
            // Show a success message
            console.log('Conversation renamed:', conversation_id, 'New title:', title);
        }
    }
    
    /**
     * Handle error message
     * @param {ErrorMessage} message - The error message
     */
    handleError(message: ErrorMessage): void {
        console.error('Error:', message.error_code, message.message);
        
        // Show error to user
        this.uiManager.showError(message.error_code, message.message);
    }
    
    /**
     * Request conversation history
     * @param {string} conversationId - The conversation ID
     */
    requestConversationHistory(conversationId: string): void {
        // This would trigger a WebSocket message to get history
        // In the current architecture, this is handled by the UI manager's event system
    }
    
    /**
     * Request conversation settings
     * @param {string} conversationId - The conversation ID
     */
    requestConversationSettings(conversationId: string): void {
        // This would trigger a WebSocket message to get settings
        // In the current architecture, this is handled by the UI manager's event system
    }
}
