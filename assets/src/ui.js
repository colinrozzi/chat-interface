/**
 * UI Manager
 * Handles all UI interactions for the Claude Chat frontend
 */

export class UIManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        
        // Cache DOM elements
        this.elements = {
            // Main UI sections
            welcomeScreen: document.getElementById('welcome-screen'),
            conversationView: document.getElementById('conversation-view'),
            
            // Buttons
            newChatBtn: document.getElementById('new-chat-btn'),
            welcomeNewChatBtn: document.getElementById('welcome-new-chat-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            sendBtn: document.getElementById('send-btn'),
            
            // Conversation elements
            conversationList: document.getElementById('conversation-list'),
            conversationTitle: document.getElementById('conversation-title'),
            messagesContainer: document.getElementById('messages-container'),
            messageForm: document.getElementById('message-form'),
            messageInput: document.getElementById('message-input'),
            
            // Settings modal
            settingsModal: document.getElementById('settings-modal'),
            settingsForm: document.getElementById('settings-form'),
            modelSelect: document.getElementById('model-select'),
            temperatureInput: document.getElementById('temperature-input'),
            temperatureValue: document.getElementById('temperature-value'),
            maxTokensInput: document.getElementById('max-tokens-input'),
            systemPromptInput: document.getElementById('system-prompt-input')
        };
        
        // Event callback
        this.onAction = null;
    }
    
    // Set up event listeners
    setupEventListeners(actionCallback) {
        this.onAction = actionCallback;
        
        // New chat buttons
        this.elements.newChatBtn.addEventListener('click', () => {
            this.onAction('new_conversation');
        });
        
        this.elements.welcomeNewChatBtn.addEventListener('click', () => {
            this.onAction('new_conversation');
        });
        
        // Message form
        this.elements.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const messageContent = this.elements.messageInput.value.trim();
            if (!messageContent) return;
            
            // Add optimistic message to UI
            this.addMessage({
                role: 'user',
                content: messageContent
            });
            
            // Clear input
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = 'auto';
            
            // Send to backend
            this.onAction('send_message', { content: messageContent });
            
            // Show loading indicator
            this.showLoadingMessage();
        });
        
        // Auto-resize message input
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea(this.elements.messageInput);
        });
        
        // Settings modal
        this.elements.settingsBtn.addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        this.elements.closeSettingsBtn.addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        this.elements.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.elements.settingsForm);
            const settings = {
                model_config: {
                    model: formData.get('model'),
                    provider: 'anthropic'
                },
                temperature: parseFloat(formData.get('temperature')),
                max_tokens: parseInt(formData.get('max_tokens')),
                system_prompt: formData.get('system_prompt'),
                title: this.stateManager.getCurrentConversation()?.title || 'New Conversation',
                mcp_servers: []
            };
            
            this.onAction('update_settings', { settings });
            this.closeSettingsModal();
        });
        
        // Temperature range input
        this.elements.temperatureInput.addEventListener('input', (e) => {
            this.elements.temperatureValue.textContent = e.target.value;
        });
    }
    
    // UI state management
    
    showWelcomeScreen() {
        this.elements.welcomeScreen.classList.remove('hidden');
        this.elements.conversationView.classList.add('hidden');
    }
    
    showConversationView() {
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.conversationView.classList.remove('hidden');
        
        const conversation = this.stateManager.getCurrentConversation();
        if (conversation) {
            this.elements.conversationTitle.textContent = conversation.title;
        }
    }
    
    showConnectionStatus(connected) {
        // This could show a connection status indicator
        if (!connected) {
            this.showError('Connection Lost', 'Trying to reconnect...');
        }
    }
    
    showError(title, message) {
        // Simple alert for now, could be replaced with a nice toast or modal
        alert(`${title}: ${message}`);
    }
    
    showLoadingMessage() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message message-assistant loading';
        loadingEl.innerHTML = `
            <div class="message-content">
                <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(loadingEl);
        this.scrollToBottom();
        
        return loadingEl;
    }
    
    removeLoadingMessage() {
        const loadingEl = this.elements.messagesContainer.querySelector('.loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
    
    // Settings modal
    
    openSettingsModal() {
        // Update form with current settings
        const settings = this.stateManager.getSettings();
        
        this.elements.modelSelect.value = settings.model_config.model;
        this.elements.temperatureInput.value = settings.temperature;
        this.elements.temperatureValue.textContent = settings.temperature;
        this.elements.maxTokensInput.value = settings.max_tokens;
        this.elements.systemPromptInput.value = settings.system_prompt || '';
        
        // Show modal
        this.elements.settingsModal.classList.remove('hidden');
    }
    
    closeSettingsModal() {
        this.elements.settingsModal.classList.add('hidden');
    }
    
    // Conversation list
    
    updateConversationList() {
        const conversationList = this.elements.conversationList;
        const conversations = this.stateManager.getConversations();
        const currentId = this.stateManager.getCurrentConversationId();
        
        // Clear the list
        conversationList.innerHTML = '';
        
        // Sort conversations by updated_at (most recent first)
        const sortedIds = Object.keys(conversations).sort((a, b) => {
            return conversations[b].updated_at - conversations[a].updated_at;
        });
        
        // Add each conversation to the list
        sortedIds.forEach(id => {
            const conversation = conversations[id];
            const isActive = id === currentId;
            
            const li = document.createElement('li');
            li.className = `conversation-item ${isActive ? 'active' : ''}`;
            li.dataset.id = id;
            li.innerHTML = `
                <div class="conversation-item-title">${conversation.title}</div>
                <div class="conversation-item-meta">
                    ${this.formatDate(conversation.updated_at)} · ${conversation.message_count || 0} messages
                </div>
            `;
            
            li.addEventListener('click', () => {
                this.onAction('select_conversation', { conversationId: id });
            });
            
            conversationList.appendChild(li);
        });
    }
    
    // Messages display
    
    updateMessagesDisplay(messages) {
        // Store messages in state
        this.stateManager.setMessages(messages);
        
        // Clear messages container
        this.elements.messagesContainer.innerHTML = '';
        
        // Add each message
        messages.forEach(message => {
            this.addMessage(message, false);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    addMessage(message, scroll = true) {
        // Remove loading indicator if present
        this.removeLoadingMessage();
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${message.role}`;
        
        // Format message content with Markdown (simple version)
        const formattedContent = this.formatMessageContent(message.content);
        
        messageEl.innerHTML = `
            <div class="message-content">${formattedContent}</div>
            <div class="message-meta">${this.formatTime(new Date())}</div>
        `;
        
        this.elements.messagesContainer.appendChild(messageEl);
        
        if (scroll) {
            this.scrollToBottom();
        }
    }
    
    // Helper methods
    
    formatMessageContent(content) {
        // Very basic markdown-like formatting
        // This could be replaced with a proper Markdown parser
        let formatted = content
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Convert URLs to links
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            // Convert code blocks
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            // Convert inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Convert bold text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Convert italic text
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Convert line breaks
            .replace(/\n/g, '<br>');
            
        return formatted;
    }
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    scrollToBottom() {
        const container = this.elements.messagesContainer;
        container.scrollTop = container.scrollHeight;
    }
    
    autoResizeTextarea(textarea) {
        // Reset height to auto to get correct scrollHeight
        textarea.style.height = 'auto';
        
        // Set height to scrollHeight
        const newHeight = Math.min(textarea.scrollHeight, 150);
        textarea.style.height = `${newHeight}px`;
    }
}
