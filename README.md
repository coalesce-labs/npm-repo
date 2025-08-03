# Coalesce Labs NPM Registry

A private NPM registry powered by Cloudflare Workers, R2, and D1. This registry allows you to host and manage private NPM packages with authentication and access control.

## 🚀 Features

- **Private Package Hosting**: Securely host your private NPM packages
- **Token-based Authentication**: Control access with scoped tokens
- **Cloudflare Infrastructure**: Built on Workers, R2 for storage, and D1 for metadata
- **Custom Domain Support**: Available at `npm.coalescelabs.ai`
- **Fallback to Public Registry**: Seamlessly falls back to npmjs.org for public packages
- **CI/CD Ready**: Automated deployment with GitHub Actions

## 📋 Prerequisites

- Cloudflare account with Workers, R2, and D1 enabled
- Domain configured in Cloudflare (for custom domain)
- Node.js 20+ and pnpm
- Wrangler CLI installed (`npm install -g wrangler`)

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/coalesce-labs/npm-repo.git
cd npm-repo
pnpm install
```

### 2. Configure GitHub Repository

1. Go to your GitHub repository settings
2. Add these secrets under Settings > Secrets and variables > Actions:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### 3. Deploy

The repository uses GitHub Actions for automated deployment:

- **Push to `main`**: Deploys to staging environment
- **Push to `production`**: Deploys to production environment

```bash
# Deploy to production
git checkout -b production
git push origin production
```

## 🔧 Manual Setup

If you need to set up the infrastructure manually:

### Create R2 Bucket

```bash
wrangler r2 bucket create coalesce-labs-npm-repository
```

### Create D1 Database

```bash
wrangler d1 create npflared-db
# Note the database ID returned
```

### Update Configuration

Edit `apps/api/wrangler.production.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "npflared-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### Apply Database Schema

```bash
cd apps/api
wrangler d1 execute npflared-db --file=migrations/0000_bright_mercury.sql
```

### Deploy Worker

```bash
wrangler deploy --env production
```

## 📦 Using the Registry

### Configure NPM Client

Create a `.npmrc` file in your project:

```bash
@your-scope:registry=https://npm.coalescelabs.ai
//npm.coalescelabs.ai/:_auth=YOUR_AUTH_TOKEN
```

### Publishing Packages

```bash
npm publish --registry=https://npm.coalescelabs.ai
```

### Installing Packages

```bash
npm install @your-scope/package-name
```

## 🔐 Token Management

### View Existing Tokens

```bash
wrangler d1 execute npflared-db --command "SELECT * FROM token"
```

### Create New Token

```bash
# Generate token
NEW_TOKEN=$(openssl rand -hex 32)

# Add to database
wrangler d1 execute npflared-db --command "INSERT INTO token (token, name, scopes) VALUES ('$NEW_TOKEN', 'developer-name', '[\"read\", \"write\"]')"
```

### Token Scopes

- `["read"]`: Can only install packages
- `["read", "write"]`: Can install and publish packages

## 🔄 Disaster Recovery

### Backup

The infrastructure is defined as code. To backup:

1. **Code**: Already in Git
2. **Database**: Export D1 data
   ```bash
   wrangler d1 execute npflared-db --command "SELECT * FROM token" > tokens-backup.json
   wrangler d1 execute npflared-db --command "SELECT * FROM package" > packages-backup.json
   ```
3. **R2 Data**: Use R2 API or dashboard to backup tarballs

### Restore from Scratch

1. Clone this repository
2. Run the setup:
   ```bash
   # Install dependencies
   pnpm install
   
   # Create infrastructure
   cd apps/api
   wrangler r2 bucket create coalesce-labs-npm-repository
   wrangler d1 create npflared-db
   
   # Update wrangler.production.toml with new database ID
   
   # Apply schema
   wrangler d1 execute npflared-db --file=migrations/0000_bright_mercury.sql
   
   # Deploy
   wrangler deploy --env production
   ```

3. Restore data from backups

## 📊 Monitoring

### View Logs

```bash
wrangler tail --env production
```

### Metrics

Visit the [Cloudflare Dashboard](https://dash.cloudflare.com) to view:
- Request analytics
- Error rates
- Performance metrics

## 🏗️ Project Structure

```
├── apps/
│   ├── api/          # Main worker application
│   ├── cli/          # CLI tools
│   └── doc/          # Documentation site
├── infrastructure/
│   ├── terraform/    # Terraform IaC files
│   └── scripts/      # Setup scripts
├── .github/
│   └── workflows/    # GitHub Actions
└── DEPLOYMENT.md     # Detailed deployment guide
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions
- View logs with `wrangler tail`
- Open an issue for bugs or feature requests

---

**Current Deployment**
- Production: https://npm.coalescelabs.ai
- Worker: npflared
- Region: Global (Cloudflare Edge)



