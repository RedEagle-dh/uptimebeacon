#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database
bunx prisma migrate deploy
cd /app

echo "Starting backend..."
exec "$@"
