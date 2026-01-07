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
# MongoDB Configuration
MONGODB_URI=mongodb://njem360user:mongodb52-kg-02-A@95.216.8.140:40774/njemdb?authMechanism=SCRAM-SHA-256&authSource=admin
MONGODB_DB=njemdb

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=NJEM Analytics Dashboard
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Optional: Enable real-time updates (polling interval in ms)
NEXT_PUBLIC_REFRESH_INTERVAL=30000

# Optional: Enable debug mode
DEBUG_MODE=false
EOF
    echo -e "${GREEN}✅ .env.local created${NC}"
    echo -e "${YELLOW}⚠️  Please review and update MongoDB credentials in .env.local${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi
echo ""

# Test MongoDB connection
echo "🔌 Testing MongoDB connection..."
node << 'EOF'
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('\x1b[31m❌ MONGODB_URI not found in .env.local\x1b[0m');
    process.exit(1);
  }
  
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  
  try {
    await client.connect();
    console.log('\x1b[32m✅ MongoDB connection successful!\x1b[0m');
    
    const db = client.db(process.env.MONGODB_DB);
    const collections = await db.listCollections().toArray();
    console.log(`\x1b[32m✅ Found ${collections.length} collections\x1b[0m`);
    
  } catch (error) {
    console.error('\x1b[31m❌ MongoDB connection failed:', error.message, '\x1b[0m');
    console.error('\x1b[33m⚠️  Please check your MongoDB URI in .env.local\x1b[0m');
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  MongoDB connection test failed${NC}"
    echo "Please check your credentials in .env.local and try again"
    echo ""
    exit 1
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

