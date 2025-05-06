use crate::protocol::ConversationMetadata;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Main state structure for the chat-interface actor
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InterfaceState {
    /// Map of user connections to their active conversation IDs
    pub connections: HashMap<u64, ConnectionInfo>,

    /// Map of conversation IDs to chat-state actor IDs
    pub conversation_actors: HashMap<String, String>,

    /// Minimal metadata about conversations for UI display
    pub conversation_metadata: HashMap<String, ConversationMetadata>,

    /// Server configuration
    pub server_config: ServerConfig,

    /// Store ID for the chat interface
    pub store_id: String,
}

/// Information about a websocket connection
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConnectionInfo {
    /// Unique identifier for this connection
    pub connection_id: u64,

    /// Currently active conversation for this connection, if any
    pub active_conversation_id: Option<String>,

    /// When the connection was established (timestamp)
    pub connected_at: u64,

    /// When the connection was last active (timestamp)
    pub last_activity: u64,
}

/// Configuration for the HTTP server
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ServerConfig {
    /// Port to listen on
    pub port: u16,

    /// Host address to bind to
    pub host: String,

    /// Maximum number of connections to allow
    pub max_connections: u32,
}

/// Initialize a new state with default values
pub fn initialize_state(store_id: &str) -> InterfaceState {
    InterfaceState {
        connections: HashMap::new(),
        conversation_actors: HashMap::new(),
        conversation_metadata: HashMap::new(),
        store_id: store_id.to_string(),
        server_config: ServerConfig {
            port: 8080,
            host: "0.0.0.0".to_string(),
            max_connections: 1000,
        },
    }
}

/// Add a new connection to the state
pub fn add_connection(state: &mut InterfaceState, connection_id: u64, timestamp: u64) {
    state.connections.insert(
        connection_id,
        ConnectionInfo {
            connection_id,
            active_conversation_id: None,
            connected_at: timestamp,
            last_activity: timestamp,
        },
    );
}

/// Remove a connection from the state
pub fn remove_connection(state: &mut InterfaceState, connection_id: u64) -> bool {
    state.connections.remove(&connection_id).is_some()
}

/// Associate a connection with a conversation
pub fn set_active_conversation(
    state: &mut InterfaceState,
    connection_id: u64,
    conversation_id: String,
    timestamp: u64,
) -> bool {
    if let Some(conn) = state.connections.get_mut(&connection_id) {
        conn.active_conversation_id = Some(conversation_id);
        conn.last_activity = timestamp;
        true
    } else {
        false
    }
}

/// Register a new chat-state actor in the registry
pub fn register_conversation_actor(
    state: &mut InterfaceState,
    conversation_id: String,
    actor_id: String,
    title: String,
    timestamp: u64,
) {
    // Save the actor ID
    state
        .conversation_actors
        .insert(conversation_id.clone(), actor_id);

    // Create metadata entry
    state.conversation_metadata.insert(
        conversation_id.clone(),
        ConversationMetadata {
            id: conversation_id,
            title,
            created_at: timestamp,
            updated_at: timestamp,
            message_count: 0,
            last_message_preview: None,
        },
    );
}

/// Update conversation metadata
pub fn update_conversation_metadata(
    state: &mut InterfaceState,
    conversation_id: &str,
    message_count: Option<u32>,
    last_message: Option<String>,
    timestamp: u64,
) -> bool {
    if let Some(metadata) = state.conversation_metadata.get_mut(conversation_id) {
        if let Some(count) = message_count {
            metadata.message_count = count;
        }

        if let Some(message) = last_message {
            // Truncate message for preview
            let preview = if message.len() > 50 {
                format!("{}...", &message[0..47])
            } else {
                message
            };
            metadata.last_message_preview = Some(preview);
        }

        metadata.updated_at = timestamp;
        true
    } else {
        false
    }
}

/// Get the actor ID for a conversation
pub fn get_actor_id_for_conversation(
    state: &InterfaceState,
    conversation_id: &str,
) -> Option<String> {
    state.conversation_actors.get(conversation_id).cloned()
}

/// Get the active conversation for a connection
pub fn get_active_conversation(state: &InterfaceState, connection_id: u64) -> Option<String> {
    state
        .connections
        .get(&connection_id)
        .and_then(|conn| conn.active_conversation_id.clone())
}
