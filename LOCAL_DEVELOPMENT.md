# Local Development Guide

This guide explains how to set up and run the NPM registry locally for development and testing.

## 🔧 Environment Setup

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Or with npm
npm install
```

### 2. Configure Environment Variables

#### Option A: Using .dev.vars (Recommended for Wrangler)

```bash
# Copy the example file
cd apps/api
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your values
# The AUTH_TOKEN is already set to your admin token
```

#### Option B: Using .env (For Scripts and Testing)

```bash
# In the root directory
cp .env.example .env

# Edit .env with your Cloudflare credentials
```

### 3. Set Up Local Database

For local development, Wrangler uses a local D1 database:

```bash
cd apps/api

# Apply migrations to local database
pnpm run migrate:local

# This creates a local SQLite database in .wrangler/state/
```

## 🚀 Running Locally

### Start Development Server

```bash
cd apps/api

# Start local development server
pnpm run dev

# Or directly with wrangler
wrangler dev

# With live reload
wrangler dev --live-reload
```

The local server will start at `http://localhost:8787`

### Local Testing

```bash
# Test the registry is running
curl http://localhost:8787

# Test with authentication
curl -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1" \
  http://localhost:8787/-/whoami
```

## 📦 Testing Package Operations

### Configure NPM for Local Registry

Create a `.npmrc` in your test package directory:

```bash
@test:registry=http://localhost:8787
//localhost:8787/:_auth=646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1
```

### Publish a Test Package

```bash
# Create a test package
mkdir test-local-package
cd test-local-package
npm init -y

# Update package.json name to use scope
{
  "name": "@test/my-package",
  "version": "1.0.0"
}

# Add .npmrc
echo "@test:registry=http://localhost:8787" > .npmrc
echo "//localhost:8787/:_auth=646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1" >> .npmrc

# Publish
npm publish
```

### Install from Local Registry

```bash
# In another project
npm install @test/my-package --registry=http://localhost:8787
```

## 🧪 Running Tests

```bash
cd apps/api

# Run tests once
pnpm test:single

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test:single package.spec.ts
```

## 🔍 Local Database Management

### View Local Database

```bash
cd apps/api

# List all tokens
wrangler d1 execute DB --local --command "SELECT * FROM token"

# Add a test token
wrangler d1 execute DB --local --command "INSERT INTO token (token, name, scopes, created_at, updated_at) VALUES ('test-token-123', 'local-dev', '[\"read\", \"write\"]', 1234567890, 1234567890)"

# View packages
wrangler d1 execute DB --local --command "SELECT * FROM package"
```

### Reset Local Database

```bash
# Delete local state
rm -rf .wrangler/state/

# Reapply migrations
pnpm run migrate:local
```

## 🐛 Debugging

### Enable Debug Logging

In `.dev.vars`:
```
DEBUG=true
```

### View Detailed Logs

```bash
# Start with debug logging
wrangler dev --log-level debug

# Or set in .dev.vars and use
pnpm run dev
```

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9

# Or use a different port
wrangler dev --port 8788
```

#### Database Not Found
```bash
# Ensure migrations are applied
cd apps/api
pnpm run migrate:local
```

#### Authentication Failures
- Check the token in `.dev.vars` matches what you're using
- Ensure the token exists in the local database

## 🔄 Switching Environments

### Test Against Staging

```bash
# In .npmrc
@test:registry=https://npflared-staging.workers.dev
//npflared-staging.workers.dev/:_auth=YOUR_STAGING_TOKEN
```

### Test Against Production

```bash
# In .npmrc
@test:registry=https://npm.coalescelabs.ai
//npm.coalescelabs.ai/:_auth=YOUR_PRODUCTION_TOKEN
```

## 📝 Development Workflow

1. **Make Changes**: Edit code in `apps/api/src/`
2. **Test Locally**: Changes auto-reload with `wrangler dev`
3. **Run Tests**: `pnpm test:single`
4. **Check Types**: `pnpm run check-types`
5. **Lint**: `pnpm run lint`
6. **Test Package Operations**: Publish/install test packages
7. **Commit**: Changes are ready for deployment

## 🛠️ Useful Commands

```bash
# Check code quality
pnpm run lint

# Type checking
pnpm run check-types

# Generate new migrations (after schema changes)
cd apps/api
pnpm run generate-migrations

# Deploy to staging from local
wrangler deploy --env staging

# View local worker config
wrangler whoami
```

## 💡 Tips

1. **Use Local Tokens**: Create test tokens in local DB for development
2. **Test Scopes**: Test both read-only and read-write tokens
3. **Package Versions**: Use version bumps to test updates
4. **Error Handling**: Test with invalid tokens and packages
5. **Performance**: Use `wrangler dev --local` for faster development

## 🔗 Related Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant commands
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [README.md](./README.md) - Project overview