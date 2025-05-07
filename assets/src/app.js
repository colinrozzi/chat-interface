// Main application entry point
import { initStore } from './store/index.js';
import { connectWebSocket, registerMessageHandler, sendAction } from './services/websocket.js';
import { initConversationList } from './components/ConversationList.js';
import { initChatWindow } from './components/ChatWindow.js';
import { initMessageComposer } from './components/MessageComposer.js';
import { initSettings } from './components/Settings.js';
import { conversationStore } from './store/conversations.js';
import { messageStore } from './store/messages.js';
import { settingsStore } from './store/settings.js';
import { uiStore } from './store/ui.js';
import { extractTextFromMessage } from './services/messageProtocol.js';

// Component references
let conversationListComponent;
let chatWindowComponent;
let messageComposerComponent;
let settingsComponent;

/**
 * Initialize the application
 */
export async function initApp() {
    console.log('Initializing chat interface app');
    
    // Initialize the store
    initStore();
    
    // Initialize UI components
    initComponents();
    
    // Set up event listeners
    setupEventListeners();
    
    // Connect to WebSocket
    try {
        await connectWebSocket();
        console.log('WebSocket connected, requesting conversations list');
        // Request the list of existing conversations
        sendAction('list_conversations');
    } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        chatWindowComponent.showError('Failed to connect to server. Please try refreshing the page.');
    }
    
    // Set up WebSocket message handlers
    setupMessageHandlers();
    
    // Set up mobile responsiveness
    setupMobileResponsiveness();
    
    console.log('App initialization complete');
}

/**
 * Initialize UI components
 */
function initComponents() {
    // Conversation list
    const conversationListElement = document.getElementById('conversation-list');
    conversationListComponent = initConversationList(conversationListElement);
    
    // Chat window
    const messagesContainerElement = document.getElementById('messages-container');
    chatWindowComponent = initChatWindow(messagesContainerElement);
    
    // Message composer
    const messageInputElement = document.getElementById('message-input');
    const sendButtonElement = document.getElementById('send-button');
    messageComposerComponent = initMessageComposer(messageInputElement, sendButtonElement);
    
    // Settings panel
    const settingsPanelElement = document.getElementById('settings-panel');
    const closeSettingsButtonElement = document.getElementById('close-settings-btn');
    const settingsFormElement = document.getElementById('settings-form');
    settingsComponent = initSettings(settingsPanelElement, closeSettingsButtonElement, settingsFormElement);
    
    // Set up settings button
    setupSettingsButton();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // New chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewConversation);
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            uiStore.toggleDarkMode(this.checked);
        });
        
        // Set initial state based on UI store
        themeToggle.checked = uiStore.isDarkMode();
    }
}

/**
 * Create a new conversation
 */
function createNewConversation() {
    // Clear the messages container first
    messageStore.clearMessages();
    
    // Send the new conversation request
    sendAction('new_conversation');
}

/**
 * Set up settings button in the chat header
 */
