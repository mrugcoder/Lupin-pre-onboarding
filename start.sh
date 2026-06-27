#!/bin/bash

# Lupin Pre-Onboarding — One-command startup script
# Usage: ./start.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🔄 Killing any existing processes on ports 3000 and 8000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :8000 | xargs kill -9 2>/dev/null
sleep 1

echo "🚀 Starting FastAPI backend on port 8000..."
osascript -e "tell application \"Terminal\" to do script \"cd $ROOT/backend && source .venv/bin/activate && uvicorn app.main:app --reload --reload-exclude '**/.venv/**' --port 8000\""

sleep 1

echo "🚀 Starting Next.js frontend on port 3000..."
osascript -e "tell application \"Terminal\" to do script \"cd $ROOT/frontend && npm run dev\""

echo ""
echo "✅ Both servers starting in new Terminal windows!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
