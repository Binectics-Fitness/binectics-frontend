#!/bin/sh

# Ensure we're in the right directory
cd /home/site/wwwroot

# Set PORT with fallback
PORT=${PORT:-8080}

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

# Start the Next.js server directly with the PORT variable
echo "Starting Next.js server on port $PORT..."
./node_modules/.bin/next start -p $PORT
