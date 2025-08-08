#!/bin/bash

# Quick-start script for testing Composio integration
# This script checks dependencies and runs the test

echo "🚀 Composio Email/Calendar Integration Test Runner"
echo "=================================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if TypeScript is configured
if [ ! -f "tsconfig.json" ]; then
    echo "⚙️ Creating TypeScript configuration..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF
    echo "✅ TypeScript configuration created"
    echo ""
fi

# Check for .env file
if [ -f ".env" ]; then
    # Check if API key is still placeholder
    if grep -q "your_composio_api_key_here" .env; then
        echo "⚠️  WARNING: Your .env file needs real Composio credentials!"
        echo ""
        echo "📝 To get started:"
        echo "   1. Go to https://app.composio.dev/settings"
        echo "   2. Sign up/login to get your API Key"
        echo "   3. Update the .env file with:"
        echo "      - COMPOSIO_API_KEY=<your-actual-api-key>"
        echo "      - COMPOSIO_ENTITY_ID=<your-entity-id>"
        echo ""
        echo "🔄 Running test anyway to show available features..."
        echo ""
    else
        echo "✅ .env file found with configuration"
        echo ""
    fi
else
    echo "❌ No .env file found! Creating template..."
    cat > .env << 'EOF'
# Composio Configuration
COMPOSIO_API_KEY=your_composio_api_key_here
COMPOSIO_ENTITY_ID=default
USER_ID=test-user

# Optional
COMPOSIO_BASE_URL=https://backend.composio.dev
LOG_LEVEL=info
EOF
    echo "📝 Created .env template - please add your Composio credentials"
    echo ""
fi

# Run the test
echo "🧪 Running integration test..."
echo "================================"
echo ""

# Use npx to run ts-node if it's not globally installed
if command -v ts-node &> /dev/null; then
    ts-node test-composio-integration.ts
else
    npx ts-node test-composio-integration.ts
fi

echo ""
echo "✨ Test run complete!"