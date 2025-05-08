# Changelog for Chat Interface Actor

## [1.0.1] - 2025-05-08

### Fixed

#### Backend Changes:
- Added route registration for `/bundle.js.map` to fix source map 404 error
- Added route registration for `/favicon.ico` to prevent browser favicon 404 error
- Implemented a simple transparent favicon handler to respond to favicon requests

#### Frontend Changes:
- Fixed message type field mismatch:
  - Changed `message_type` to `type` in ServerMessage interface and all references
  - Updated message handler to use `message.type` instead of `message.message_type`
- Updated message structure to match backend format:
  - Modified `ConversationListMessage` to use `conversations` instead of `content`
  - Modified `HistoryMessage` (now type 'conversation') to use `messages` array
  - Modified `SettingsMessage` to use `settings` instead of `content`
  - Modified `ErrorMessage` to use `error_code` and `message` properties
- Added proper type definitions:
  - Created `MessagesResponse` interface for the 'messages' message type
  - Added `messages` property to the `ServerMessage` interface
  - Enhanced type safety with proper type casting and checks
- Fixed TypeScript compilation errors:
  - Fixed property references and added missing properties
  - Improved type handling for message handlers

### Documentation
- Added comprehensive README with description of changes
- Added debugging guide for verifying fixes
- Added changelog to track modifications

## [1.0.0] - 2025-05-07

### Initial Release
- Basic WebSocket-based chat interface
- Conversation management
- Settings configuration
- Real-time message updates
