/**
 * UI Manager
 * Handles all UI interactions for the Claude Chat frontend
 */

import { StateManager } from './state';
import { UIElements, MessageDisplayOptions } from './types';
import { UIEventCallback, Message, Settings, ContentBlock } from './types';

export class UIManager {
    stateManager: StateManager;
    elements: UIElements;
    onAction: UIEventCallback | null;

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
            sidebarToggleBtn: document.getElementById('sidebar-toggle-btn') as HTMLElement,

            // Conversation elements
            conversationList: document.getElementById('conversation-list') as HTMLElement,
            conversationTitle: document.getElementById('conversation-title') as HTMLElement,
            messagesContainer: document.getElementById('messages-container') as HTMLElement,
            messageForm: document.getElementById('message-form') as HTMLFormElement,
            messageInput: document.getElementById('message-input') as HTMLTextAreaElement,

            // Settings panel
            settingsPanel: document.getElementById('settings-panel') as HTMLElement,
            settingsOverlay: document.getElementById('settings-overlay') as HTMLElement,
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
        `.replace(/\s+/g, ' ').trim();

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

        // Show settings panel and overlay
        this.elements.settingsPanel.classList.add('visible');
        this.elements.settingsOverlay.classList.add('visible');

        // Add class to main app for styling
        const app = document.querySelector('.app') as HTMLElement;
        app.classList.add('settings-open');
    }

    closeSettingsModal(): void {
        this.elements.settingsPanel.classList.remove('visible');
        this.elements.settingsOverlay.classList.remove('visible');

        // Remove class from main app
        const app = document.querySelector('.app') as HTMLElement;
        app.classList.remove('settings-open');
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
            `.replace(/\s+/g, ' ').trim();

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

    // Store for pending tool calls until matched with results
    pendingToolCalls: Map<string, HTMLElement> = new Map();

