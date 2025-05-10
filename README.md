# Chat Interface Actor Design Document

## Overview

The `chat-interface` actor serves as the central hub for user interactions in the Claude Chat system. It manages HTTP/WebSocket connections, serves the web frontend, and coordinates communications between users and their conversation actors.

## Architecture

```
User Browser <----> chat-interface <----> chat-state (multiple instances)
                         |
                         v
                    anthropic-proxy
```

## Core Responsibilities

### HTTP Server Management
- Serve static frontend assets (HTML, CSS, JavaScript)
- Handle RESTful API requests
- Manage WebSocket connections for real-time communication

### Connection Management
- Maintain active WebSocket connections
- Track user sessions and their active conversations
- Handle connection establishment, maintenance, and cleanup

### Conversation Registry
- Maintain a registry of all conversations
- Track conversation metadata (title, creation time, message count)
- Map conversation IDs to their respective `chat-state` actor IDs

### Actor Lifecycle Management
- Create new `chat-state` actors for new conversations
- Monitor the health of `chat-state` actors
- Handle actor recovery if needed

### Message Routing
- Route messages from users to the appropriate `chat-state` actors
- Return responses from `chat-state` actors to the correct users

## State Structure

```rust
struct InterfaceState {
    // Active WebSocket connections
    connections: HashMap<u64, ConnectionInfo>,
    
    // Mapping of conversation IDs to actor IDs
    conversation_actors: HashMap<String, String>,
    
    // Conversation metadata for UI display
    conversation_metadata: HashMap<String, ConversationMetadata>,
    
    // Server configuration
    server_config: ServerConfig,
}

struct ConnectionInfo {
    connection_id: u64,
    active_conversation_id: Option<String>,
    connected_at: u64,
    last_activity: u64,
}

struct ConversationMetadata {
    id: String,
    title: String,
    created_at: u64,
    updated_at: u64,
    message_count: u32,
    last_message_preview: Option<String>,
}

struct ServerConfig {
    port: u16,
    host: String,
    max_connections: u32,
}
```

## API Interface

### HTTP Endpoints

- `GET /` - Serve the main application
- `GET /index.html` - Alias for main application
- `GET /styles.css` - Serve application CSS
- `GET /bundle.js` - Serve application JavaScript
- `GET /api/conversations` - List available conversations
- `GET /api/conversations/:id/metadata` - Get conversation metadata
- `GET /api/health` - System health check

### WebSocket Protocol

#### WebSocket Endpoint
- `WS /ws` - WebSocket endpoint for real-time communication

#### Client → Server Messages

```json
{
  "action": "new_conversation",
  "system": "Optional system prompt"
}
```

```json
{
  "action": "send_message",
  "conversation_id": "conv-1234567890",
  "message": "User message content"
}
```

```json
{
  "action": "list_conversations"
}
```

#### Server → Client Messages

```json
{
  "message_type": "conversation_created",
  "conversation_id": "conv-1234567890",
  "content": "New conversation created"
}
```

```json
{
  "message_type": "message",
  "conversation_id": "conv-1234567890",
  "content": "Assistant response content"
}
```

```json
{
  "message_type": "error",
  "conversation_id": "conv-1234567890",
  "content": "Error description",
  "error": "ERROR_CODE"
}
```

## Interaction Flows

### New Conversation Flow

1. Receive "new_conversation" action from client
2. Generate a unique conversation ID
3. Spawn a new `chat-state` actor with initial parameters
4. Save the actor ID and conversation ID mapping
5. Create basic metadata for the conversation
6. Send confirmation to the client with the conversation ID

### Message Flow

1. Receive "send_message" action from client with conversation ID
2. Look up the corresponding `chat-state` actor ID
3. Forward the message to the `chat-state` actor
4. Receive response from the `chat-state` actor
5. Update the conversation metadata (message count, timestamps)
6. Forward the response to the client

### Conversation Listing Flow

1. Receive "list_conversations" action from client
2. Compile metadata from the `conversation_metadata` map
3. Return the list to the client

## Error Handling

### Connection Issues
- Handle WebSocket disconnections gracefully
- Allow reconnection and session resumption
- Clean up abandoned connections after timeout

### Actor Failures
- Detect when a `chat-state` actor becomes unresponsive
- Attempt to restart failed actors
- Provide appropriate error messages to users

### Resource Limitations
- Implement connection limits and throttling if needed
- Queue messages during high load scenarios

## Future Extensions

### Authentication
- Add user accounts and login functionality
- Implement session management
- Support for user-specific conversation storage

### Enhanced Metadata
- Conversation tagging and categorization
- Search functionality across conversations
- Conversation star/favorite capability

### Multi-User Features
- Conversation sharing
- Collaborative chat sessions
- User permissions and access controls

### Admin Interface
- System monitoring dashboard
- Usage statistics and reporting
- User and conversation management

## Implementation Notes

- Use the Theater actor model for efficient message passing
- WebSocket handling should prioritize reliability
- State should be periodically persisted to prevent data loss
- Implement clear logging for diagnostics and debugging
- Design with horizontal scaling in mind for future growth
