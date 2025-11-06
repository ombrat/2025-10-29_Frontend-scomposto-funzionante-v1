#!/bin/bash

# 🚀 Setup completo Frontend + Backend Proxy
# Avvia sia il frontend React che il backend proxy FRED

echo "🚀 Starting Complete FRED Integration Setup"
echo "=========================================="

# Controlla se siamo nella root del progetto
if [ ! -f "package.json" ]; then
    echo "❌ Esegui questo script dalla root del progetto"
    exit 1
fi

# Funzione per cleanup su exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend server stopped"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend proxy stopped"
    fi
    exit 0
}

# Setup trap per cleanup
trap cleanup SIGINT SIGTERM

echo "1️⃣ Starting Backend Proxy Server..."
cd backend-proxy

# Installa dipendenze Python se necessario
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || true
pip3 install -r requirements.txt > /dev/null 2>&1

# Avvia backend proxy in background
echo "🏥 Starting FRED proxy backend on port 8000..."
python3 app.py &
BACKEND_PID=$!

# Aspetta che il backend sia pronto
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Test backend health
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend proxy is healthy"
else
    echo "❌ Backend proxy failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

echo ""
echo "2️⃣ Starting Frontend Development Server..."

# Installa dipendenze npm se necessario
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Avvia frontend in background
echo "🌐 Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

# Aspetta che il frontend sia pronto
echo "⏳ Waiting for frontend to be ready..."
sleep 5

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🌐 Frontend:       http://localhost:5173"
echo "🏥 Backend Proxy:  http://localhost:8000"
echo ""
echo "📊 Available Endpoints:"
echo "  - http://localhost:8000/health       - Backend health check"
echo "  - http://localhost:8000/api/fred/test - FRED connection test"
echo ""
echo "🔧 How to test:"
echo "  1. Go to http://localhost:5173"
echo "  2. Navigate to Analysis page"
echo "  3. Click '🏥 Test Proxy Backend'"
echo "  4. Click '🔄 Refresh FRED Data'"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================="

# Mantieni script attivo
wait