/**
 * Type definitions for the Claude Chat frontend
 */

// WebSocket Message Types

export interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

// Conversation Types

export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count: number;
  last_message_preview?: string;
}

// Message Types

export type MessageRole = 'user' | 'assistant' | 'system';

export interface TextContentBlock {
  type: 'text';
  text: string;
}

export interface ToolUseContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

export interface ToolResultContentBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: TextContentBlock[];
  is_error: boolean | null;
}

export type ContentBlock = TextContentBlock | ToolUseContentBlock | ToolResultContentBlock;

export interface Message {
  id?: string;
  role: MessageRole;
  content: ContentBlock[];
  created_at?: number;
}

// Settings Types

export interface ModelConfig {
  model: string;
  provider: string;
}

export interface Settings {
  model_config: ModelConfig;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  title: string;
  mcp_servers: string[];
}

// Application State

export interface AppState {
  connected: boolean;
  currentConversationId: string | null;
  conversations: Record<string, Conversation>;
  messages: Message[];
  settings: Settings;
}

// Server Response Types

export interface ServerMessage {
  type: string;
  conversation_id?: string;
  content?: any;
  error?: string;
  message?: string;
  messages?: Message[];
  error_code?: string;
}

export interface ConversationCreatedMessage extends ServerMessage {
  type: 'conversation_created';
  conversation_id: string;
  message: string;
}

export interface MessageResponse extends ServerMessage {
  type: 'message';
  conversation_id: string;
  content: Message;
}

export interface ErrorMessage extends ServerMessage {
  type: 'error';
  conversation_id?: string;
  message: string;
  error_code: string;
}

export interface ConversationListMessage extends ServerMessage {
  type: 'conversation_list';
  conversations: Record<string, Conversation>;
}

export interface HistoryMessage extends ServerMessage {
  type: 'conversation';
  conversation_id: string;
  messages: Message[];
}

export interface SettingsMessage extends ServerMessage {
  type: 'settings';
  conversation_id: string;
  settings: Settings;
}

export interface MessagesResponse extends ServerMessage {
  type: 'messages';
  conversation_id: string;
  messages: Message[];
}

// UI Event Types

// Added toggle sidebar button to UI Elements
export interface UIElements {
    // Main UI sections
    welcomeScreen: HTMLElement;
    conversationView: HTMLElement;

    // Buttons
    newChatBtn: HTMLElement;
    welcomeNewChatBtn: HTMLElement;
    settingsBtn: HTMLElement;
    closeSettingsBtn: HTMLElement;
    sendBtn: HTMLElement;
    toggleSidebarBtn: HTMLElement;

    // Conversation elements
    conversationList: HTMLElement;
    conversationTitle: HTMLElement;
    messagesContainer: HTMLElement;
    messageForm: HTMLFormElement;
    messageInput: HTMLTextAreaElement;

    // Settings modal
    settingsModal: HTMLElement;
    settingsForm: HTMLFormElement;
    modelSelect: HTMLSelectElement;
    temperatureInput: HTMLInputElement;
    temperatureValue: HTMLElement;
    maxTokensInput: HTMLInputElement;
    systemPromptInput: HTMLTextAreaElement;
}

export interface UIEvent {
  action: string;
  data?: any;
}

export type UIEventCallback = (action: string, data: any) => void;

export interface UIElements {
  //HTMLTextAreaElement;
}

export interface MessageDisplayOptions {
  scroll?: boolean;
}
