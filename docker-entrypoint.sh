#!/bin/sh
set -e

echo "Running database migrations..."
prisma migrate deploy --schema=prisma/schema.prisma

echo "Seeding database..."
node prisma/seed.mjs || echo "Seed skipped or already applied"

echo "Starting application..."
exec node server.js
