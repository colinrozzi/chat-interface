# Chat Interface Frontend

This directory contains the frontend code for the Claude Chat Interface.

## Directory Structure

The frontend code is organized using a modular structure:

```
src/
├── app.js              # Main application initialization and setup
├── index.js            # Entry point
├── components/         # UI components
│   ├── ChatWindow.js   # Displays chat messages
│   ├── ConversationList.js  # Manages conversation history list
│   ├── MessageComposer.js   # Message input and sending
│   └── Settings.js     # Settings panel
├── services/           # Core services
│   ├── websocket.js    # WebSocket connection management
│   └── messageProtocol.js   # Message formatting and parsing
├── store/              # State management
│   ├── index.js        # Central store initialization
│   ├── conversations.js  # Conversation state
│   ├── messages.js     # Message state
│   ├── settings.js     # Settings state
│   └── ui.js           # UI state
└── utils/              # Utility functions
    ├── api.js          # HTTP API client
    ├── formatting.js   # Text and date formatting
    └── storage.js      # LocalStorage interaction
```

## Build Process

The frontend build process uses esbuild to bundle the JavaScript code:

```bash
esbuild src/index.js \
  --bundle \
  --minify \
  --sourcemap \
  --outfile=dist/bundle.js \
  --target=es2020 \
  --format=esm \
  --platform=browser
```

## Architecture Overview

- **Modular Design**: The codebase is split into focused components, each with a single responsibility
- **Store-Based State Management**: State is managed in stores (conversations, messages, settings, UI)
- **Event-Based Communication**: Components communicate via event handlers and callbacks
- **WebSocket Protocol**: Real-time communication with the backend

## Key Features

- Real-time messaging with Claude
- Conversation history management
- Settings customization for each conversation
- Responsive design for desktop and mobile devices
- Dark mode support
- Markdown message formatting

## Adding a New Component

To add a new component:

1. Create a new file in the appropriate directory
2. Export an initialization function that accepts DOM elements
3. Connect to the necessary stores
4. Register event handlers
5. Import and initialize the component in app.js

## State Management

The application uses a simple store pattern for state management:

- Each store manages a specific domain (conversations, messages, etc.)
- Components register callbacks for state changes
- Stores notify registered components when state changes
- Central store coordinates cross-domain state updates

## WebSocket Protocol

The WebSocket communication follows the protocol defined in the backend's `protocol.rs` file, with message types including:

- `new_conversation`: Create a new conversation
- `send_message`: Send a message to Claude
- `list_conversations`: Get the list of conversations
- `get_history`: Get message history for a conversation
- `get_settings`/`update_settings`: Get or update conversation settings

For more details on the protocol, see the backend's `protocol.rs` file.
