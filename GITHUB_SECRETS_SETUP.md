# GitHub Secrets Setup Guide

This guide will help you add the required secrets to your GitHub repository for automated deployment.

## 🔐 Required Secrets

You need to add these two secrets to your GitHub repository:

### 1. CLOUDFLARE_API_TOKEN

**How to get it:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Custom token" template
4. Set these permissions:
   - **Account** → Cloudflare Workers Scripts:Edit
   - **Account** → Workers R2 Storage:Edit
   - **Account** → D1:Edit
   - **Zone** → Zone:Read
   - **Zone** → DNS:Edit (for your domain)
5. Click "Continue to summary"
6. Click "Create Token"
7. Copy the token (you won't see it again!)

### 2. CLOUDFLARE_ACCOUNT_ID

**How to find it:**
1. Go to https://dash.cloudflare.com
2. Select your account (if you have multiple)
3. Look in the right sidebar
4. You'll see "Account ID" with a copy button
5. Copy this value

## 📝 Adding Secrets to GitHub

1. Go to your repository: https://github.com/coalesce-labs/npm-repo
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"

### Add CLOUDFLARE_API_TOKEN:
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: Paste your API token from step 1
- Click "Add secret"

### Add CLOUDFLARE_ACCOUNT_ID:
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: Paste your account ID from step 2
- Click "Add secret"

## ✅ Verify Setup

After adding both secrets, you should see them listed in the Actions secrets page:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

## 🚀 Trigger Deployment

Once secrets are added, trigger your first deployment:

```bash
cd /Users/ryan/code-repos/github/coalesce-labs/npm-repo
echo "" >> README.md
git add README.md
git commit -m "chore: trigger initial deployment"
git push origin main
```

Then check the Actions tab: https://github.com/coalesce-labs/npm-repo/actions

## 📋 Local Configuration Files Created

I've already created these local config files for you:

1. **`.env`** - Contains placeholder values for Cloudflare credentials
2. **`apps/api/.dev.vars`** - Contains your auth token for local development

These files are git-ignored and won't be committed to the repository.

## 🔑 Your Current Configuration

Based on your existing deployment:

- **Production URL**: https://npm.coalescelabs.ai
- **Worker Name**: npflared
- **Database ID**: cc8e2c56-e6a1-431b-9d5d-de0bcd99eb69
- **R2 Bucket**: coalesce-labs-npm-repository
- **Admin Token**: 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1

## ⚠️ Important Notes

1. **Never commit secrets** to the repository
2. **Keep your API token secure** - it has full access to your Workers
3. **The admin token** in your local files is the same one from your current deployment
4. **Database ID** is already configured in `wrangler.production.toml`

Once you add these GitHub secrets, your automated deployment pipeline will be fully functional!