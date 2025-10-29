#!/usr/bin/env bash
echo "Starting MANGU Development Environment..."

# Start server in background
echo "Starting server..."
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client
echo "Starting client..."
cd ../client && npm run dev &
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

