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
    
    if (!message || !activeConversationId) {
        return;
    }
    
    // Add the message to the UI
    addMessage('user', message);
    
    // Send the message to the server
    sendAction('send_message', {
        conversation_id: activeConversationId,
        message: message
    });
    
    // Clear the input
    messageInput.value = '';
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
    
    switch (message.message_type) {
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
            
        case 'error':
            showError(message.content);
            break;
            
        default:
            console.warn('Unknown message type:', message.message_type);
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
            last_message: null
        };
        
        conversations.push(newConversation);
        updateConversationList();
    }
    
    // Clear the welcome message
    clearMessages();
}

// Handle conversation list
function handleConversationList(conversationsList) {
    conversations = conversationsList;
    updateConversationList();
}

// Handle incoming message
function handleIncomingMessage(message) {
    if (message.conversation_id === activeConversationId) {
        addMessage('assistant', message.content);
    }
    
    // Update the conversation preview
    const conversation = conversations.find(conv => conv.id === message.conversation_id);
    if (conversation) {
        conversation.last_message = message.content;
        updateConversationList();
    }
}

// Add a message to the UI
function addMessage(role, content) {
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
    
    conversations.forEach(conversation => {
        const conversationElement = document.createElement('div');
        conversationElement.className = 'conversation-item';
        if (conversation.id === activeConversationId) {
            conversationElement.classList.add('active');
        }
        
        conversationElement.textContent = conversation.title;
        conversationElement.dataset.id = conversation.id;
        
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
