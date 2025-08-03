# GitHub Repository Setup Guide

This guide will help you set up the npm-repo repository on GitHub with automated deployment to Cloudflare Workers.

## 🚀 Initial Repository Setup

### 1. Create GitHub Repository

```bash
# Navigate to the project directory
cd /Users/ryan/code-repos/github/coalesce-labs/npm-repo

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: Coalesce Labs NPM Registry"

# Create the repository on GitHub (using GitHub CLI)
gh repo create coalesce-labs/npm-repo --public --source=. --remote=origin --push

# Or manually:
# 1. Go to https://github.com/new
# 2. Create repository named "npm-repo" under "coalesce-labs" organization
# 3. Don't initialize with README (we already have one)
# 4. Add remote and push:
git remote add origin https://github.com/coalesce-labs/npm-repo.git
git branch -M main
git push -u origin main
```

### 2. Configure Repository Secrets

Go to your repository settings on GitHub:
1. Navigate to `Settings` → `Secrets and variables` → `Actions`
2. Add the following repository secrets:

#### CLOUDFLARE_API_TOKEN
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create a new API Token with these permissions:
   - **Account**: Cloudflare Workers Scripts:Edit
   - **Account**: Workers R2 Storage:Edit
   - **Account**: D1:Edit
   - **Zone**: DNS:Edit (for your domain)
3. Copy the token and add it as `CLOUDFLARE_API_TOKEN`

#### CLOUDFLARE_ACCOUNT_ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Find your Account ID in the right sidebar
4. Add it as `CLOUDFLARE_ACCOUNT_ID`

### 3. Create Production Branch

```bash
# Create and push production branch
git checkout -b production
git push -u origin production

# Switch back to main
git checkout main
```

## 🔄 Automated Deployment Workflow

The repository includes GitHub Actions that automatically deploy your registry:

### Deployment Triggers

- **Push to `main` branch**: Deploys to staging environment
- **Push to `production` branch**: Deploys to production environment
- **Pull requests to `main`**: Runs tests only (no deployment)

### Workflow Features

1. **Automated Testing**: Runs all tests before deployment
2. **Environment-specific Deployment**: Different configs for staging/production
3. **Smoke Tests**: Verifies deployment health after completion
4. **Secure Secrets**: Uses GitHub Secrets for sensitive data

## 🛠️ First Deployment

### Deploy to Staging

```bash
# Make a small change (e.g., update README)
echo "# Deployed via GitHub Actions" >> README.md
git add README.md
git commit -m "docs: trigger initial deployment"
git push origin main
```

Watch the deployment:
1. Go to the `Actions` tab in your GitHub repository
2. Click on the running workflow
3. Monitor the deployment progress

### Deploy to Production

```bash
# Merge main into production
git checkout production
git merge main
git push origin production
```

## 📋 Post-Deployment Setup

### 1. Verify Deployment

After successful deployment, verify your registry:

```bash
# Check staging
curl https://npflared-staging.YOUR-SUBDOMAIN.workers.dev

# Check production (after DNS propagation)
curl https://npm.coalescelabs.ai
```

### 2. Set Up Authentication Token

If not already done, create an admin token:

```bash
# Generate secure token
TOKEN=$(openssl rand -hex 32)
echo "Admin token: $TOKEN"

# Add to Cloudflare as secret
wrangler secret put AUTH_TOKEN --env production
# Paste the token when prompted
```

### 3. Configure Custom Domain (Production)

1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Add CNAME record:
   - Name: `npm`
   - Target: `npm-repo.YOUR-ACCOUNT.workers.dev`
   - Proxy status: Proxied (orange cloud)

Or the worker route should handle this automatically via the `wrangler.production.toml` configuration.

## 🔐 Security Best Practices

1. **Branch Protection**: 
   - Go to Settings → Branches
   - Add rule for `production` branch
   - Enable: Require pull request reviews, Require status checks

2. **Secret Scanning**:
   - Enable secret scanning in Security settings
   - Never commit tokens or sensitive data

3. **Access Control**:
   - Limit who can push to production branch
   - Use GitHub teams for organization access

## 🚨 Troubleshooting

### Deployment Failures

1. **Check GitHub Actions logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Review error messages

2. **Common issues**:
   - Invalid Cloudflare credentials → Verify secrets
   - Database not found → Check D1 database exists
   - R2 bucket missing → Create bucket manually

### Manual Deployment Fallback

If GitHub Actions fail, deploy manually:

```bash
# Install dependencies
pnpm install

# Deploy to production
cd apps/api
wrangler deploy --env production
```

## 📊 Monitoring Deployments

### GitHub Deployment History

View all deployments:
1. Go to your repository
2. Click on "Environments" (right sidebar)
3. View deployment history and status

### Cloudflare Analytics

Monitor your worker:
1. [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages → Your Worker
3. View metrics and logs

## 🔄 Continuous Updates

### Regular Updates

```bash
# Update dependencies
pnpm update

# Test locally
pnpm test

# Deploy via git push
git add .
git commit -m "chore: update dependencies"
git push origin main
```

### Emergency Hotfix

```bash
# Create hotfix from production
git checkout production
git checkout -b hotfix/critical-fix

# Make fixes
# ...

# Push and create PR to production
git push origin hotfix/critical-fix
# Create PR via GitHub UI or:
gh pr create --base production --title "Hotfix: Critical issue"
```

## 📝 Next Steps

1. **Test the registry**: Try publishing a test package
2. **Set up monitoring**: Configure alerts in Cloudflare
3. **Document tokens**: Keep secure record of admin tokens
4. **Plan backups**: Schedule regular D1 and R2 backups

---

**Need Help?**
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment options
- Review GitHub Actions logs for deployment issues
- Open an issue in the repository for bugs