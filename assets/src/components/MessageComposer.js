// Message composer component
import { conversationStore } from '../store/conversations.js';
import { uiStore } from '../store/ui.js';
import { sendAction } from '../services/websocket.js';
import { createSendMessageRequest } from '../services/messageProtocol.js';

/**
 * Initialize the message composer component
 * @param {HTMLElement} inputElement - The input element
 * @param {HTMLElement} sendButtonElement - The send button element
 */
export function initMessageComposer(inputElement, sendButtonElement) {
    // Store references
    const messageInput = inputElement;
    const sendButton = sendButtonElement;
    
    // Set up event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Register for UI state changes
    uiStore.onWaitingStateChange(handleWaitingStateChange);
    
    /**
     * Send a message
     */
    function sendMessage() {
        const message = messageInput.value.trim();
        const conversationId = conversationStore.getActiveConversation();
        
        if (!message || !conversationId || uiStore.isWaitingForResponse()) {
            return;
        }
        
        // Set waiting state
        uiStore.setWaitingForResponse(true);
        
        // Create and send message request
        const request = createSendMessageRequest(conversationId, message);
        const success = sendAction(request.action, {
            conversation_id: request.conversation_id,
            message: request.message
        });
        
        // Clear the input
        messageInput.value = '';
        
        // If failed to send, reset waiting state
        if (!success) {
            uiStore.setWaitingForResponse(false);
        }
    }
    
    /**
     * Handle waiting state changes
     * @param {boolean} isWaiting - Whether we're waiting for a response
     */
    function handleWaitingStateChange(isWaiting) {
        sendButton.disabled = isWaiting;
        
        if (isWaiting) {
            sendButton.classList.add('disabled');
        } else {
            sendButton.classList.remove('disabled');
            // Focus the input field after response
            messageInput.focus();
        }
    }
    
    // Return public methods
    return {
        focus: () => messageInput.focus(),
        clear: () => messageInput.value = '',
        getValue: () => messageInput.value,
        setValue: (value) => messageInput.value = value
    };
}
