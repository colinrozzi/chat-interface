/**
 * UI-specific type definitions
 */

import { StateManager } from '../state';
import { UIEventCallback, Settings, Message } from './index';

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
