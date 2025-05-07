/**
 * Claude Chat Frontend
 * A WebSocket-based interface for interacting with the Claude Chat backend
 */

import { WebSocketManager } from './websocket';
import { UIManager } from './ui';
import { StateManager } from './state';
import { MessageHandler } from './message-handler';
import { UIEventCallback } from './types';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create the state manager to handle application state
    const stateManager = new StateManager();

    // Create the UI manager to handle DOM interactions
    const uiManager = new UIManager(stateManager);

    // Create the WebSocket manager for backend communication
    const websocketManager = new WebSocketManager();

    // Create message handler to process incoming messages
    const messageHandler = new MessageHandler(stateManager, uiManager);

    // Set up WebSocket event handlers
    websocketManager.onMessage = (message) => {
        messageHandler.handleServerMessage(message);
    };

    websocketManager.onOpen = () => {
        console.log('WebSocket connected');
        // List conversations after connection
        websocketManager.sendMessage({
            action: 'list_conversations'
        });
    };

    websocketManager.onClose = () => {
        console.log('WebSocket disconnected');
        uiManager.showConnectionStatus(false);
    };

    websocketManager.onError = (error) => {
        console.error('WebSocket error:', error);
        uiManager.showError('Connection error', 'Could not connect to the server.');
    };

    // Connect WebSocket
    websocketManager.connect();

    // Initialize UI event listeners
    const eventCallback: UIEventCallback = (action, data) => {
        switch (action) {
            case 'new_conversation':
                websocketManager.sendMessage({
                    action: 'new_conversation'
                });
                break;

            case 'select_conversation':
                stateManager.setCurrentConversationId(data.conversationId);
                websocketManager.sendMessage({
                    action: 'get_history',
                    conversation_id: data.conversationId
                });

                // Also load conversation settings
                websocketManager.sendMessage({
                    action: 'get_settings',
                    conversation_id: data.conversationId
                });

                uiManager.updateConversationList();
                uiManager.showConversationView();
                break;

            case 'send_message':
                websocketManager.sendMessage({
                    action: 'send_message',
                    conversation_id: stateManager.getCurrentConversationId(),
                    message: {
                        role: 'user',
                        content: [{
                            type: 'text',
                            text: data.content,
                        }]
                    }
                });
                break;

            case 'update_settings':
                websocketManager.sendMessage({
                    action: 'update_settings',
                    conversation_id: stateManager.getCurrentConversationId(),
                    settings: data.settings
                });
                break;
        }
    };
    
    uiManager.setupEventListeners(eventCallback);

    // Expose key components to window for debugging
    (window as any).chatApp = {
        state: stateManager,
        ui: uiManager,
        ws: websocketManager,
        messageHandler
    };
});
