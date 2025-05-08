# Chat Interface Actor

## Changes Made

The following changes have been made to fix the WebSocket message handling issues:

1. **Backend Changes**:
   - Added route handlers for `/bundle.js.map` and `/favicon.ico`
   - Added basic favicon.ico handling (transparent pixel)

2. **Frontend Changes**:
   - Updated message type field from `message_type` to `type` to match the backend
   - Updated message structure in type definitions to match the backend format
   - Added proper handling for all message types
   - Added a new handler for the 'messages' message type

## Build Instructions

After making these changes, you need to rebuild the frontend:

```bash
cd /Users/colinrozzi/work/actor-registry/chat-interface/assets
npm run build
```

This will compile the TypeScript files and bundle them with the updated message handling logic.

## Restart the Actor

After building the frontend, you'll need to stop and restart the chat-interface actor:

```bash
# First stop the current actor
theater stop ed2e20c8-c23b-4233-b159-e0ae61d0141d

# Then rebuild and start the actor
cd /Users/colinrozzi/work/actor-registry
theater start chat-interface/manifest.toml
```

## Testing

After restarting, test the following functionality:

1. WebSocket connection (check browser console for "WebSocket connected" message)
2. Creating a new conversation
3. Sending and receiving messages
4. Loading the source map (check that browser console doesn't show source map errors)

All message type errors should now be resolved.
