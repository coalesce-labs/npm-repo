#!/bin/bash
set -euo pipefail

echo "Setting up staging environment for npflared..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Please install it first."
    exit 1
fi

# Create staging R2 bucket
echo "Creating staging R2 bucket..."
wrangler r2 bucket create coalesce-labs-npm-repository-staging || echo "Bucket might already exist"

# Create staging D1 database
echo "Creating staging D1 database..."
DB_OUTPUT=$(wrangler d1 create npflared-db-staging 2>&1 || echo "Database might already exist")
echo "$DB_OUTPUT"

# Extract database ID
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

if [ -n "$DB_ID" ]; then
    echo "Database ID: $DB_ID"
    echo "Updating wrangler.staging.toml with database ID..."
    sed -i.bak "s/YOUR_STAGING_D1_DATABASE_ID/$DB_ID/g" apps/api/wrangler.staging.toml
    rm apps/api/wrangler.staging.toml.bak
fi

# Apply database migrations
echo "Applying database migrations..."
cd apps/api
wrangler d1 execute npflared-db-staging --file=migrations/0000_bright_mercury.sql --env staging

echo "Staging environment setup complete!"