#!/bin/bash

echo "🚀 Starting Candidate Data Transformer..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    echo ""
fi

echo "✅ Dependencies installed!"
echo ""
echo "Starting services:"
echo "  - Backend API: http://localhost:3000"
echo "  - Frontend UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm run dev
