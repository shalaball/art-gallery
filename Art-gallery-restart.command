#!/bin/bash
# Restarts the Shala Gallery admin server and opens it in the browser.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_DIR="$SCRIPT_DIR/admin"

# Kill any running server
pkill -f "node server.js" 2>/dev/null
sleep 0.5

cd "$ADMIN_DIR" || { echo "Error: admin/ directory not found."; exit 1; }

nohup node server.js >> "$ADMIN_DIR/server.log" 2>&1 &
disown
sleep 1.5
open http://localhost:3000
