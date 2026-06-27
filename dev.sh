#!/usr/bin/env bash
# One-command dev startup for lupin-pre-onboarding.
# Place this file in the PROJECT ROOT (same level as /backend and /frontend),
# then run:  chmod +x dev.sh   (one time only)
# After that, just run:  ./dev.sh

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "Starting backend on :8000..."
cd "$PROJECT_ROOT/backend"
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting frontend on :3000..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

sleep 3
open http://localhost:3000 2>/dev/null

echo ""
echo "Backend docs:  http://localhost:8000/docs"
echo "Frontend app:  http://localhost:3000"
echo "Login: admin@lupin-hr.local / Admin@123"
echo ""
echo "Press Ctrl+C here to stop both servers."

wait
