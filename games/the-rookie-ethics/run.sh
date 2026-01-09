#!/bin/bash

# The Rookie: Ethics on the Beat - Run Script

echo "==================================="
echo "The Rookie: Ethics on the Beat"
echo "==================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    echo "Please install Node.js and npm first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Run the app
echo "Starting The Rookie: Ethics on the Beat..."
npm start
