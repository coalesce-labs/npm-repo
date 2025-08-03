# Claude AI Assistant Guide for NPM Registry Management

This document provides context and commands for Claude AI to help manage, debug, and maintain the Coalesce Labs NPM Registry.

## 🏗️ Project Overview

This is a private NPM registry built on Cloudflare Workers infrastructure:
- **Production URL**: https://npm.coalescelabs.ai
- **Worker Name**: npflared
- **Database**: npflared-db (D1)
- **Storage**: coalesce-labs-npm-repository (R2)
- **Environment**: Cloudflare Workers with Node.js compatibility

## 🔍 Debugging Commands

### View Real-time Logs

```bash
# Production logs (live tail)
wrangler tail --env production

# Staging logs
wrangler tail --env staging

# Filter logs by status
wrangler tail --env production --status error

# Filter logs by IP
wrangler tail --env production --ip 192.168.1.1

# Save logs to file
wrangler tail --env production > logs.txt
```

### Check Worker Status

```bash
# List all deployments
wrangler deployments list

# Check worker metrics
curl https://npm.coalescelabs.ai/-/health

# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" https://npm.coalescelabs.ai/-/whoami
```

### Database Queries

```bash
# View all tokens
wrangler d1 execute npflared-db --command "SELECT token, name, scopes, created_at FROM token" --env production

# Check specific package
wrangler d1 execute npflared-db --command "SELECT * FROM package WHERE name = '@scope/package-name'" --env production

# View recent package uploads
wrangler d1 execute npflared-db --command "SELECT name, version, created_at FROM package_version ORDER BY created_at DESC LIMIT 10" --env production

# Count total packages
wrangler d1 execute npflared-db --command "SELECT COUNT(*) as total FROM package" --env production

# Find packages by scope
wrangler d1 execute npflared-db --command "SELECT * FROM package WHERE name LIKE '@coalesce-labs/%'" --env production
```

## 🛠️ Common Tasks

### Add New Authentication Token

```bash
# Generate secure token
NEW_TOKEN=$(openssl rand -hex 32)
echo "New token: $NEW_TOKEN"

# Add read-only token
wrangler d1 execute npflared-db --command "INSERT INTO token (token, name, scopes, created_at, updated_at) VALUES ('$NEW_TOKEN', 'developer-name', '[\"read\"]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000)" --env production

# Add read-write token
wrangler d1 execute npflared-db --command "INSERT INTO token (token, name, scopes, created_at, updated_at) VALUES ('$NEW_TOKEN', 'developer-name', '[\"read\", \"write\"]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000)" --env production
```

### Remove/Revoke Token

```bash
# List tokens to find the one to remove
wrangler d1 execute npflared-db --command "SELECT token, name FROM token" --env production

# Delete specific token
wrangler d1 execute npflared-db --command "DELETE FROM token WHERE token = 'TOKEN_TO_DELETE'" --env production
```

### Package Management

```bash
# Delete a package version
wrangler d1 execute npflared-db --command "DELETE FROM package_version WHERE name = '@scope/package' AND version = '1.0.0'" --env production

# Delete entire package
wrangler d1 execute npflared-db --command "DELETE FROM package WHERE name = '@scope/package'" --env production

# Update package metadata
wrangler d1 execute npflared-db --command "UPDATE package SET updated_at = strftime('%s', 'now') * 1000 WHERE name = '@scope/package'" --env production
```

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Authentication Failures
```bash
# Check if token exists
wrangler d1 execute npflared-db --command "SELECT * FROM token WHERE token = 'PROBLEMATIC_TOKEN'" --env production

# Check token scopes
wrangler d1 execute npflared-db --command "SELECT name, scopes FROM token" --env production

# View recent auth attempts in logs
wrangler tail --env production --search "401"
```

#### 2. Package Upload Failures
```bash
# Check R2 bucket status
wrangler r2 bucket list

# Check database for package conflicts
wrangler d1 execute npflared-db --command "SELECT * FROM package_version WHERE name = '@scope/package' AND version = '1.0.0'" --env production

# Check worker errors
wrangler tail --env production --status error
```

#### 3. Performance Issues
```bash
# Check worker CPU time
wrangler tail --env production --format json | grep -i "cpu"

# View request patterns
wrangler tail --env production --format json | jq '.event.request.url' | sort | uniq -c

# Check database size
wrangler d1 execute npflared-db --command "SELECT COUNT(*) FROM package_version" --env production
```

## 📊 Monitoring Queries

### Daily Statistics
```bash
# Packages published today
wrangler d1 execute npflared-db --command "SELECT COUNT(*) as published_today FROM package_version WHERE created_at > strftime('%s', 'now', 'start of day') * 1000" --env production

# Active tokens
wrangler d1 execute npflared-db --command "SELECT COUNT(*) as active_tokens FROM token" --env production

# Storage usage (requires checking R2 dashboard)
echo "Check R2 dashboard for storage metrics"
```

