#!/bin/bash

# Git GUI - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Git GUI development environment..."
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Please install Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm version
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build all packages
echo ""
echo "🔨 Building all packages..."
npm run build

# Initialize Husky
echo ""
echo "🪝 Setting up Git hooks..."
npx husky install

# Success message
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  - Run 'npm run dev:macos' to start the macOS app (macOS only)"
echo "  - Run 'npm run dev:windows' to start the Windows app (Windows only)"
echo "  - Run 'npm run dev:linux' to start the Linux app (Linux only)"
echo "  - Run 'npm run test' to run tests"
echo "  - Read docs/CONTRIBUTING.md for development guidelines"
echo ""
echo "Happy coding! 🎉"
