// Chat window component - displays messages
import { messageStore } from '../store/messages.js';
import { conversationStore } from '../store/conversations.js';
import { extractTextFromMessage, formatMessageText } from '../services/messageProtocol.js';
import { uiStore } from '../store/ui.js';

/**
 * Initialize the chat window component
 * @param {HTMLElement} containerElement - The container element
 */
export function initChatWindow(containerElement) {
    // Store references
    const messagesContainer = containerElement;
    
    // Register event listeners for store updates
    messageStore.onMessagesUpdate(renderMessages);
    messageStore.onMessagesCleared(clearMessages);
    uiStore.onWaitingStateChange(handleWaitingStateChange);
    
    /**
     * Create a copy button for messages
     * @returns {HTMLButtonElement} The copy button
     */
    function createCopyButton() {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        button.title = 'Copy to clipboard';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const messageElement = this.parentElement;
            const textToCopy = messageElement.innerText.replace('Copy to clipboard', '').trim();
            
            // Copy to clipboard
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Show success feedback
                const originalHTML = this.innerHTML;
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                }, 2000);
                
                showMessage('Copied to clipboard');
            }).catch(err => {
                console.error('Could not copy text: ', err);
                showError('Failed to copy text');
            });
        });
        
        return button;
    }
    
    /**
     * Add a user message to the UI
     * @param {string|Object} message - The message text or object
     */
    function addUserMessage(message) {
        console.log('addUserMessage called with:', message);
        
        // Check if the message is a string or an object
        const textContent = typeof message === 'string' 
            ? message 
            : extractTextFromMessage(message);
        
        console.log('Processed user message text for rendering:', textContent);
        addMessageToUI('user', textContent);
    }
    
    /**
     * Add an assistant message to the UI
     * @param {Object} message - The message object
     */
    function addAssistantMessage(message) {
        // Create a message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message assistant';
        
        // Create and add copy button
        const copyButton = createCopyButton();
        messageElement.appendChild(copyButton);
        
        // Handle each content block
        if (message.content && Array.isArray(message.content)) {
            message.content.forEach(content => {
                switch (content.type) {
                    case 'text':
                        const textElement = document.createElement('div');
                        // Convert newlines to <br> tags
                        textElement.innerHTML = content.text.replace(/\n/g, '<br>');
                        messageElement.appendChild(textElement);
                        break;
                        
                    case 'tool_use':
                        const toolUseElement = document.createElement('div');
                        toolUseElement.className = 'tool-use';
                        
                        // Tool name
                        const nameElement = document.createElement('div');
                        nameElement.className = 'tool-name';
                        nameElement.textContent = `Tool: ${content.name}`;
                        toolUseElement.appendChild(nameElement);
                        
                        // Tool ID
                        const idElement = document.createElement('div');
                        idElement.className = 'tool-id';
                        idElement.textContent = `ID: ${content.id}`;
                        toolUseElement.appendChild(idElement);
                        
                        // Tool input (pretty-printed JSON)
                        const inputElement = document.createElement('pre');
                        inputElement.className = 'tool-input';
                        try {
                            inputElement.textContent = JSON.stringify(content.input, null, 2);
                        } catch (e) {
                            inputElement.textContent = String(content.input);
                        }
                        toolUseElement.appendChild(inputElement);
                        
                        messageElement.appendChild(toolUseElement);
                        break;
                        
                    case 'tool_result':
                        const toolResultElement = document.createElement('div');
                        toolResultElement.className = 'tool-result';
                        if (content.is_error) {
                            toolResultElement.classList.add('error');
                        }
                        
                        // Tool use ID
                        const useIdElement = document.createElement('div');
                        useIdElement.className = 'tool-id';
                        useIdElement.textContent = `Tool ID: ${content.tool_use_id}`;
                        toolResultElement.appendChild(useIdElement);
                        
                        // Result content (pretty-printed JSON)
                        const resultElement = document.createElement('pre');
                        resultElement.className = 'tool-content';
                        try {
                            resultElement.textContent = JSON.stringify(content.content, null, 2);
                        } catch (e) {
                            resultElement.textContent = String(content.content);
                        }
                        toolResultElement.appendChild(resultElement);
                        
                        messageElement.appendChild(toolResultElement);
                        break;
                    
                    default:
                        console.warn(`Unknown content type: ${content.type}`);
                }
            });
        } else {
            // Fallback for simple text (legacy format)
            const textContent = typeof message === 'string' ? message : extractTextFromMessage(message);
            messageElement.innerHTML = textContent.replace(/\n/g, '<br>');
        }
        
        messagesContainer.appendChild(messageElement);
        
        // Scroll to the bottom
        scrollToBottom();
    }
    
    /**
     * Add a message to the UI
     * @param {string} role - The role (user, assistant)
     * @param {string} content - The message content
     */
    function addMessageToUI(role, content) {
        // Remove welcome message if present
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        
        // Create and add copy button
        const copyButton = createCopyButton();
        messageElement.appendChild(copyButton);
        
        // Create a content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content';
        
        // Process message content with formatting
        const processedContent = formatMessageText(content);
        contentWrapper.innerHTML = processedContent;
        messageElement.appendChild(contentWrapper);
        
        messagesContainer.appendChild(messageElement);
        
        // Scroll to the bottom
        scrollToBottom();
    }
    
    /**
     * Render messages for the active conversation
     * @param {Object[]} messages - Array of message objects
     * @param {string} conversationId - The conversation ID
     */
    function renderMessages(messages, conversationId) {
        console.log('renderMessages called with:', { messagesCount: messages.length, conversationId });
        
        const activeId = conversationStore.getActiveConversation();
        console.log('Active conversation ID:', activeId);
        
        // Only render if this is the active conversation
        if (conversationId !== activeId) {
            console.log('Skipping rendering - not the active conversation');
            return;
        }
        
        // Clear messages first
        clearMessages();
        
        // Add each message to the UI
        messages.forEach((message, index) => {
            console.log(`Processing message ${index}:`, { role: message.role, content: message.content });
            
            if (message.role === 'user') {
                console.log('Rendering user message');
                // Pass the whole message object to let addUserMessage handle extraction
                addUserMessage(message);
            } else if (message.role === 'assistant') {
                console.log('Rendering assistant message');
                addAssistantMessage(message);
            }
            // We don't display system messages for now
        });
    }
    
    /**
     * Clear the messages container
     */
    function clearMessages() {
        messagesContainer.innerHTML = '';
    }
    
    /**
     * Show a temporary error message
     * @param {string} message - The error message
     */
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        messagesContainer.appendChild(errorElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
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
     * Show or hide loading indicator
     * @param {boolean} isWaiting - Whether we're waiting for a response
     */
    function handleWaitingStateChange(isWaiting) {
        if (isWaiting) {
            showLoadingIndicator();
        } else {
            hideLoadingIndicator();
        }
    }
    
    /**
     * Show loading indicator
     */
    function showLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.id = 'loading-indicator';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'loading-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'loading-dot';
            dotsContainer.appendChild(dot);
        }
        
        loadingElement.appendChild(dotsContainer);
        messagesContainer.appendChild(loadingElement);
        
        // Scroll to the bottom
        scrollToBottom();
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoadingIndicator() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    /**
     * Scroll to the bottom of the messages container
     */
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Return public methods
    return {
        clearMessages,
        showError,
        showMessage,
        scrollToBottom
    };
}
