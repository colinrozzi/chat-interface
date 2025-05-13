use genai_types::Message;
use mcp_protocol::tool::Tool;
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

    /// Rename a conversation
    #[serde(rename = "rename_conversation")]
    RenameConversation {
        conversation_id: String,
        new_title: String,
    },

    /// Get message by ID for chain-based navigation
    #[serde(rename = "get_message_by_id")]
    GetMessageById {
        conversation_id: String,
        message_id: String,
    },

    /// Get the current head ID of the conversation chain
    #[serde(rename = "get_head_id")]
    GetHeadId { conversation_id: String },
}

/// Messages sent from server to clients
/// Chat Message from chat-state actor (includes chain information)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatMessage {
    pub id: Option<String>,
    pub parent_id: Option<String>,
    pub message: Message,
}

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

    /// Conversation renamed confirmation
    #[serde(rename = "conversation_renamed")]
    ConversationRenamed {
        conversation_id: String,
        title: String,
        message: String,
    },

    #[serde(rename = "success")]
    Success,

    /// Message by ID response (for chain-based navigation)
    #[serde(rename = "message_by_id")]
    MessageById {
        conversation_id: String,
        message: ChatMessage,
    },

    /// Head ID response (for chain-based navigation)
    #[serde(rename = "head_id")]
    HeadId {
        conversation_id: String,
        head_id: Option<String>,
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelConfig {
    pub model: String,
    pub provider: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConversationSettings {
    /// Model to use (e.g., "claude-3-7-sonnet-20250219")
    pub model_config: ModelConfig,

    /// Temperature setting (0.0 to 1.0)
    pub temperature: Option<f32>,

    /// Maximum tokens to generate
    pub max_tokens: u32,

    /// Any additional model parameters
    pub additional_params: Option<HashMap<String, serde_json::Value>>,

    /// System prompt to use
    pub system_prompt: Option<String>,

    /// Title of the conversation
    pub title: String,

    /// Mcp servers
    pub mcp_servers: Vec<McpServer>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct McpConfig {
    command: String,
    args: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct McpServer {
    pub actor_id: Option<String>,
    pub config: McpConfig,
    pub tools: Option<Vec<Tool>>,
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
    #[serde(rename = "get_head")]
    GetHead,
    #[serde(rename = "get_message")]
    GetMessage { message_id: String },
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
    History { messages: Vec<ChatMessage> },

    #[serde(rename = "settings")]
    Settings { settings: ConversationSettings },

    #[serde(rename = "error")]
    Error { error: ErrorInfo },

    #[serde(rename = "head")]
    Head { head: Option<String> },

    #[serde(rename = "chat_message")]
    ChatMessage { message: ChatMessage },
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

/// Create a message by ID response
pub fn create_message_by_id_response(conversation_id: &str, message: ChatMessage) -> ServerMessage {
    ServerMessage::MessageById {
        conversation_id: conversation_id.to_string(),
        message,
    }
}

/// Create a head ID response
pub fn create_head_id_response(conversation_id: &str, head_id: &Option<String>) -> ServerMessage {
    ServerMessage::HeadId {
        conversation_id: conversation_id.to_string(),
        head_id: head_id.clone(),
    }
}

/// Create a conversation renamed response
pub fn create_conversation_renamed_message(conversation_id: &str, title: &str) -> ServerMessage {
    ServerMessage::ConversationRenamed {
        conversation_id: conversation_id.to_string(),
        title: title.to_string(),
        message: format!("Conversation renamed to '{}'", title),
    }
}
