# npflared Deployment Guide

This guide covers how to manage npflared deployments as Infrastructure as Code (IaC).

## Overview

npflared is deployed to Cloudflare Workers with the following components:
- **Worker**: Handles npm registry API requests
- **R2 Bucket**: Stores package tarballs
- **D1 Database**: Stores package metadata and tokens
- **Custom Domain**: npm.coalescelabs.ai (production)

## Environment Configuration

### Production
- Worker: `npflared`
- Domain: npm.coalescelabs.ai
- R2 Bucket: `coalesce-labs-npm-repository`
- D1 Database: `npflared-db` (ID: cc8e2c56-e6a1-431b-9d5d-de0bcd99eb69)

### Staging
- Worker: `npflared-staging`
- Domain: npflared-staging.shy-snow-63d2.workers.dev
- R2 Bucket: `coalesce-labs-npm-repository-staging`
- D1 Database: `npflared-db-staging`

## Prerequisites

1. **Cloudflare Account** with Workers, R2, and D1 enabled
2. **Cloudflare API Token** with permissions:
   - Account:Cloudflare Workers Scripts:Edit
   - Account:Worker Scripts:Edit
   - Account:D1:Edit
   - Account:R2:Edit
   - Zone:DNS:Edit (for custom domain)
3. **GitHub Repository Secrets**:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

## Automated Deployment (GitHub Actions)

### Setup

1. Add required secrets to your GitHub repository:
   ```bash
   # Go to Settings > Secrets and variables > Actions
   # Add the following secrets:
   CLOUDFLARE_API_TOKEN=your-api-token
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   ```

2. The workflow automatically deploys:
   - **main branch** → Staging environment
   - **production branch** → Production environment

### Deployment Process

1. Push to the appropriate branch:
   ```bash
   # Deploy to staging
   git push origin main
   
   # Deploy to production
   git push origin production
   ```

2. GitHub Actions will:
   - Install dependencies
   - Run tests
   - Deploy to Cloudflare Workers
   - Run smoke tests

## Manual Deployment

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Thomascogez/npflared.git
   cd npflared
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

### Staging Environment Setup

Run the setup script:
```bash
./infrastructure/scripts/setup-staging.sh
```

This will:
- Create staging R2 bucket
- Create staging D1 database
- Update configuration with database ID
- Apply database migrations

### Deploy to Staging

```bash
cd apps/api
wrangler deploy --env staging
```

### Deploy to Production

```bash
cd apps/api
wrangler deploy --env production
```

## Terraform Management (Optional)

For complete infrastructure management, use Terraform:

### Setup

1. Install Terraform
2. Configure backend (optional):
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

3. Create `terraform.tfvars`:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your values
   ```

### Apply Infrastructure

```bash
# Plan changes
terraform plan

# Apply changes
terraform apply
```

## Secrets Management

### Auth Token

The auth token is stored as a Cloudflare Worker secret:

```bash
# Set auth token for production
wrangler secret put AUTH_TOKEN --env production

# Set auth token for staging
wrangler secret put AUTH_TOKEN --env staging
```

### Token Format

When prompted, enter your admin token (from setup):
```
646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1
```

## Database Management

### View Database Contents

```bash
# Production
wrangler d1 execute npflared-db --command "SELECT * FROM token"

# Staging
wrangler d1 execute npflared-db-staging --command "SELECT * FROM token" --env staging
```

### Add New Token

```bash
# Create a new token
NEW_TOKEN=$(openssl rand -hex 32)
echo "New token: $NEW_TOKEN"

# Add to database
wrangler d1 execute npflared-db --command "INSERT INTO token (token, name, scopes, created_at, updated_at) VALUES ('$NEW_TOKEN', 'developer-name', '[\"read\", \"write\"]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000)"
```

### Token Scopes

- `["read"]` - Can only install packages
- `["read", "write"]` - Can install and publish packages

## Monitoring

### View Worker Logs

```bash
# Production logs
wrangler tail --env production

# Staging logs
wrangler tail --env staging
```

### Check Worker Status

Visit the Cloudflare dashboard:
- [Workers & Pages](https://dash.cloudflare.com/workers-and-pages)
- Select your worker to view:
  - Request metrics
  - Error rates
  - CPU time usage

## Rollback

### Using GitHub Actions

1. Find the last working deployment in Actions tab
2. Click "Re-run all jobs" on that workflow

### Manual Rollback

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Deploy
cd apps/api
wrangler deploy --env production
```

## Troubleshooting

### Common Issues

1. **Deployment fails with auth error**
   - Check `CLOUDFLARE_API_TOKEN` has correct permissions
   - Verify `CLOUDFLARE_ACCOUNT_ID` is correct

2. **Custom domain not working**
   - Wait 5-10 minutes for DNS propagation
   - Check domain is proxied (orange cloud) in Cloudflare

3. **Database errors**
   - Verify D1 database ID in wrangler.toml
   - Check migrations were applied

### Debug Commands

```bash
# Test registry endpoint
curl https://npm.coalescelabs.ai

# Test with auth token
curl -H "Authorization: Bearer YOUR_TOKEN" https://npm.coalescelabs.ai/-/whoami

# Check worker status
wrangler deployments list
```

## Best Practices

1. **Always test in staging first**
2. **Use GitHub Actions for consistent deployments**
3. **Keep secrets in GitHub Secrets, never in code**
4. **Monitor worker metrics after deployment**
5. **Document any manual changes**

## Support

For issues:
1. Check worker logs: `wrangler tail`
2. Review GitHub Actions logs
3. Check Cloudflare dashboard for errors
4. Open an issue in the repository