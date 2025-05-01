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
pub struct ServerMessage {
    /// Message type: "welcome", "conversation_created", "message", "error", etc.
    pub message_type: String,
    
    /// Conversation ID this message relates to
    pub conversation_id: String,
    
    /// Main message content
    pub content: String,
    
    /// Error code, if this is an error message
    pub error: Option<String>,
    
    /// Additional metadata
    pub meta: Option<HashMap<String, String>>,
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

/// Message to send to a chat-state actor
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatStateMessage {
    /// Action to perform: "send_message", "update_settings", "get_history", etc.
    pub action: String,
    
    /// Message content (for send_message action)
    pub message: Option<String>,
    
    /// Settings update (for update_settings action)
    pub settings: Option<HashMap<String, serde_json::Value>>,
    
    /// Parameters for history retrieval (for get_history action)
    pub history_params: Option<HistoryParams>,
}

/// Parameters for history retrieval
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HistoryParams {
    /// Maximum number of messages to return
    pub limit: Option<u32>,
    
    /// Return messages before this timestamp
    pub before_timestamp: Option<u64>,
}

/// Response from a chat-state actor
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatStateResponse {
    /// Response type: "message", "history", "settings_updated", "error", etc.
    pub response_type: String,
    
    /// Message content if this is a message response
    pub message: Option<ChatMessage>,
    
    /// Message history if this is a history response
    pub history: Option<Vec<ChatMessage>>,
    
    /// Error details if this is an error response
    pub error: Option<ErrorInfo>,
}

/// Chat message format
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatMessage {
    /// Unique message ID
    pub id: String,
    
    /// Message role: "user" or "assistant"
    pub role: String,
    
    /// Message content
    pub content: String,
    
    /// Message timestamp
    pub timestamp: u64,
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
    ServerMessage {
        message_type: "welcome".to_string(),
        conversation_id: "".to_string(),
        content: "Welcome to Claude Chat! You can start a new conversation or connect to an existing one.".to_string(),
        error: None,
        meta: None,
    }
}

/// Create a conversation created message
pub fn create_conversation_created_message(conversation_id: &str) -> ServerMessage {
    ServerMessage {
        message_type: "conversation_created".to_string(),
        conversation_id: conversation_id.to_string(),
        content: "New conversation created".to_string(),
        error: None,
        meta: None,
    }
}

/// Create an error message
pub fn create_error_message(
    conversation_id: &str,
    content: &str,
    error_code: &str,
) -> ServerMessage {
    ServerMessage {
        message_type: "error".to_string(),
        conversation_id: conversation_id.to_string(),
        content: content.to_string(),
        error: Some(error_code.to_string()),
        meta: None,
    }
}

/// Create a message response
pub fn create_message_response(
    conversation_id: &str,
    content: &str,
    meta: Option<HashMap<String, String>>,
) -> ServerMessage {
    ServerMessage {
        message_type: "message".to_string(),
        conversation_id: conversation_id.to_string(),
        content: content.to_string(),
        error: None,
        meta,
    }
}
