#!/bin/bash
# Starts the Shala Gallery admin server and opens it in the browser.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_DIR="$SCRIPT_DIR/admin"

cd "$ADMIN_DIR" || { echo "Error: admin/ directory not found."; exit 1; }

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Open browser once the server is ready
(sleep 1.5 && open http://localhost:3000) &

npm start
