use anthropic_types::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Messages sent from clients to the server
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClientMessage {
    /// Action to perform: "new_conversation", "send_message", "list_conversations", etc.
    pub action: String,

    /// Target conversation ID (for actions that operate on a specific conversation)
    pub conversation_id: Option<String>,

    /// Message content (for send_message action)
    pub message: Option<String>,

    /// System prompt (for new_conversation action)
    pub system: Option<String>,

    /// Additional settings or parameters
    pub settings: Option<HashMap<String, serde_json::Value>>,
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

    /// Message containing the conversation history
    #[serde(rename = "history")]
    History {
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
    #[serde(rename = "message")]
    Message {
        conversation_id: String,
        message: Message,
        meta: Option<HashMap<String, String>>,
    },

    /// List of conversations
    #[serde(rename = "conversation_list")]
    ConversationList {
        conversations: HashMap<String, ConversationMetadata>,
    },
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
}

/// Messages received by the chat-state actor
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ChatStateRequest {
    #[serde(rename = "add_message")]
    AddMessage(Message),
    #[serde(rename = "generate_completion")]
    GenerateCompletion,
    #[serde(rename = "update_settings")]
    UpdateSettings(ConversationSettings),
    #[serde(rename = "update_system_prompt")]
    UpdateSystemPrompt(Option<String>),
    #[serde(rename = "update_title")]
    UpdateTitle(String),
    #[serde(rename = "get_history")]
    GetHistory,
    #[serde(rename = "subscribe")]
    Subscribe(String),
    #[serde(rename = "unsubscribe")]
    Unsubscribe(String),
}

/// Data associated with the response
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ChatStateResponse {
    #[serde(rename = "success")]
    Success,

    #[serde(rename = "message")]
    Message(Message),

    #[serde(rename = "history")]
    History(Vec<Message>),

    #[serde(rename = "settings")]
    Settings(ConversationSettings),

    #[serde(rename = "error")]
    Error(ErrorInfo),
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

/// Create a message response
pub fn create_message_response(
    conversation_id: &str,
    message: Message,
    meta: Option<HashMap<String, String>>,
) -> ServerMessage {
    ServerMessage::Message {
        conversation_id: conversation_id.to_string(),
        message,
        meta,
    }
}
