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

export interface ContentBlock {
  type: string;
  text: string;
}

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
  message_type: string;
  conversation_id?: string;
  content?: any;
  error?: string;
}

export interface ConversationCreatedMessage extends ServerMessage {
  message_type: 'conversation_created';
  conversation_id: string;
  content: string;
}

export interface MessageResponse extends ServerMessage {
  message_type: 'message';
  conversation_id: string;
  content: Message;
}

export interface ErrorMessage extends ServerMessage {
  message_type: 'error';
  conversation_id?: string;
  content: string;
  error: string;
}

export interface ConversationListMessage extends ServerMessage {
  message_type: 'conversation_list';
  content: Conversation[];
}

export interface HistoryMessage extends ServerMessage {
  message_type: 'history';
  conversation_id: string;
  content: Message[];
}

export interface SettingsMessage extends ServerMessage {
  message_type: 'settings';
  conversation_id: string;
  content: Settings;
}

// UI Event Types

export interface UIEvent {
  action: string;
  data?: any;
}

export type UIEventCallback = (action: string, data: any) => void;

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

export interface MessageDisplayOptions {
  scroll?: boolean;
}
