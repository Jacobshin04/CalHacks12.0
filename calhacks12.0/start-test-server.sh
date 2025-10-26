#!/bin/bash

echo "🚀 Starting Test Server..."
echo ""

# Navigate to example test repo
cd example-test-repo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🎯 Starting server on http://localhost:3001"
npm start

