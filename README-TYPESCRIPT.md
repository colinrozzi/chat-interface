# TypeScript Integration for Chat Interface

This document describes the TypeScript integration for the Chat Interface project, including build process, development workflow, and best practices.

## Overview

TypeScript has been integrated into the frontend codebase to provide type safety, better developer experience, and enhanced code maintainability. The build process has been updated to include TypeScript type checking before building the application.

## Project Structure

```
assets/
├── dist/                  # Build output directory
├── src/
│   ├── index.ts           # Main entry point
│   ├── state.ts           # State management
│   ├── ui.ts              # UI management
│   ├── websocket.ts       # WebSocket communication
│   ├── message-handler.ts # Message handling
│   └── types/             # TypeScript type definitions
│       ├── index.ts       # Core types
│       └── ui.types.ts    # UI-specific types
├── package.json           # NPM package configuration
└── tsconfig.json          # TypeScript configuration
```

## Build Process

The Nix flake has been updated to integrate TypeScript type checking into the build process:

1. Install dependencies (including TypeScript)
2. Run type checking with `tsc --noEmit`
3. Bundle TypeScript with esbuild
4. Build the Rust backend with cargo-component

## Development Workflow

### Local Development

For local development:

```sh
# Start development environment
nix develop

# Install npm dependencies
cd assets
npm install

# Run type checking in watch mode
npm run typecheck -- --watch

# Start development server with watch mode
npm run dev
```

### Checking Types

Before committing changes, always run type checking:

```sh
cd assets
npm run typecheck
```

### Building the Project

To build the entire project with Nix:

```sh
nix build
```

Or use the test build script for quick frontend builds:

```sh
./test-build.sh
```

## Type System

### Core Types

The core types are defined in `assets/src/types/index.ts`:

- **WebSocketMessage**: Types for messages sent to the server
- **ServerMessage**: Types for messages received from the server
- **Conversation**: Conversation data structure
- **Message**: Message data structure
- **Settings**: Application settings

### UI Types

UI-specific types are defined in `assets/src/types/ui.types.ts`:

- **UIElements**: DOM elements used by the UI manager
- **UIEventCallback**: Callback function type for UI events

## Best Practices

### Writing Type-Safe Code

1. **Explicit types for function parameters and return values**:
   ```typescript
   function processMessage(message: Message): void {
     // Implementation
   }
   ```

2. **Interface for object structures**:
   ```typescript
   interface UserSettings {
     theme: 'light' | 'dark';
     fontSize: number;
     notifications: boolean;
   }
   ```

3. **Discriminated unions for message types**:
   ```typescript
   type ServerMessage = 
     | { type: 'conversation_created', conversation_id: string }
     | { type: 'error', message: string, code: string };
   ```

### Type Guards

Use type guards to narrow types:

```typescript
function isErrorMessage(message: ServerMessage): message is ErrorMessage {
  return message.message_type === 'error';
}

// Usage
if (isErrorMessage(message)) {
  // TypeScript knows message is ErrorMessage here
  console.error(message.error);
}
```

## CI/CD Integration

The Nix build process now includes TypeScript type checking. If type checking fails, the build will fail, preventing deployments with type errors.

## Troubleshooting

### Common Type Issues

1. **Property does not exist on type**: Make sure the property is defined in the interface or type.
2. **Type 'X' is not assignable to type 'Y'**: The types are incompatible, check if you need type casting or to modify the type definition.
3. **Cannot find module**: Check import paths and make sure the file exists.

### Build Issues

If the build fails with TypeScript errors:

1. Run `npm run typecheck` to see detailed error messages
2. Fix the type errors
3. Try building again

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive Book](https://basarat.gitbook.io/typescript/)
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig)