### Usage Patterns
```bash
# Most published packages
wrangler d1 execute npflared-db --command "SELECT name, COUNT(*) as versions FROM package_version GROUP BY name ORDER BY versions DESC LIMIT 10" --env production

# Recently updated packages
wrangler d1 execute npflared-db --command "SELECT name, MAX(created_at) as last_update FROM package_version GROUP BY name ORDER BY last_update DESC LIMIT 10" --env production
```

## 🔄 Maintenance Tasks

### Database Cleanup
```bash
# Find orphaned package versions
wrangler d1 execute npflared-db --command "SELECT pv.* FROM package_version pv LEFT JOIN package p ON pv.name = p.name WHERE p.name IS NULL" --env production

# Clean old tokens (older than 1 year)
wrangler d1 execute npflared-db --command "DELETE FROM token WHERE created_at < strftime('%s', 'now', '-1 year') * 1000" --env production
```

### Backup Current State
```bash
# Export all data
mkdir -p backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup tokens
wrangler d1 execute npflared-db --command "SELECT * FROM token" --json --env production > backups/tokens_$DATE.json

# Backup packages
wrangler d1 execute npflared-db --command "SELECT * FROM package" --json --env production > backups/packages_$DATE.json

# Backup versions
wrangler d1 execute npflared-db --command "SELECT * FROM package_version" --json --env production > backups/versions_$DATE.json
```

## 🏃 Quick Actions

### Emergency Token Creation
```bash
# Create emergency admin token
EMERGENCY_TOKEN=$(openssl rand -hex 32)
wrangler d1 execute npflared-db --command "INSERT INTO token (token, name, scopes, created_at, updated_at) VALUES ('$EMERGENCY_TOKEN', 'emergency-admin', '[\"read\", \"write\"]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000)" --env production
echo "Emergency token: $EMERGENCY_TOKEN"
```

### Check Service Health
```bash
# Quick health check
curl -s -o /dev/null -w "%{http_code}" https://npm.coalescelabs.ai || echo "Service is down!"

# Detailed check
curl -i https://npm.coalescelabs.ai/-/ping
```

### Force Redeploy
```bash
# Redeploy from current code
cd apps/api
wrangler deploy --env production
```

## 🔐 Security Checks

```bash
# List all tokens with write access
wrangler d1 execute npflared-db --command "SELECT name, created_at FROM token WHERE scopes LIKE '%write%'" --env production

# Find old tokens (>6 months)
wrangler d1 execute npflared-db --command "SELECT name, created_at FROM token WHERE created_at < strftime('%s', 'now', '-6 months') * 1000" --env production

# Check for unusual activity
wrangler tail --env production --search "error" --format json | jq '.event.request | {method, url, headers}' | grep -v "GET"
```

## 📝 Environment Variables

Current configuration in `wrangler.production.toml`:
- `FALLBACK_REGISTRY_ENDPOINT`: https://registry.npmjs.org
- `DB`: D1 database binding
- `BUCKET`: R2 bucket binding

## 🆘 Emergency Procedures

### Service is Down
1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. View error logs: `wrangler tail --env production --status error`
3. Redeploy: `cd apps/api && wrangler deploy --env production`
4. Check DNS: `dig npm.coalescelabs.ai`

### Database Corruption
1. Stop writes (remove write tokens temporarily)
2. Export current data
3. Restore from backup using `infrastructure/scripts/restore.sh`

### Authentication Broken
1. Create emergency token (see above)
2. Test with curl
3. Check token database integrity
4. Review recent deployments

## 📍 Important File Locations

- Worker code: `apps/api/src/index.ts`
- Database schema: `apps/api/migrations/0000_bright_mercury.sql`
- Production config: `apps/api/wrangler.production.toml`
- Deployment workflow: `.github/workflows/deploy.yml`
- Backup workflow: `.github/workflows/backup.yml`

## 🔧 Development Commands

```bash
# Run tests
pnpm test

# Check types
pnpm typecheck

# Lint code
pnpm lint

# Local development
cd apps/api
wrangler dev
```

## 🏃 Local Development Setup

### Quick Setup
```bash
# Run the setup script
./scripts/local-setup.sh

# This will:
# - Install dependencies
# - Create .env and .dev.vars files
# - Set up local D1 database
# - Add admin token to local DB
# - Create a test package
```

### Start Local Server
```bash
cd apps/api
pnpm run dev
# Server runs at http://localhost:8787
```

### Local Environment Variables

The project uses two types of environment files:

1. **`.env`** (root directory) - For scripts and deployment tools
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your account ID
   - `NPM_AUTH_TOKEN`: Default auth token for testing

2. **`apps/api/.dev.vars`** - For Wrangler local development
   - `AUTH_TOKEN`: Authentication token for local testing
   - `DEBUG`: Enable debug logging
   - Auto-loaded by wrangler dev

### Test Local Registry
```bash
# Check it's running
curl http://localhost:8787

# Test auth
curl -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1" \
  http://localhost:8787/-/whoami

# Publish test package
cd test-local-package
npm publish

# Install from local registry
npm install @test/hello-world --registry=http://localhost:8787
```

Remember: Always check logs first when debugging issues. Most problems are visible in the worker logs or D1 query results.