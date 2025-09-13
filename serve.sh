#!/bin/bash

echo "📦 Installing npm dependencies..."
# Use -exec with sh -c to avoid PATH security warning
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/public/*" -exec sh -c 'cd "$(dirname "$1")" && npm install' _ {} \;

echo "🚀 Starting Hugo server..."
hugo serve