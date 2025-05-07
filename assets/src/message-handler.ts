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
        
        switch (message.message_type) {
            case 'conversation_created':
                this.handleConversationCreated(message as ConversationCreatedMessage);
                break;
                
            case 'conversation_list':
                this.handleConversationList(message as ConversationListMessage);
                break;
                
            case 'message':
                this.handleMessage(message as MessageResponse);
                break;
                
            case 'history':
                this.handleHistory(message);
                break;
                
            case 'settings':
                this.handleSettings(message as SettingsMessage);
                break;
                
            case 'settings_updated':
                this.handleSettingsUpdated(message);
                break;
                
            case 'error':
                this.handleError(message as ErrorMessage);
                break;
                
            case 'success':
                // Generic success, no specific handling needed
                break;
                
            default:
                console.warn('Unknown message type:', message.message_type);
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
        // Convert array to map
        const conversationsMap = message.content.reduce((acc, conv) => {
            acc[conv.id] = conv;
            return acc;
        }, {} as Record<string, any>);
        
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
     * Handle history message
     * @param {ServerMessage} message - The history message
     */
    handleHistory(message: ServerMessage): void {
        if (message.conversation_id !== this.stateManager.getCurrentConversationId()) {
            return;
        }
        
        // Set messages in state
        if (Array.isArray(message.content)) {
            this.stateManager.setMessages(message.content as Message[]);
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
        this.stateManager.setSettings(message.content);
        
        // Update UI
        this.uiManager.updateSettingsDisplay(message.content);
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
     * Handle error message
     * @param {ErrorMessage} message - The error message
     */
    handleError(message: ErrorMessage): void {
        console.error('Error:', message.error, message.content);
        
        // Show error to user
        this.uiManager.showError(message.error, message.content);
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
