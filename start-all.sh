#!/usr/bin/env bash
echo "Starting MANGU Development Environment..."

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load credentials if available
if [ -f "$PROJECT_ROOT/scripts/launch_credentials.sh" ]; then
    source "$PROJECT_ROOT/scripts/launch_credentials.sh"
fi

# Load server .env file (single source of truth)
if [ -f "$PROJECT_ROOT/server/.env" ]; then
    export $(cat "$PROJECT_ROOT/server/.env" | grep -v '^#' | xargs)
fi

# Start server in background
echo "Starting server on port ${PORT:-3001}..."
cd "$PROJECT_ROOT/server" && npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start Vite frontend
echo "Starting Vite frontend..."
cd "$PROJECT_ROOT/client" && npm run dev &
CLIENT_PID=$!

echo ""
echo "🚀 Development servers started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:${PORT:-3001}"
echo ""
echo "Press Ctrl+C to stop all servers"

# Cleanup on exit
trap "echo 'Stopping servers...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM
wait
