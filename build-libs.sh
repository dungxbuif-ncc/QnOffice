#!/bin/bash

set -e

echo "🔨 Building shared libs..."

cd libs

# Build TypeScript
npm run build

# Copy to web node_modules
echo "📦 Copying to web/node_modules..."
mkdir -p ../apps/web/node_modules/@qnoffice/shared
cp -r dist ../apps/web/node_modules/@qnoffice/shared/
cp package.json ../apps/web/node_modules/@qnoffice/shared/

# Copy to be node_modules
echo "📦 Copying to be/node_modules..."
mkdir -p ../apps/be/node_modules/@qnoffice/shared
cp -r dist ../apps/be/node_modules/@qnoffice/shared/
cp package.json ../apps/be/node_modules/@qnoffice/shared/

echo "✅ Build complete!"
