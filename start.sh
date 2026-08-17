#!/usr/bin/env bash
# Start the StoreCraft frontend development server.
# The backend is Supabase (cloud or local), so no local proxy is needed.

set -e

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies…"
  npm install
fi

echo "Starting StoreCraft frontend on http://localhost:5173"
npm run dev
