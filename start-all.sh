#!/usr/bin/env bash
echo "Starting MANGU Development Environment..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start server in background
echo "Starting server..."
cd "$PROJECT_ROOT/server" && npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client
echo "Starting client..."
cd "$PROJECT_ROOT/client" && npm run dev &
CLIENT_PID=$!

echo ""
echo "🚀 Development servers started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $SERVER_PID $CLIENT_PID; exit" INT
wait