    addMessage(message: Message, scroll: boolean = true): void {
        // Remove loading indicator if present
        this.removeLoadingMessage();

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${message.role}`;
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content';
        messageEl.appendChild(contentWrapper);

        // Process each content block
        const toolBlocks: { type: string, element: HTMLElement, id?: string }[] = [];

        message.content.forEach(block => {
            if (block.type === 'text') {
                // Handle regular text content
                const textEl = document.createElement('div');
                textEl.innerHTML = this.formatMessageContent(block.text);
                contentWrapper.appendChild(textEl);
            }
            else if (block.type === 'tool_use') {
                // Create tool call element
                const toolPairEl = this.createToolPairElement(block.id, block.name, block.input);
                toolBlocks.push({ type: 'tool_use', element: toolPairEl, id: block.id });

                // Store in pending map for later pairing
                this.pendingToolCalls.set(block.id, toolPairEl);
                contentWrapper.appendChild(toolPairEl);
            }
            else if (block.type === 'tool_result') {
                // Try to find matching tool call
                if (this.pendingToolCalls.has(block.tool_use_id)) {
                    // Update existing tool pair with result
                    const toolPairEl = this.pendingToolCalls.get(block.tool_use_id)!;
                    this.updateToolPairWithResult(toolPairEl, block);
                    this.pendingToolCalls.delete(block.tool_use_id);

                    // Mark this block as processed (no need to add again)
                    toolBlocks.push({ type: 'tool_result', element: toolPairEl, id: block.tool_use_id });
                } else {
                    // If no matching tool call found, create standalone result
                    const standaloneResultEl = this.createStandaloneResultElement(block);
                    contentWrapper.appendChild(standaloneResultEl);
                    toolBlocks.push({ type: 'tool_result', element: standaloneResultEl });
                }
            }
        });

        this.elements.messagesContainer.appendChild(messageEl);

        // Set up event listeners for tool pair toggles
        toolBlocks.forEach(item => {
            if (item.type === 'tool_use' && item.element.classList.contains('tool-pair')) {
                this.setupToolPairToggle(item.element);
            }
        });

        if (scroll) {
            this.scrollToBottom();
        }
    }

    /**
     * Creates a collapsible tool pair element
     */
    createToolPairElement(id: string, name: string, input: any): HTMLElement {
        const toolPairEl = document.createElement('div');
        toolPairEl.className = 'tool-pair';
        toolPairEl.dataset.toolId = id;

        // Create preview text
        const inputStr = JSON.stringify(input);
        const preview = this.truncateText(inputStr, 40);

        // Create summary header (always visible)
        toolPairEl.innerHTML = `
            <div class="tool-summary">
                <div class="tool-info">
                    <span class="tool-name">${name}</span>
                    <span class="tool-preview">${preview}</span>
                </div>
                <div class="tool-indicators">
                    <span class="status-indicator pending"></span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            <div class="tool-details">
                <div class="tool-use">
                    <div class="tool-header">
                        Tool Call: ${name}
                        <button class="tool-copy-btn" data-content="input">Copy</button>
                    </div>
                    <div class="tool-body">
                        <pre>${JSON.stringify(input || {}, null, 2)}</pre>
                    </div>
                </div>
                <div class="tool-result">
                    <div class="tool-header">
                        Waiting for result...
                    </div>
                    <div class="tool-body">
                        <div class="loading-dots">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        `.replace(/\s+/g, ' ').trim();

        return toolPairEl;
    }

    /**
     * Updates a tool pair element with a result
     */
    updateToolPairWithResult(toolPairEl: HTMLElement, result: any): void {
        // Get result content
        let resultContent = '';
        if (result.content && Array.isArray(result.content)) {
            result.content.forEach((innerBlock: ContentBlock) => {
                if (innerBlock.type === 'text') {
                    resultContent += this.formatMessageContent(innerBlock.text);
                }
            });
        }

        // Update status indicator
        const statusIndicator = toolPairEl.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('pending');
            if (result.is_error) {
                statusIndicator.classList.add('error');
                toolPairEl.classList.add('error');
            } else {
                statusIndicator.classList.add('success');
            }
        }

        // Update tool result content
        const toolResultEl = toolPairEl.querySelector('.tool-result');
        if (toolResultEl) {
            if (result.is_error) {
                toolResultEl.classList.add('tool-result-error');
            }

            const headerEl = toolResultEl.querySelector('.tool-header');
            const bodyEl = toolResultEl.querySelector('.tool-body');

            if (headerEl && bodyEl) {
                const isLongContent = resultContent.length > 500;

                headerEl.innerHTML = `
                    <div>
                        <span>Result</span>
                        <button class="tool-copy-btn" data-content="result">Copy</button>
                    </div>
                    <span class="tool-collapse-toggle" title="Toggle content visibility">▼</span>
                `.replace(/\s+/g, ' ').trim();

                bodyEl.innerHTML = `<div>${resultContent}</div>`.replace(/\s+/g, ' ').trim();

                // Add collapsed class for long content
                if (isLongContent) {
                    bodyEl.classList.add('collapsed');

                    // Add toggle button
                    const toggleButton = document.createElement('div');
                    toggleButton.className = 'tool-toggle';
                    toggleButton.textContent = 'Show more';
                    toggleButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        bodyEl.classList.toggle('collapsed');
                        toggleButton.textContent = bodyEl.classList.contains('collapsed') ? 'Show more' : 'Show less';
                    });

                    // Add it after the body element
                    bodyEl.parentNode?.insertBefore(toggleButton, bodyEl.nextSibling);
                }

                // Add collapsible functionality
                const collapseToggle = headerEl.querySelector('.tool-collapse-toggle');
                if (collapseToggle) {
                    collapseToggle.addEventListener('click', () => {
                        const bodyHtmlEl = bodyEl as HTMLElement;
                        const isHidden = bodyHtmlEl.style.display === 'none';
                        bodyHtmlEl.style.display = isHidden ? 'block' : 'none';
                        collapseToggle.textContent = isHidden ? '▼' : '▶';

                        // Hide/show the toggle button as well
                        const toggleBtn = bodyEl.nextSibling as HTMLElement;
                        if (toggleBtn && toggleBtn.classList.contains('tool-toggle')) {
                            toggleBtn.style.display = isHidden ? 'block' : 'none';
                        }
                    });
                }
            }
        }

        // Auto-expand on error
        if (result.is_error) {
            toolPairEl.classList.add('expanded');
        }
    }

    /**
     * Creates a standalone result element (for cases where tool call is missing)
     */
    createStandaloneResultElement(result: any): HTMLElement {
        const resultEl = document.createElement('div');
        const errorClass = result.is_error ? ' tool-result-error' : '';

        // Get result content
        let resultContent = '';
        if (result.content && Array.isArray(result.content)) {
            result.content.forEach((innerBlock: ContentBlock) => {
                if (innerBlock.type === 'text') {
                    resultContent += this.formatMessageContent(innerBlock.text);
                }
            });
        }

        resultEl.className = `tool-result${errorClass}`;

        // Create a more interactive header with a toggle button
        const headerContent = `
            <div class="tool-header">
                <div>
                    <span class="tool-name">Tool Result (ID: ${result.tool_use_id.substring(0, 8)}...)</span>
                </div>
                <span class="tool-collapse-toggle" title="Toggle content visibility">▼</span>
            </div>
        `.replace(/\s+/g, ' ').trim();

        // Determine if we should collapse the content initially
        const isLongContent = resultContent.length > 500;
        const bodyClass = isLongContent ? 'tool-body collapsed' : 'tool-body';

        resultEl.innerHTML = `
            ${headerContent}
            <div class="${bodyClass}">${resultContent}</div>
        `.replace(/\s+/g, ' ').trim();

        // Add toggle button for long content
        if (isLongContent) {
            const toggleButton = document.createElement('div');
            toggleButton.className = 'tool-toggle';
            toggleButton.textContent = 'Show more';
            toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                const bodyEl = resultEl.querySelector('.tool-body');
                if (bodyEl) {
                    bodyEl.classList.toggle('collapsed');
                    toggleButton.textContent = bodyEl.classList.contains('collapsed') ? 'Show more' : 'Show less';
                }
            });

            resultEl.appendChild(toggleButton);
        }

        // Add collapsible functionality
        const collapseToggle = resultEl.querySelector('.tool-collapse-toggle');
        if (collapseToggle) {
            collapseToggle.addEventListener('click', () => {
                const bodyEl = resultEl.querySelector('.tool-body');
                if (bodyEl) {
                    const bodyHtmlEl = bodyEl as HTMLElement;
                    const isHidden = bodyHtmlEl.style.display === 'none';
                    bodyHtmlEl.style.display = isHidden ? 'block' : 'none';
                    collapseToggle.textContent = isHidden ? '▼' : '▶';

                    // Hide/show the toggle button as well
                    const toggleBtn = resultEl.querySelector('.tool-toggle') as HTMLElement;
                    if (toggleBtn) {
                        toggleBtn.style.display = isHidden ? 'block' : 'none';
                    }
                }
            });
        }

        return resultEl;
    }

    /**
     * Sets up click handler for tool pair toggle
     */
    setupToolPairToggle(element: HTMLElement): void {
        const summaryEl = element.querySelector('.tool-summary');
        if (summaryEl) {
            summaryEl.addEventListener('click', () => {
                element.classList.toggle('expanded');
            });
        }

        // Set up copy buttons
        const copyButtons = element.querySelectorAll('.tool-copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggle
                const contentType = (btn as HTMLElement).dataset.content;
                let textToCopy = '';

                if (contentType === 'input') {
                    const inputEl = element.querySelector('.tool-use pre');
                    if (inputEl) textToCopy = inputEl.textContent || '';
                } else if (contentType === 'result') {
                    const resultEl = element.querySelector('.tool-result .tool-body');
                    if (resultEl) textToCopy = resultEl.textContent || '';
                }

                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            const originalText = btn.textContent;
                            btn.textContent = 'Copied!';
                            setTimeout(() => {
                                btn.textContent = originalText;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy: ', err);
                        });
                }
            });
        });
    }

    /**
     * Helper to truncate text for previews
     */
    truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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
    setupSidebarToggle(): void {
        const toggleBtn = this.elements.sidebarToggleBtn;
        const app = document.querySelector('.app') as HTMLElement;

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                app.classList.toggle('sidebar-collapsed');

                // Save state to localStorage
                localStorage.setItem('sidebar-collapsed', app.classList.contains('sidebar-collapsed').toString());
            });
        }

        // Load initial state from localStorage
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed');
        if (sidebarCollapsed === 'true') {
            app.classList.add('sidebar-collapsed');
        }
    }

    /**
     * Sets up keyboard shortcuts
     */
    setupKeyboardShortcuts(): void {
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
    isUserTyping(): boolean {
        const activeEl = document.activeElement;
        return activeEl instanceof HTMLInputElement ||
            activeEl instanceof HTMLTextAreaElement ||
            activeEl?.getAttribute('contenteditable') === 'true';
    }
}