function setupSettingsButton() {
    const chatHeader = document.querySelector('.chat-header');
    if (!chatHeader) return;
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'settings-button';
    settingsButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    `;
    
    settingsButton.addEventListener('click', () => {
        // Only show settings panel if there's an active conversation
        if (conversationStore.getActiveConversation()) {
            uiStore.toggleSettingsPanel();
        } else {
            chatWindowComponent.showError('Please select or create a conversation first');
        }
    });
    
    chatHeader.appendChild(settingsButton);
}

/**
 * Set up WebSocket message handlers
 */
function setupMessageHandlers() {
    // Register handlers for various message types
    
    // Welcome message
    registerMessageHandler('welcome', (message) => {
        console.log('Received welcome message:', message);
    });
    
    // Conversation created
    registerMessageHandler('conversation_created', (message) => {
        console.log('Conversation created:', message);
        
        const conversationId = message.conversation_id;
        conversationStore.setActiveConversation(conversationId);
        
        // Create a new conversation entry
        const newConversation = {
            id: conversationId,
            title: 'New Conversation',
            last_message_preview: null,
            created_at: Date.now(),
            updated_at: Date.now(),
            message_count: 0
        };
        
        conversationStore.addConversation(newConversation);
        
        // Update UI title
        const currentConversationTitle = document.getElementById('current-conversation-title');
        if (currentConversationTitle) {
            currentConversationTitle.textContent = 'New Conversation';
        }
    });
    
    // Conversation list
    registerMessageHandler('conversation_list', (message) => {
        console.log('Received conversation list');
        
        // Convert the object to an array
        const conversationsObject = message.conversations;
        const conversations = Object.entries(conversationsObject).map(([id, data]) => ({
            id,
            ...data
        }));
        
        conversationStore.setConversations(conversations);
    });
    
    // Messages
    registerMessageHandler('messages', (message) => {
        console.log('Received messages for conversation:', message.conversation_id);
        
        const conversationId = message.conversation_id;
        const activeId = conversationStore.getActiveConversation();
        
        // Reset waiting state
        uiStore.setWaitingForResponse(false);
        
        // Add messages to store
        const assistantMessages = message.messages.filter(msg => msg.role === 'assistant');
        if (assistantMessages.length > 0) {
            messageStore.addMessages(conversationId, assistantMessages);
            
            // Update conversation preview with the last message
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            const messageText = extractTextFromMessage(lastMessage);
            
            // Find/update the conversation
            const conversation = conversationStore.getConversation(conversationId);
            if (conversation) {
                // These updates will be done via the messageStore.onMessageAdd callback
                // which is registered in the store/index.js setupStoreConnections method
            }
        }
    });
    
    // Conversation history
    registerMessageHandler('conversation', (message) => {
        console.log('Received conversation history:', message.conversation_id);
        console.log('Conversation history messages:', message.messages);
        
        const conversationId = message.conversation_id;
        
        // Examine messages to debug user message display issues
        if (message.messages && Array.isArray(message.messages)) {
            message.messages.forEach((msg, index) => {
                console.log(`Message ${index} details:`, {
                    role: msg.role,
                    contentType: msg.content ? (Array.isArray(msg.content) ? 'array' : typeof msg.content) : 'undefined',
                    contentLength: msg.content && Array.isArray(msg.content) ? msg.content.length : 'N/A'
                });
            });
        }
        
        // Set messages in store
        messageStore.setMessages(conversationId, message.messages);
    });
    
    // Error messages
    registerMessageHandler('error', (message) => {
        console.error('Received error message:', message);
        
        // Reset waiting state
        uiStore.setWaitingForResponse(false);
        
        // Show error in UI
        chatWindowComponent.showError(message.message);
    });
    
    // Settings
    registerMessageHandler('settings', (message) => {
        console.log('Received settings for conversation:', message.conversation_id);
        
        // Store settings
        const conversationId = message.conversation_id;
        const settings = message.settings;
        
        // Update store
        if (conversationId && settings) {
            // This will trigger an update to the settings form via the 
            // settingsStore.onSettingsUpdate callback
            settingsStore.setSettings(conversationId, settings);
        }
    });
    
    // Handle "all" messages for debugging
    registerMessageHandler('all', (message) => {
        console.debug('Message received:', message);
    });
}

/**
 * Set up mobile responsiveness
 */
function setupMobileResponsiveness() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebarToggle || !sidebar) return;
    
    // Function to check screen size and apply mobile view if needed
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            // Show the sidebar toggle button
            sidebarToggle.style.display = 'flex';
            
            // Hide sidebar by default on mobile
            if (!uiStore.isSidebarVisible()) {
                sidebar.classList.add('mobile-hidden');
            }
        } else {
            // Hide the toggle button and always show sidebar on desktop
            sidebarToggle.style.display = 'none';
            sidebar.classList.remove('mobile-hidden');
            
            // Always show sidebar on desktop
            uiStore.toggleSidebar(true);
        }
    }
    
    // Toggle sidebar visibility on mobile
    sidebarToggle.addEventListener('click', function() {
        uiStore.toggleSidebar();
    });
    
    // Listen for UI store sidebar toggle events
    uiStore.onSidebarToggle((isVisible) => {
        if (isVisible) {
            sidebar.classList.remove('mobile-hidden');
            sidebar.classList.add('mobile-shown');
        } else {
            sidebar.classList.add('mobile-hidden');
            sidebar.classList.remove('mobile-shown');
        }
    });
    
    // Check on load and window resize
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
}

// Export the initApp function
export default { initApp };
