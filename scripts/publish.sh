#!/bin/bash

# HyperHTTP Publish Script
# This script publishes all packages to NPM

set -e

echo "🚀 Starting HyperHTTP publish process..."

# Check if user is logged in to NPM
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Please login to NPM first: npm login"
    exit 1
fi

echo "✅ NPM authentication verified"

# Build all packages
echo "📦 Building all packages..."
pnpm build

# Publish packages in dependency order
echo "📤 Publishing packages..."

echo "1️⃣ Publishing @hyperhttp/core..."
cd packages/core
npm publish
echo "✅ @hyperhttp/core published successfully"

echo "2️⃣ Publishing @hyperhttp/plugins..."
cd ../plugins
npm publish
echo "✅ @hyperhttp/plugins published successfully"

echo "3️⃣ Publishing @hyperhttp/presets..."
cd ../presets
npm publish
echo "✅ @hyperhttp/presets published successfully"

echo "4️⃣ Publishing @hyperhttp/axios-adapter..."
cd ../axios-adapter
npm publish
echo "✅ @hyperhttp/axios-adapter published successfully"

cd ../..

echo ""
echo "🎉 All packages published successfully!"
echo ""
echo "📦 Published packages:"
echo "  - @hyperhttp/core@1.0.0"
echo "  - @hyperhttp/plugins@1.0.0"
echo "  - @hyperhttp/presets@1.0.0"
echo "  - @hyperhttp/axios-adapter@1.0.0"
echo ""
echo "🔗 NPM links:"
echo "  - https://www.npmjs.com/package/@hyperhttp/core"
echo "  - https://www.npmjs.com/package/@hyperhttp/plugins"
echo "  - https://www.npmjs.com/package/@hyperhttp/presets"
echo "  - https://www.npmjs.com/package/@hyperhttp/axios-adapter"
echo ""
echo "🚀 HyperHTTP v1.0.0 is now live!"
