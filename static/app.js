// DOM Elements
const newChatBtn = document.getElementById('new-chat-btn');
const conversationList = document.getElementById('conversation-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const currentConversationTitle = document.getElementById('current-conversation-title');

// State
let socket = null;
let activeConversationId = null;
let conversations = [];
let isWaitingForResponse = false;

// Initialize the application
function init() {
    connectWebSocket();
    setupEventListeners();
}

// Connect to WebSocket server
function connectWebSocket() {
    // Get the current hostname and port
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
        console.log('WebSocket connection established');
        // Request the list of existing conversations
        sendAction('list_conversations');
    };
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };
    
    socket.onclose = () => {
        console.log('WebSocket connection closed');
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Set up event listeners
function setupEventListeners() {
    newChatBtn.addEventListener('click', createNewConversation);
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Create a new conversation
function createNewConversation() {
    // Clear the messages container first
    clearMessages();
    
    // Send the new conversation request
    sendAction('new_conversation');
}

// Send a message
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || !activeConversationId || isWaitingForResponse) {
        return;
    }
    
    // Add the message to the UI immediately
    addUserMessage(message);
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Set waiting state
    isWaitingForResponse = true;
    sendButton.disabled = true;
    
    // Send the message to the server
    sendAction('send_message', {
        conversation_id: activeConversationId,
        message: message
    });
    
    // Clear the input
    messageInput.value = '';
}

// Show loading indicator
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    // Reset waiting state
    isWaitingForResponse = false;
    sendButton.disabled = false;
}

// Send an action to the server
function sendAction(action, additionalData = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        showError('Connection to server lost. Trying to reconnect...');
        return;
    }
    
    const data = {
        action: action,
        ...additionalData
    };
    
    socket.send(JSON.stringify(data));
}

// Handle server messages
function handleServerMessage(message) {
    console.log('Received message:', message);
    
    // If we get any message, hide the loading indicator
    hideLoadingIndicator();
    
    // Check the type field which is now part of the tagged enum
    switch (message.type) {
        case 'welcome':
            // Server welcome message
            break;
            
        case 'conversation_created':
            handleConversationCreated(message);
            break;
            
        case 'conversation_list':
            handleConversationList(message.conversations);
            break;
            
        case 'message':
            handleIncomingMessage(message);
            break;
            
        case 'history':
            handleConversationHistory(message);
            break;
            
        case 'error':
            showError(message.message); // Note: using message.message as error content
            break;
            
        default:
            console.warn('Unknown message type:', message.type);
    }
}

// Handle conversation created
function handleConversationCreated(message) {
    activeConversationId = message.conversation_id;
    currentConversationTitle.textContent = 'New Conversation';
    
    // Add to conversation list if not already there
    if (!conversations.some(conv => conv.id === message.conversation_id)) {
        const newConversation = {
            id: message.conversation_id,
            title: 'New Conversation',
            last_message_preview: null,
            created_at: Date.now(),
            updated_at: Date.now(),
            message_count: 0
        };
        
        conversations.push(newConversation);
        updateConversationList();
    }
    
    // Clear the welcome message
    clearMessages();
}

// Handle conversation list
function handleConversationList(conversationsList) {
    // Convert the object to an array
    conversations = Object.values(conversationsList);
    updateConversationList();
}

// Extract text content from a Message object
function extractTextFromMessage(message) {
    if (!message || !message.content || !Array.isArray(message.content)) {
        return '';
    }
    
    // Concatenate all text content parts
    return message.content
        .filter(content => content.type === 'text')
        .map(content => content.text)
        .join('\n');
}

// Handle an incoming message from the assistant
function handleIncomingMessage(message) {
    if (message.conversation_id === activeConversationId) {
        // Add the message to the UI
        addAssistantMessage(message.message);
    }
    
    // Update the conversation preview
    const conversation = conversations.find(conv => conv.id === message.conversation_id);
    if (conversation) {
        const messageText = extractTextFromMessage(message.message);
        conversation.last_message_preview = messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '');
        conversation.updated_at = Date.now();
        conversation.message_count = (conversation.message_count || 0) + 1;
        updateConversationList();
    }
}

// Handle conversation history
function handleConversationHistory(message) {
    if (message.conversation_id === activeConversationId) {
        clearMessages();
        
        // Add each message to the UI
        message.messages.forEach(msg => {
            if (msg.role === 'user') {
                addUserMessage(extractTextFromMessage(msg));
            } else if (msg.role === 'assistant') {
                addAssistantMessage(msg);
            }
            // We don't display system messages for now
        });
    }
}

// Add a user message to the UI
function addUserMessage(text) {
    // Create a simple text message for the UI
    addMessageToUI('user', text);
}

// Add an assistant message to the UI
function addAssistantMessage(message) {
    // Create a message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant';
    
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add a message to the UI
function addMessageToUI(role, content) {
    // Remove welcome message if present
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    
    // Convert newlines to <br> tags
    const formattedContent = content.replace(/\n/g, '<br>');
    messageElement.innerHTML = formattedContent;
    
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update the conversation list in the UI
function updateConversationList() {
    conversationList.innerHTML = '';
    
    // Sort conversations by updated_at (most recent first)
    const sortedConversations = [...conversations].sort((a, b) => 
        (b.updated_at || 0) - (a.updated_at || 0)
    );
    
    sortedConversations.forEach(conversation => {
        const conversationElement = document.createElement('div');
        conversationElement.className = 'conversation-item';
        if (conversation.id === activeConversationId) {
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
        });
        
        conversationList.appendChild(conversationElement);
    });
}

// Switch to a different conversation
function switchConversation(conversationId) {
    activeConversationId = conversationId;
    
    // Update UI
    updateConversationList();
    clearMessages();
    
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
        currentConversationTitle.textContent = conversation.title;
    }
    
    // Request conversation history
    sendAction('get_history', {
        conversation_id: conversationId
    });
}

// Clear messages container
function clearMessages() {
    messagesContainer.innerHTML = '';
}

// Show error message
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

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', init);
