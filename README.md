# Chat Interface Actor

A Theater HTTP server actor that serves as the central hub for user interactions in the Claude Chat system.

## Purpose

The `chat-interface` actor serves as the main entry point and coordinator for the chat application. It handles all user interactions, manages the web interface, and coordinates communication between users and their conversation actors.

## Core Responsibilities

1. **HTTP Server Management**
   - Serve static frontend assets (HTML, CSS, JavaScript)
   - Handle RESTful API requests
   - Manage WebSocket connections

2. **Connection Management**
   - Maintain active WebSocket connections
   - Track user sessions
   - Manage connection to conversation mapping

3. **Conversation Registry**
   - Maintain a registry of all conversations
   - Track conversation metadata (title, creation time, message count)
   - Map conversation IDs to their respective `chat-state` actor IDs

4. **Actor Lifecycle Management**
   - Create new `chat-state` actors for new conversations
   - Monitor the health of `chat-state` actors
   - Handle actor recovery if needed

5. **Message Routing**
   - Route messages from users to the appropriate `chat-state` actors
   - Return responses from `chat-state` actors to the correct users

## Building

To build the actor:

```bash
cargo build --target wasm32-unknown-unknown --release
```

## Running

To run the actor with Theater:

```bash
theater start manifest.toml
```

## API Endpoints

- GET / - Serves the main chat interface
- GET /api/conversations - Returns a list of available conversations
- GET /api/health - System health check endpoint
- WS /ws - WebSocket endpoint for real-time chat communication

## WebSocket Protocol

See the documentation for details on the WebSocket message format and supported actions.

## Implementation Notes

- This actor communicates with individual `chat-state` actors, each managing a single conversation
- Authentication and multi-user support will be added in future versions
- See the Theater logs for debugging information
