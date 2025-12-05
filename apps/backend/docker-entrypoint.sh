#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database
bunx prisma migrate deploy --schema=./prisma/schema.prisma
cd /app

echo "Starting backend..."
exec "$@"
