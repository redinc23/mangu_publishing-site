#!/usr/bin/env bash
# Quick start script for MANGU Publishing Platform

echo "🚀 Starting MANGU Publishing Platform..."

# Set environment variables
export DATABASE_URL="postgres://redinc23gmail.com@localhost:5432/mangu"
export DISABLE_REDIS=1
export NODE_ENV=development

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "node.*src/index.js" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true
sleep 2

# Start server in background
echo "Starting server..."
cd "$PROJECT_ROOT/server"
npm run dev > /tmp/mangu-server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait a moment for server to start
sleep 3

# Start client in background
echo "Starting client..."
cd "$PROJECT_ROOT/client"
npm run dev > /tmp/mangu-client.log 2>&1 &
CLIENT_PID=$!
echo "Client PID: $CLIENT_PID"

echo ""
echo "✅ MANGU Publishing Platform is starting!"
echo ""
echo "📊 Server: http://localhost:3001"
echo "   Health: http://localhost:3001/api/health"
echo "   Logs:   tail -f /tmp/mangu-server.log"
echo ""
echo "🎨 Client: http://localhost:5173"
echo "   Logs:   tail -f /tmp/mangu-client.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null || true
    wait $SERVER_PID $CLIENT_PID 2>/dev/null || true
    echo "✅ Stopped"
    exit 0
}

trap cleanup INT TERM

# Wait for user interrupt
wait


