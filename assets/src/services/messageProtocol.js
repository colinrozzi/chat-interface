// Message protocol for communication with the server

/**
 * Create a new conversation request
 * @returns {Object} The message object
 */
export function createNewConversationRequest() {
    return {
        action: 'new_conversation'
    };
}

/**
 * Create a send message request
 * @param {string} conversationId - The ID of the conversation
 * @param {string} messageText - The message text to send
 * @returns {Object} The message object
 */
export function createSendMessageRequest(conversationId, messageText) {
    return {
        action: 'send_message',
        conversation_id: conversationId,
        message: {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: messageText
                }
            ]
        }
    };
}

/**
 * Create a list conversations request
 * @returns {Object} The message object
 */
export function createListConversationsRequest() {
    return {
        action: 'list_conversations'
    };
}

/**
 * Create a get conversation history request
 * @param {string} conversationId - The ID of the conversation
 * @returns {Object} The message object
 */
export function createGetConversationRequest(conversationId) {
    return {
        action: 'get_history',
        conversation_id: conversationId
    };
}

/**
 * Create a get settings request
 * @param {string} conversationId - The ID of the conversation
 * @returns {Object} The message object
 */
export function createGetSettingsRequest(conversationId) {
    return {
        action: 'get_settings',
        conversation_id: conversationId
    };
}

/**
 * Create an update settings request
 * @param {string} conversationId - The ID of the conversation
 * @param {Object} settings - The settings object 
 * @returns {Object} The message object
 */
export function createUpdateSettingsRequest(conversationId, settings) {
    return {
        action: 'update_settings',
        conversation_id: conversationId,
        settings: settings
    };
}

/**
 * Extract text content from a Message object
 * @param {Object} message - The message object
 * @returns {string} The concatenated text content
 */
export function extractTextFromMessage(message) {
    console.log('extractTextFromMessage called with:', message);
    
    if (!message || !message.content || !Array.isArray(message.content)) {
        console.log('Message has invalid format, returning empty string');
        return '';
    }
    
    // Concatenate all text content parts
    const extractedText = message.content
        .filter(content => content.type === 'text')
        .map(content => content.text)
        .join('\n');
    
    console.log('Extracted text from message:', extractedText);
    return extractedText;
}

/**
 * Format a message for display with markdown processing
 * @param {string} text - The text to format
 * @returns {string} HTML-ready formatted text
 */
export function formatMessageText(text) {
    // Process code blocks with ```
    let processedText = text.replace(/```([\w]*)\n([\s\S]*?)```/g, function(match, language, code) {
        return `<pre><code class="language-${language || 'plaintext'}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });
    
    // Process inline code with `
    processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert remaining newlines to <br> tags
    processedText = processedText.replace(/\n/g, '<br>');
    
    return processedText;
}
