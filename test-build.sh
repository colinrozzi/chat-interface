#!/bin/bash
# Test build script for the refactored JavaScript code

echo "Building refactored JavaScript code..."
cd assets
mkdir -p dist
npm run build
echo "Build complete!"
