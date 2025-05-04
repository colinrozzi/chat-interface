use genai_types::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "action")]
pub enum ClientMessage {
    /// Create a new conversation
    #[serde(rename = "new_conversation")]
    NewConversation,

    /// Send a message to the server
    #[serde(rename = "send_message")]
    SendMessage {
        conversation_id: String,
        message: Message,
    },

    /// List all conversations
    #[serde(rename = "list_conversations")]
    ListConversations,

    /// Get conversation history
    #[serde(rename = "get_history")]
    GetConversation { conversation_id: String },

    /// Update conversation settings
    #[serde(rename = "update_settings")]
    UpdateSettings {
        conversation_id: String,
        settings: ConversationSettings,
    },

    /// Get conversation settings
    #[serde(rename = "get_settings")]
    GetSettings { conversation_id: String },
}

/// Messages sent from server to clients
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ServerMessage {
    /// Welcome message for new connections
    #[serde(rename = "welcome")]
    Welcome {
        message: String,
        conversation_id: String,
    },

    /// Message indicating a new conversation has been created
    #[serde(rename = "conversation_created")]
    ConversationCreated {
        conversation_id: String,
        message: String,
    },

    #[serde(rename = "conversation")]
    Conversation {
        conversation_id: String,
        messages: Vec<Message>,
    },

    /// Error message with details
    #[serde(rename = "error")]
    Error {
        conversation_id: String,
        error_code: String,
        message: String,
    },

    /// General message with content
    #[serde(rename = "messages")]
    Messages {
        conversation_id: String,
        messages: Vec<Message>,
    },

    /// List of conversations
    #[serde(rename = "conversation_list")]
    ConversationList {
        conversations: HashMap<String, ConversationMetadata>,
    },

    /// Settings information
    #[serde(rename = "settings")]
    Settings {
        conversation_id: String,
        settings: ConversationSettings,
    },

    /// Settings updated confirmation
    #[serde(rename = "settings_updated")]
    SettingsUpdated {
        conversation_id: String,
        message: String,
    },

    #[serde(rename = "success")]
    Success,
}

/// Metadata about a conversation for UI display
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConversationMetadata {
    /// Unique identifier for this conversation
    pub id: String,

    /// Human-readable title for the conversation
    pub title: String,

    /// When the conversation was created (timestamp)
    pub created_at: u64,

    /// When the conversation was last updated (timestamp)
    pub updated_at: u64,

    /// Number of messages in the conversation
    pub message_count: u32,

    /// Preview of the last message (truncated)
    pub last_message_preview: Option<String>,
}

/// Message to create a new chat-state actor
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateConversationMessage {
    /// Unique ID for the new conversation
    pub conversation_id: String,

    /// Optional system prompt to set the behavior
    pub system_prompt: Option<String>,

    /// Model settings
    pub settings: Option<HashMap<String, serde_json::Value>>,
}

/// Conversation settings
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConversationSettings {
    /// Model to use (e.g., "claude-3-7-sonnet-20250219")
    pub model: String,

    /// Temperature setting (0.0 to 1.0)
    pub temperature: Option<f32>,

    /// Maximum tokens to generate
    pub max_tokens: Option<u32>,

    /// Any additional model parameters
    pub additional_params: Option<HashMap<String, serde_json::Value>>,

    /// System prompt to use
    pub system_prompt: Option<String>,

    /// Title of the conversation
    pub title: Option<String>,
}

/// Messages received by the chat-state actor
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ChatStateRequest {
    #[serde(rename = "add_message")]
    AddMessage { message: Message },
    #[serde(rename = "generate_completion")]
    GenerateCompletion,
    #[serde(rename = "get_settings")]
    GetSettings,
    #[serde(rename = "update_settings")]
    UpdateSettings { settings: ConversationSettings },
    #[serde(rename = "get_history")]
    GetHistory,
    #[serde(rename = "subscribe")]
    Subscribe { sub_id: String },
    #[serde(rename = "unsubscribe")]
    Unsubscribe { sub_id: String },
}

/// Data associated with the response
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ChatStateResponse {
    #[serde(rename = "success")]
    Success,

    #[serde(rename = "message")]
    Message { message: Message },

    #[serde(rename = "completion")]
    Completion { messages: Vec<Message> },

    #[serde(rename = "history")]
    History { messages: Vec<Message> },

    #[serde(rename = "settings")]
    Settings { settings: ConversationSettings },

    #[serde(rename = "error")]
    Error { error: ErrorInfo },
}

/// Error information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErrorInfo {
    /// Error code
    pub code: String,

    /// Human-readable error message
    pub message: String,

    /// Additional error details
    pub details: Option<HashMap<String, String>>,
}

// Helper functions to create common messages

/// Create a welcome message for new connections
pub fn create_welcome_message() -> ServerMessage {
    ServerMessage::Welcome {
        message: "Welcome to Claude Chat!".to_string(),
        conversation_id: "".to_string(),
    }
}

/// Create a conversation created message
pub fn create_conversation_created_message(conversation_id: &str) -> ServerMessage {
    ServerMessage::ConversationCreated {
        conversation_id: conversation_id.to_string(),
        message: "New conversation created".to_string(),
    }
}

/// Create an error message
pub fn create_error_message(
    conversation_id: &str,
    content: &str,
    error_code: &str,
) -> ServerMessage {
    ServerMessage::Error {
        conversation_id: conversation_id.to_string(),
        error_code: error_code.to_string(),
        message: content.to_string(),
    }
}

pub fn create_conversation_response(
    conversation_id: &str,
    messages: Vec<Message>,
) -> ServerMessage {
    ServerMessage::Conversation {
        conversation_id: conversation_id.to_string(),
        messages,
    }
}

/// Create a message response
pub fn create_messages_response(conversation_id: &str, messages: Vec<Message>) -> ServerMessage {
    ServerMessage::Messages {
        conversation_id: conversation_id.to_string(),
        messages,
    }
}

pub fn create_success_response() -> ServerMessage {
    ServerMessage::Success
}

/// Create a settings response
pub fn create_settings_response(
    conversation_id: &str,
    settings: ConversationSettings,
) -> ServerMessage {
    ServerMessage::Settings {
        conversation_id: conversation_id.to_string(),
        settings,
    }
}

/// Create a settings updated response
pub fn create_settings_updated_response(conversation_id: &str) -> ServerMessage {
    ServerMessage::SettingsUpdated {
        conversation_id: conversation_id.to_string(),
        message: "Settings updated successfully".to_string(),
    }
}
