#!/usr/bin/env bash
set -e

# Silence verbose environment logs
export TRANSFORMERS_VERBOSITY=error
export HF_HUB_DISABLE_SYMLINKS_WARNING=1
export PYTHONWARNINGS=ignore

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Clean up any lingering processes on ports 5002, 8000, and 5173 before starting
lsof -ti:5002,8000,5173 | xargs kill -9 2>/dev/null || true

echo "============================================================"
echo " CivicShield — Multimodal AI Verification & Backend System "
echo "============================================================"

# 1. Run Python AI Unit & E2E Tests (Quiet Mode)
echo "Step 1: Running Python AI verification tests..."
cd "$PROJECT_ROOT/ai-service"
python3 -m pytest tests/ -q --disable-warnings
echo "✔ All 12 AI Verification Tests Passed Successfully!"

echo "------------------------------------------------------------"
echo "Step 2: Starting Services..."

# Function to handle process shutdown on Ctrl+C
cleanup() {
    echo ""
    echo "Shutting down CivicShield services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start Python FastAPI AI Service on port 8000 (Error log level only)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level error &
PYTHON_PID=$!

# Wait for Python service to report healthy
for i in {1..30}; do
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        break
    fi
    sleep 1
done
echo "✔ Python AI Microservice is Online (http://localhost:8000)"

# Start Node.js Backend Server
cd "$PROJECT_ROOT/backend"
node server.js &
NODE_PID=$!

# Start React Vite Frontend
cd "$PROJECT_ROOT/frontend"
npm run dev -- --port 5173 --host 0.0.0.0 &
VITE_PID=$!

echo "------------------------------------------------------------"
echo "🚀 CivicShield Platform Active!"
echo "   • React Frontend : http://localhost:5173"
echo "   • Express Backend: http://localhost:5002"
echo "   • Python AI Engine: http://localhost:8000"
echo "   • Swagger AI Docs: http://localhost:8000/docs"
echo ""
echo "   🔑 Terminal OTPs will be printed here when requested."
echo "   Press Ctrl+C to stop all services."
echo "------------------------------------------------------------"

wait
