#!/bin/bash
# Test build script for the TypeScript frontend code

echo "Building TypeScript frontend code..."
cd assets

# Ensure dist directory exists
mkdir -p dist

# Run TypeScript type checking
echo "Running TypeScript type checking..."
npm run typecheck

# If type checking fails, exit with error
if [ $? -ne 0 ]; then
  echo "TypeScript type checking failed! Please fix the errors before building."
  exit 1
fi

# Build the project
echo "Building project..."
npm run build

echo "Build complete!"
