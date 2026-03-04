#!/bin/bash
# Starts the Shala Gallery admin server and opens it in the browser.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_DIR="$SCRIPT_DIR/admin"

cd "$ADMIN_DIR" || { echo "Error: admin/ directory not found."; exit 1; }

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start server in background and open browser
nohup node server.js >> "$ADMIN_DIR/server.log" 2>&1 &
disown
sleep 1.5
open http://localhost:3000
