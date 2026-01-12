#!/bin/sh

# Set working directory (Azure uses /home/site/wwwroot, local uses current dir)
WORKDIR="${WORKDIR:-$(pwd)}"
cd "$WORKDIR"

# Set PORT with fallback
PORT=${PORT:-8080}

# Install dependencies only if next command is not available
# Azure Oryx pre-installs dependencies and adds them to PATH
if ! command -v next >/dev/null 2>&1; then
    echo "Installing dependencies..."
    npm ci
else
    echo "Dependencies already installed (skipping npm ci for faster startup)"
fi

# Build the app if .next doesn't exist
if [ ! -d ".next" ]; then
    echo "Building Next.js app..."
    npm run build
fi

# Start the Next.js server (next is in PATH on Azure, or in local node_modules/.bin)
echo "Starting Next.js server on port $PORT..."
next start -p $PORT
