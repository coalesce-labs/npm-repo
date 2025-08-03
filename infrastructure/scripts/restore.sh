#!/bin/bash
set -euo pipefail

# Restore script for npm registry
# Usage: ./restore.sh [backup-date]

echo "NPM Registry Restore Script"
echo "=========================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Please install it first."
    exit 1
fi

# Check for backup directory or date
BACKUP_DIR=${1:-"backups"}
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory '$BACKUP_DIR' not found"
    exit 1
fi

echo "Step 1: Creating infrastructure..."

# Create R2 bucket if it doesn't exist
echo "Creating R2 bucket..."
wrangler r2 bucket create coalesce-labs-npm-repository 2>/dev/null || echo "Bucket already exists"

# Create D1 database if it doesn't exist
echo "Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create npflared-db 2>&1 || echo "Database might already exist")
echo "$DB_OUTPUT"

# Extract database ID if newly created
if [[ "$DB_OUTPUT" =~ database_id[[:space:]]*=[[:space:]]*\"([^\"]+)\" ]]; then
    DB_ID="${BASH_REMATCH[1]}"
    echo "New database created with ID: $DB_ID"
    echo "Please update wrangler.production.toml with this ID"
fi

echo ""
echo "Step 2: Applying database schema..."
cd apps/api
wrangler d1 execute npflared-db --file=migrations/0000_bright_mercury.sql

echo ""
echo "Step 3: Restoring data from backups..."

# Find latest backup files
LATEST_TOKENS=$(ls -t "$BACKUP_DIR"/tokens_*.json 2>/dev/null | head -1)
LATEST_PACKAGES=$(ls -t "$BACKUP_DIR"/packages_*.json 2>/dev/null | head -1)
LATEST_VERSIONS=$(ls -t "$BACKUP_DIR"/package_versions_*.json 2>/dev/null | head -1)

# Restore tokens
if [ -f "$LATEST_TOKENS" ]; then
    echo "Restoring tokens from $LATEST_TOKENS..."
    # Parse JSON and create INSERT statements
    jq -r '.result[0].results[] | "INSERT INTO token (token, name, scopes, created_at, updated_at) VALUES (\"\(.token)\", \"\(.name)\", \"\(.scopes)\", \(.created_at), \(.updated_at));"' "$LATEST_TOKENS" | while read -r sql; do
        wrangler d1 execute npflared-db --command "$sql"
    done
else
    echo "Warning: No token backup found"
fi

# Restore packages
if [ -f "$LATEST_PACKAGES" ]; then
    echo "Restoring packages from $LATEST_PACKAGES..."
    jq -r '.result[0].results[] | "INSERT INTO package (name, created_at, updated_at) VALUES (\"\(.name)\", \(.created_at), \(.updated_at));"' "$LATEST_PACKAGES" | while read -r sql; do
        wrangler d1 execute npflared-db --command "$sql"
    done
else
    echo "Warning: No package backup found"
fi

# Restore package versions
if [ -f "$LATEST_VERSIONS" ]; then
    echo "Restoring package versions from $LATEST_VERSIONS..."
    jq -r '.result[0].results[] | "INSERT INTO package_version (id, name, version, manifest, readme, created_at, updated_at) VALUES (\(.id), \"\(.name)\", \"\(.version)\", \"\(.manifest | @base64)\", \"\(.readme // "" | @base64)\", \(.created_at), \(.updated_at));"' "$LATEST_VERSIONS" | while read -r sql; do
        wrangler d1 execute npflared-db --command "$sql"
    done
else
    echo "Warning: No package version backup found"
fi

echo ""
echo "Step 4: Deploying worker..."
wrangler deploy --env production

echo ""
echo "✅ Restore complete!"
echo ""
echo "Next steps:"
echo "1. Verify the registry is working: curl https://npm.coalescelabs.ai"
echo "2. Test authentication with your tokens"
echo "3. If you have R2 backups, restore them through the Cloudflare dashboard"
echo ""
echo "Note: This script restored the database metadata. Package tarballs in R2 must be restored separately."