#!/bin/bash
set -euo pipefail

echo "🚀 Setting up local development environment for NPM Registry"
echo "=========================================================="

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed. Please install it first."
        exit 1
    fi
    echo "✅ $1 is installed"
}

echo "Checking prerequisites..."
check_command node
check_command pnpm
check_command wrangler

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Set up environment files
echo ""
echo "🔧 Setting up environment files..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file - Please update with your Cloudflare credentials"
else
    echo "ℹ️  .env file already exists"
fi

# Create .dev.vars for local development
if [ ! -f apps/api/.dev.vars ]; then
    cp apps/api/.dev.vars.example apps/api/.dev.vars
    echo "✅ Created apps/api/.dev.vars file"
else
    echo "ℹ️  apps/api/.dev.vars already exists"
fi

# Set up local database
echo ""
echo "🗄️  Setting up local D1 database..."
cd apps/api

# Apply migrations
echo "Applying database migrations..."
pnpm run migrate:local

# Add default admin token to local database
echo "Adding default admin token..."
wrangler d1 execute DB --local --command "INSERT OR REPLACE INTO token (token, name, scopes, created_at, updated_at) VALUES ('646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1', 'admin', '[\"read\", \"write\"]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000)"

# Verify setup
echo ""
echo "🔍 Verifying setup..."
TOKEN_COUNT=$(wrangler d1 execute DB --local --command "SELECT COUNT(*) as count FROM token" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
echo "✅ Database has $TOKEN_COUNT token(s)"

# Create test package
echo ""
echo "📦 Creating test package..."
cd ../..
if [ ! -d test-local-package ]; then
    mkdir -p test-local-package
    cd test-local-package
    
    # Create package.json
    cat > package.json << EOF
{
  "name": "@test/hello-world",
  "version": "1.0.0",
  "description": "Test package for local NPM registry",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT"
}
EOF

    # Create index.js
    cat > index.js << EOF
console.log('Hello from local NPM registry!');
EOF

    # Create .npmrc
    cat > .npmrc << EOF
@test:registry=http://localhost:8787
//localhost:8787/:_auth=646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1
EOF

    echo "✅ Created test package in test-local-package/"
    cd ..
else
    echo "ℹ️  test-local-package already exists"
fi

echo ""
echo "✨ Local development setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server:"
echo "   cd apps/api && pnpm run dev"
echo ""
echo "2. In another terminal, test the registry:"
echo "   curl http://localhost:8787"
echo ""
echo "3. Publish the test package:"
echo "   cd test-local-package && npm publish"
echo ""
echo "4. View logs and debug:"
echo "   Check LOCAL_DEVELOPMENT.md for more commands"
echo ""
echo "Happy coding! 🎉"