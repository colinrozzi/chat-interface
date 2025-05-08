/**
 * UI Manager
 * Handles all UI interactions for the Claude Chat frontend
 */

import { StateManager } from './state';
import { UIElements, MessageDisplayOptions } from './types';
import { UIEventCallback, Message, Settings } from './types';

export class UIManager {
    private stateManager: StateManager;
    private elements: UIElements;
    private onAction: UIEventCallback | null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.onAction = null;

        // Cache DOM elements
        this.elements = {
            // Main UI sections
            welcomeScreen: document.getElementById('welcome-screen') as HTMLElement,
            conversationView: document.getElementById('conversation-view') as HTMLElement,

            // Buttons
            newChatBtn: document.getElementById('new-chat-btn') as HTMLElement,
            welcomeNewChatBtn: document.getElementById('welcome-new-chat-btn') as HTMLElement,
            settingsBtn: document.getElementById('settings-btn') as HTMLElement,
            closeSettingsBtn: document.getElementById('close-settings-btn') as HTMLElement,
            sendBtn: document.getElementById('send-btn') as HTMLElement,
            toggleSidebarBtn: document.getElementById('toggle-sidebar-btn') as HTMLElement,

            // Conversation elements
            conversationList: document.getElementById('conversation-list') as HTMLElement,
            conversationTitle: document.getElementById('conversation-title') as HTMLElement,
            messagesContainer: document.getElementById('messages-container') as HTMLElement,
            messageForm: document.getElementById('message-form') as HTMLFormElement,
            messageInput: document.getElementById('message-input') as HTMLTextAreaElement,

            // Settings modal
            settingsModal: document.getElementById('settings-modal') as HTMLElement,
            settingsForm: document.getElementById('settings-form') as HTMLFormElement,
            modelSelect: document.getElementById('model-select') as HTMLSelectElement,
            temperatureInput: document.getElementById('temperature-input') as HTMLInputElement,
            temperatureValue: document.getElementById('temperature-value') as HTMLElement,
            maxTokensInput: document.getElementById('max-tokens-input') as HTMLInputElement,
            systemPromptInput: document.getElementById('system-prompt-input') as HTMLTextAreaElement
        };
    }

    // Set up event listeners
    setupEventListeners(actionCallback: UIEventCallback): void {
        // Setup sidebar toggle and keyboard shortcuts
        this.setupSidebarToggle();
        this.setupKeyboardShortcuts();
        
        this.onAction = actionCallback;

        // New chat buttons
        this.elements.newChatBtn.addEventListener('click', () => {
            if (this.onAction) {
                this.onAction('new_conversation', {});
            }
        });

        this.elements.welcomeNewChatBtn.addEventListener('click', () => {
            if (this.onAction) {
                this.onAction('new_conversation', {});
            }
        });

        // Message form
        this.elements.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const messageContent = this.elements.messageInput.value.trim();
            if (!messageContent) return;

            // Add optimistic message to UI
            this.addMessage({
                role: 'user',
                content: [{
                    type: 'text',
                    text: messageContent
                }]
            });

            // Clear input
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = 'auto';

            // Send to backend
            if (this.onAction) {
                this.onAction('send_message', { content: messageContent });
            }

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
            const settings: Settings = {
                model_config: {
                    model: formData.get('model') as string,
                    provider: 'anthropic'
                },
                temperature: parseFloat(formData.get('temperature') as string),
                max_tokens: parseInt(formData.get('max_tokens') as string),
                system_prompt: formData.get('system_prompt') as string,
                title: this.stateManager.getCurrentConversation()?.title || 'New Conversation',
                mcp_servers: []
            };

            if (this.onAction) {
                this.onAction('update_settings', { settings });
            }
            this.closeSettingsModal();
        });

        // Temperature range input
        this.elements.temperatureInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            this.elements.temperatureValue.textContent = target.value;
        });
    }

    // UI state management

    showWelcomeScreen(): void {
        this.elements.welcomeScreen.classList.remove('hidden');
        this.elements.conversationView.classList.add('hidden');
    }

    showConversationView(): void {
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.conversationView.classList.remove('hidden');

        const conversation = this.stateManager.getCurrentConversation();
        if (conversation) {
            this.elements.conversationTitle.textContent = conversation.title;
        }
    }

    showConnectionStatus(connected: boolean): void {
        // This could show a connection status indicator
        if (!connected) {
            this.showError('Connection Lost', 'Trying to reconnect...');
        }
    }

    showError(title: string, message: string): void {
        // Simple alert for now, could be replaced with a nice toast or modal
        alert(`${title}: ${message}`);
    }

    showLoadingMessage(): HTMLElement {
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

    removeLoadingMessage(): void {
        const loadingEl = this.elements.messagesContainer.querySelector('.loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    }

    // Settings modal

    openSettingsModal(): void {
        // Update form with current settings
        const settings = this.stateManager.getSettings();

        this.elements.modelSelect.value = settings.model_config.model;
        this.elements.temperatureInput.value = settings.temperature.toString();
        this.elements.temperatureValue.textContent = settings.temperature.toString();
        this.elements.maxTokensInput.value = settings.max_tokens.toString();
        this.elements.systemPromptInput.value = settings.system_prompt || '';

        // Show modal
        this.elements.settingsModal.classList.remove('hidden');
    }

    closeSettingsModal(): void {
        this.elements.settingsModal.classList.add('hidden');
    }

    // Settings display

    updateSettingsDisplay(settings: Settings): void {
        // This method would be called when settings are updated from the server
        // Could update UI elements or show a toast notification
        console.log('Settings updated:', settings);
    }

    // Conversation list

    updateConversationList(): void {
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
                if (this.onAction) {
                    this.onAction('select_conversation', { conversationId: id });
                }
            });

            conversationList.appendChild(li);
        });
    }

    // Messages display

    updateMessagesDisplay(messages: Message[]): void {
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

    addMessage(message: Message, scroll: boolean = true): void {
        // Remove loading indicator if present
        this.removeLoadingMessage();

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${message.role}`;

        // Format message content with Markdown (simple version)
        const messageContent = message.content.map(block => block.text).join('\n');
        const formattedContent = this.formatMessageContent(messageContent);

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

    formatMessageContent(content: string): string {
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

    formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
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

    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom(): void {
        const container = this.elements.messagesContainer;
        container.scrollTop = container.scrollHeight;
    }

    autoResizeTextarea(textarea: HTMLTextAreaElement): void {
        // Reset height to auto to get correct scrollHeight
        textarea.style.height = 'auto';

        // Set height to scrollHeight
        const newHeight = Math.min(textarea.scrollHeight, 150);
        textarea.style.height = `${newHeight}px`;
    }

    /**
     * Sets up the sidebar toggle functionality
     */
    private setupSidebarToggle(): void {
        const toggleBtn = this.elements.toggleSidebarBtn;
        const sidebar = document.querySelector('.sidebar') as HTMLElement;
        const app = document.querySelector('.app') as HTMLElement;
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                app.classList.toggle('sidebar-collapsed');
            });
        }
    }

    /**
     * Sets up keyboard shortcuts
     */
    private setupKeyboardShortcuts(): void {
        // "/" to focus the input field
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !this.isUserTyping()) {
                e.preventDefault();
                this.elements.messageInput.focus();
            }
        });

        // Ctrl+Enter to send message
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                
                if (this.elements.messageInput.value.trim()) {
                    // Get current values
                    const message = this.elements.messageInput.value;
                    const conversationId = this.stateManager.getCurrentConversationId();
                    
                    // Clear input immediately for better UX
                    this.elements.messageInput.value = '';
                    
                    // Trigger the message send
                    if (conversationId && this.onAction) {
                        this.onAction('send_message', { content: message });
                    }
                }
            }
        });
    }

    /**
     * Helper to check if user is already typing in an input field
     */
    private isUserTyping(): boolean {
        const activeEl = document.activeElement;
        return activeEl instanceof HTMLInputElement || 
               activeEl instanceof HTMLTextAreaElement || 
               activeEl?.getAttribute('contenteditable') === 'true';
    }
}
