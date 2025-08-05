#!/bin/bash

echo "🚀 Starting Time Capsule Server..."
echo "📋 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔧 Environment check..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with the required environment variables."
    exit 1
fi

echo "✅ Starting server..."
echo "📱 Open http://localhost:3000/time-explorer.html in your browser"
echo "🔍 Health check: http://localhost:3000/api/health"
echo ""

npm start