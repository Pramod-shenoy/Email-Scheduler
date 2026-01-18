#!/bin/bash

echo "🚀 Setting up Email Scheduler..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Start infrastructure
echo "📦 Starting Redis and PostgreSQL..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Install root dependencies
echo "📥 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Setting up database..."
npx prisma generate

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your actual values:"
    echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    echo "   - ETHEREAL_USER and ETHEREAL_PASS (get from https://ethereal.email/)"
    echo "   - JWT_SECRET (generate a secure random string)"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

cd ..

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
cd frontend
npm install

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
    echo "⚠️  Please update frontend/.env with your REACT_APP_GOOGLE_CLIENT_ID"
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your Google OAuth credentials"
echo "2. Update backend/.env with your Ethereal Email credentials"
echo "3. Update frontend/.env with your Google Client ID"
echo "4. Run 'npm run dev' to start both backend and frontend"
echo ""
echo "🔗 Useful links:"
echo "   - Google OAuth Setup: https://console.developers.google.com/"
echo "   - Ethereal Email: https://ethereal.email/"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:3000"
echo "   - Queue Dashboard: http://localhost:3001/admin/queues"