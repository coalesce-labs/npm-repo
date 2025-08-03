# Quick Start: Deploy Your NPM Registry

This guide will get your private NPM registry up and running in under 10 minutes.

## 📦 What You're Getting

- Private NPM registry at `npm.coalescelabs.ai`
- Automated GitHub Actions deployment
- Token-based authentication
- Automatic backups
- Infrastructure as Code

## 🚀 Step-by-Step Setup

### 1. Push to GitHub

```bash
cd /Users/ryan/code-repos/github/coalesce-labs/npm-repo

# Create initial commit
git add -A
git commit -m "Initial commit: Coalesce Labs NPM Registry"

# Create GitHub repository and push
gh repo create coalesce-labs/npm-repo --public --source=. --remote=origin --push

# Or if creating manually on GitHub:
git remote add origin https://github.com/coalesce-labs/npm-repo.git
git push -u origin main
```

### 2. Add GitHub Secrets

1. Go to your repository: https://github.com/coalesce-labs/npm-repo
2. Navigate to Settings → Secrets and variables → Actions
3. Add these secrets:

**CLOUDFLARE_API_TOKEN**:
- Go to https://dash.cloudflare.com/profile/api-tokens
- Create token with: Workers Scripts:Edit, R2:Edit, D1:Edit permissions
- Copy and paste as secret

**CLOUDFLARE_ACCOUNT_ID**:
- Find in Cloudflare dashboard sidebar
- Copy and paste as secret

### 3. Create Production Branch

```bash
git checkout -b production
git push -u origin production
git checkout main
```

### 4. Deploy!

The GitHub Action will automatically deploy when you push. To trigger your first deployment:

```bash
# Already on main branch
git push
```

Watch deployment progress:
- Go to Actions tab in your GitHub repository
- Click on the running workflow

### 5. Verify Deployment

After ~2 minutes, check your registry:

```bash
curl https://npm.coalescelabs.ai
```

## 🔑 Set Up Your First Token

```bash
# Your admin token from the setup
export ADMIN_TOKEN="646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1"

# Test authentication
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://npm.coalescelabs.ai/-/whoami
```

## 📤 Publish Your First Package

1. Create a test package:
```bash
mkdir my-test-package && cd my-test-package
npm init -y
echo "console.log('Hello from private registry!');" > index.js
```

2. Configure npm:
```bash
echo "@coalesce-labs:registry=https://npm.coalescelabs.ai" > .npmrc
echo "//npm.coalescelabs.ai/:_auth=$ADMIN_TOKEN" >> .npmrc
```

3. Update package.json name:
```json
{
  "name": "@coalesce-labs/my-test-package",
  "version": "1.0.0"
}
```

4. Publish:
```bash
npm publish
```

## 🎉 You're Done!

Your private NPM registry is now:
- ✅ Deployed to Cloudflare Workers
- ✅ Available at npm.coalescelabs.ai
- ✅ Automatically deployed on git push
- ✅ Backed up daily

## 📚 What's Next?

- **Add more tokens**: See [Token Management](./README.md#-token-management)
- **Monitor usage**: Check Cloudflare dashboard
- **Customize domain**: Update in `wrangler.production.toml`
- **Enable staging**: Push to `main` branch

## 🆘 Troubleshooting

**Registry not responding?**
- Wait 5 minutes for DNS propagation
- Check GitHub Actions for errors

**Authentication failing?**
- Verify token in .npmrc
- Check token exists in database

**Need to restore?**
```bash
cd infrastructure/scripts
./restore.sh
```

---

Full documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)