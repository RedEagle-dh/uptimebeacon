#!/bin/sh
set -e

echo "=== DEBUG: Folder structure ==="
tree /app || true

echo "=== DEBUG: ls -la ==="
ls -la /app

echo "=== Starting application ==="
exec "$@"
