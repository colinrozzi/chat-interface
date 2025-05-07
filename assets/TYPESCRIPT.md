# TypeScript Integration Guide

This guide explains how TypeScript has been integrated into the chat-interface frontend application.

## Overview

TypeScript adds static type checking to JavaScript, providing better code reliability, improved developer experience, and enhanced tools for refactoring and code navigation. This project now uses TypeScript to improve code quality and maintainability.

## Project Structure

The TypeScript implementation follows this structure:

```
src/
├── index.ts                # Main entry point
├── state.ts                # State management
├── ui.ts                   # UI management
├── websocket.ts            # WebSocket handling
├── message-handler.ts      # Message processing
└── types/                  # Type definitions
    ├── index.ts            # Core type definitions
    └── ui.types.ts         # UI-specific types
```

## Type Definitions

All shared types are defined in `src/types/index.ts`, including:

- WebSocket message types
- Conversation data types
- Message data types
- Application state types
- Settings types
- UI event types

UI-specific types are in `src/types/ui.types.ts`.

## Building and Development

The project uses ESBuild for bundling with TypeScript support:

- **Type checking**: `npm run typecheck`
- **Build for production**: `npm run build`
- **Development with watch mode**: `npm run dev`
- **Start development server**: `npm run serve`

## How to Work with TypeScript

### Adding New Types

When adding new features:

1. First define the types in the appropriate file in the `types` directory
2. Import and use these types in your implementation

### Best Practices

- Use interfaces for object types (e.g., `interface UserSettings { ... }`)
- Use type aliases for unions/complex types (e.g., `type MessageRole = 'user' | 'assistant'`)
- Add JSDoc comments to document complex types and functions

### Type Checking

Run `npm run typecheck` to check for type errors without building. This is also integrated into the build process.

## Converting Existing JavaScript

When converting more JavaScript files to TypeScript:

1. Rename the file from `.js` to `.ts`
2. Add appropriate type annotations
3. Fix any type errors that arise
4. Update imports in other files to reference the `.ts` file instead of `.js`

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
