#!/bin/bash

# Advanced Client Fetch Publish Script
# This script publishes all packages to NPM

set -e

echo "🚀 Starting Advanced Client Fetch publish process..."

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

echo "1️⃣ Publishing @advanced-client-fetch/core..."
cd packages/core
npm publish
echo "✅ @advanced-client-fetch/core published successfully"

echo "2️⃣ Publishing @advanced-client-fetch/plugins..."
cd ../plugins
npm publish
echo "✅ @advanced-client-fetch/plugins published successfully"

echo "3️⃣ Publishing @advanced-client-fetch/presets..."
cd ../presets
npm publish
echo "✅ @advanced-client-fetch/presets published successfully"

echo "4️⃣ Publishing @advanced-client-fetch/axios-adapter..."
cd ../axios-adapter
npm publish
echo "✅ @advanced-client-fetch/axios-adapter published successfully"

cd ../..

echo ""
echo "🎉 All packages published successfully!"
echo ""
echo "📦 Published packages:"
echo "  - @advanced-client-fetch/core@1.0.0"
echo "  - @advanced-client-fetch/plugins@1.0.0"
echo "  - @advanced-client-fetch/presets@1.0.0"
echo "  - @advanced-client-fetch/axios-adapter@1.0.0"
echo ""
echo "🔗 NPM links:"
echo "  - https://www.npmjs.com/package/@advanced-client-fetch/core"
echo "  - https://www.npmjs.com/package/@advanced-client-fetch/plugins"
echo "  - https://www.npmjs.com/package/@advanced-client-fetch/presets"
echo "  - https://www.npmjs.com/package/@advanced-client-fetch/axios-adapter"
echo ""
echo "🚀 Advanced Client Fetch v1.0.0 is now live!"
