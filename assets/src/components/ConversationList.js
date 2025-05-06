// Conversation list component
import { conversationStore } from '../store/conversations.js';
import { uiStore } from '../store/ui.js';

/**
 * Initialize the conversation list component
 * @param {HTMLElement} containerElement - The container element
 */
export function initConversationList(containerElement) {
    // Store references
    const container = containerElement;
    
    // Register event listeners for store updates
    conversationStore.onConversationsUpdate(renderConversationList);
    
    /**
     * Render the conversation list
     * @param {Object[]} conversations - Array of conversation objects
     */
    function renderConversationList(conversations) {
        // Clear the container
        container.innerHTML = '';
        
        const activeId = conversationStore.getActiveConversation();
        
        // Create conversation items
        conversations.forEach(conversation => {
            const conversationElement = document.createElement('div');
            conversationElement.className = 'conversation-item';
            if (conversation.id === activeId) {
                conversationElement.classList.add('active');
            }
            
            // Create title element
            const titleElement = document.createElement('div');
            titleElement.className = 'conversation-title';
            titleElement.textContent = conversation.title;
            conversationElement.appendChild(titleElement);
            
            // Create preview element if available
            if (conversation.last_message_preview) {
                const previewElement = document.createElement('div');
                previewElement.className = 'conversation-preview';
                previewElement.textContent = conversation.last_message_preview;
                conversationElement.appendChild(previewElement);
            }
            
            // Set data attribute for ID
            conversationElement.dataset.id = conversation.id;
            
            // Add click handler
            conversationElement.addEventListener('click', () => {
                switchConversation(conversation.id);
                
                // On mobile, hide sidebar after selecting a conversation
                if (window.innerWidth <= 768) {
                    uiStore.toggleSidebar(false);
                }
            });
            
            container.appendChild(conversationElement);
        });
        
        // If no conversations, show a message
        if (conversations.length === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'empty-conversations';
            emptyElement.textContent = 'No conversations yet';
            container.appendChild(emptyElement);
        }
    }
    
    /**
     * Switch to a different conversation
     * @param {string} conversationId - The ID of the conversation to switch to
     */
    function switchConversation(conversationId) {
        conversationStore.setActiveConversation(conversationId);
    }
    
    // Initial render
    renderConversationList(conversationStore.getConversations());
    
    // Return public methods
    return {
        refresh: () => renderConversationList(conversationStore.getConversations())
    };
}
