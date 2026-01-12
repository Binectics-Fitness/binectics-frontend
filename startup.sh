#!/bin/sh

# Ensure we're in the right directory
cd /home/site/wwwroot

# Install dependencies if node_modules is missing or incomplete
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
    echo "Installing dependencies..."
    npm ci --production=false
fi

# Build the app if .next doesn't exist
if [ ! -d ".next" ]; then
    echo "Building Next.js app..."
    npm run build
fi

# Start the Next.js server
echo "Starting Next.js server on port ${PORT:-8080}..."
npm start
