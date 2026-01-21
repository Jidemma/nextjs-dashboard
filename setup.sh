#!/bin/bash

# NJEM Analytics Dashboard - Quick Setup Script
# ============================================

set -e

echo "🚀 NJEM Analytics Dashboard - Quick Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required (found v$NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) found${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "⚙️  Creating .env.local file..."
    cat > .env.local << 'EOF'
# Backend API base URL (FastAPI)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: polling interval (ms) for refresh actions
NEXT_PUBLIC_REFRESH_INTERVAL=30000
EOF
    echo -e "${GREEN}✅ .env.local created${NC}"
    echo -e "${YELLOW}⚠️  Update NEXT_PUBLIC_API_URL to point at your backend${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi
echo ""

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🎉 Your NJEM Analytics Dashboard is ready!"
echo ""
echo "To start the development server:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "To start the production server:"
echo -e "  ${YELLOW}npm start${NC}"
echo ""
echo "The dashboard will be available at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo ""
echo "📚 For more information, see:"
echo "  - README.md (full documentation)"
echo "  - SETUP_GUIDE.md (detailed setup guide)"
echo ""
echo -e "${GREEN}Happy analyzing! 📊${NC}"

