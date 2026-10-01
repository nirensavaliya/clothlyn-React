#!/bin/sh
set -e

cd "$(dirname "$0")/.."

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/react-scripts" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
fi

chmod +x node_modules/.bin/* 2>/dev/null || true

exec node_modules/.bin/react-scripts start
