/**
 * State Manager
 * Manages the application state for the Claude Chat frontend
 */

import { 
    AppState, 
    Conversation, 
    Message, 
    Settings 
} from './types';

export class StateManager {
    private state: AppState;

    constructor() {
        this.state = {
            // WebSocket connection status
            connected: false,
            
            // Current conversation
            currentConversationId: null,
            
            // Map of conversation IDs to conversation objects
            conversations: {},
            
            // Current conversation messages
            messages: [],
            
            // Default settings
            settings: {
                model_config: {
                    model: 'claude-3-7-sonnet-20250219',
                    provider: 'anthropic'
                },
                temperature: 0.7,
                max_tokens: 1024,
                system_prompt: 'You are Claude, a helpful AI assistant created by Anthropic.',
                title: 'New Conversation',
                mcp_servers: []
            }
        };
    }
    
    // Connection state
    
    setConnected(connected: boolean): StateManager {
        this.state.connected = connected;
        return this;
    }
    
    isConnected(): boolean {
        return this.state.connected;
    }
    
    // Conversation management
    
    setCurrentConversationId(conversationId: string | null): StateManager {
        this.state.currentConversationId = conversationId;
        return this;
    }
    
    getCurrentConversationId(): string | null {
        return this.state.currentConversationId;
    }
    
    getCurrentConversation(): Conversation | null {
        const id = this.getCurrentConversationId();
        return id ? this.state.conversations[id] : null;
    }
    
    setConversations(conversations: Record<string, Conversation>): StateManager {
        this.state.conversations = conversations;
        return this;
    }
    
    getConversations(): Record<string, Conversation> {
        return this.state.conversations;
    }
    
    addConversation(conversation: Conversation): StateManager {
        this.state.conversations[conversation.id] = conversation;
        return this;
    }
    
    // Message management
    
    setMessages(messages: Message[]): StateManager {
        this.state.messages = messages;
        return this;
    }
    
    getMessages(): Message[] {
        return this.state.messages;
    }
    
    addMessage(message: Message): StateManager {
        this.state.messages.push(message);
        return this;
    }
    
    // Settings management
    
    setSettings(settings: Settings): StateManager {
        this.state.settings = settings;
        return this;
    }
    
    getSettings(): Settings {
        return this.state.settings;
    }
}
