# Claude Chat Frontend

This directory contains the frontend code for the Claude Chat application, which communicates with the chat-interface Theater actor via WebSockets.

## Structure

The frontend is organized into several modular JavaScript files:

- `index.js` - The main entry point that initializes the application
- `state.js` - Manages application state
- `ui.js` - Manages UI interactions and DOM updates
- `websocket.js` - Handles WebSocket communication with the backend
- `message-handler.js` - Processes incoming messages from the backend

## Build Process

The frontend is built using esbuild, which bundles the JavaScript files into `dist/bundle.js`. This process is automatically handled in the Nix flake.

To manually bundle the JavaScript files:

```bash
esbuild assets/src/index.js --bundle --minify --sourcemap --outfile=assets/dist/bundle.js
```

## Development

To modify the frontend:

1. Edit the files in the `src` directory
2. Build the project using the provided Nix flake:

```bash
nix build
```

Or run in development mode:

```bash
nix develop
```

## Communication Protocol

The frontend communicates with the backend using WebSockets. The protocol is defined in the `protocol.rs` file in the actor's source code. Here's a summary of the key message types:

### Client → Server Messages

- `new_conversation` - Create a new conversation
- `send_message` - Send a message to a conversation
- `list_conversations` - Get a list of all conversations
- `get_history` - Get the message history for a conversation
- `get_settings` - Get the settings for a conversation
- `update_settings` - Update conversation settings

### Server → Client Messages

- `conversation_created` - Confirmation of new conversation creation
- `conversation_list` - List of available conversations
- `messages` - Updated messages for a conversation
- `conversation` - Full conversation history
- `settings` - Conversation settings
- `error` - Error messages from the server

## Architecture

The frontend follows a modular architecture:

1. **State Management**:
   - The `StateManager` class maintains the application state
   - Includes conversations, messages, settings, and connection status

2. **UI Management**:
   - The `UIManager` class handles DOM interactions
   - Updates UI based on state changes
   - Dispatches user actions to appropriate handlers

3. **WebSocket Communication**:
   - The `WebSocketManager` class maintains the WebSocket connection
   - Handles connection lifecycle (connect, disconnect, reconnect)
   - Serializes and sends messages to the backend

4. **Message Handling**:
   - The `MessageHandler` class processes incoming server messages
   - Updates state based on message content
   - Triggers UI updates as needed

## Styling

Styles are defined in `styles.css` and follow these conventions:

- CSS custom properties for theming
- Flexbox-based layout
- Mobile-responsive design with breakpoints
- BEM-inspired class naming convention

## Browser Compatibility

The frontend is designed to work with modern browsers that support:

- ES6+ JavaScript
- WebSocket API
- Flexbox layout
- CSS custom properties

## Future Improvements

Potential enhancements for the frontend:

- Add proper markdown rendering for messages
- Implement conversation search functionality
- Add support for file uploads and attachments
- Implement more advanced UI components (tabs, drawers, etc.)
- Add keyboard shortcuts for common actions
- Implement a service worker for offline capability
- Add analytics and telemetry
