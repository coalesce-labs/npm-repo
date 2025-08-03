# Token Management for npflared

## Create a New User Token

### Method 1: Using SQL directly

```bash
# Generate a new token
openssl rand -hex 32

# Create SQL file
cat > create-user-token.sql << 'EOF'
INSERT INTO token (token, name, scopes, created_at, updated_at) 
VALUES (
  'YOUR_GENERATED_TOKEN_HERE',
  'john-doe',  -- User identifier
  '["read"]',  -- or '["read", "write"]' for publish access
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
EOF

# Execute
wrangler d1 execute npflared-db --remote --file=create-user-token.sql
```

### Method 2: Using the API (Recommended)

The registry has a token management API. You can create tokens using your admin token:

```bash
# Create a read-only token for a user
curl -X POST https://npm.coalescelabs.ai/-/npm/v1/tokens \
  -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john-doe-read-only",
    "scopes": [{
      "type": "package",
      "name": "*",
      "permissions": ["read"]
    }]
  }'

# Create a read-write token for publishing
curl -X POST https://npm.coalescelabs.ai/-/npm/v1/tokens \
  -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "jane-doe-publisher",
    "scopes": [{
      "type": "package", 
      "name": "*",
      "permissions": ["read", "write"]
    }]
  }'
```

## List All Tokens

```bash
curl https://npm.coalescelabs.ai/-/npm/v1/tokens \
  -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1"
```

## Revoke a Token

```bash
# First get the token ID from the list
curl -X DELETE https://npm.coalescelabs.ai/-/npm/v1/tokens/token/TOKEN_TO_REVOKE \
  -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1"
```

## Token Scopes Explained

- **`["read"]`**: Can only install/download packages
- **`["read", "write"]`**: Can install and publish packages
- **Package-specific scopes**: You can limit tokens to specific packages:
  ```json
  {
    "scopes": [{
      "type": "package",
      "name": "@coalesce-labs/specific-package",
      "permissions": ["read", "write"]
    }]
  }
  ```

## Best Practices

1. **Admin Token**: Keep your admin token secure - it can create/delete other tokens
2. **User Tokens**: Give each developer their own token
3. **CI/CD Tokens**: Create separate read-only tokens for CI/CD pipelines
4. **Token Rotation**: Periodically rotate tokens for security
5. **Naming Convention**: Use descriptive names like "john-doe-dev" or "ci-pipeline-prod"

## Example: Setting up a new developer

```bash
# 1. Create their token via API
curl -X POST https://npm.coalescelabs.ai/-/npm/v1/tokens \
  -H "Authorization: Bearer 646834181872f36e10bfedda9ce9f93338777b3ed04ff671e921059104c03ab1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "developer-ryan",
    "scopes": [{
      "type": "package",
      "name": "*", 
      "permissions": ["read", "write"]
    }]
  }'

# 2. Share their .npmrc configuration
echo "@coalesce-labs:registry=https://npm.coalescelabs.ai"
echo "//npm.coalescelabs.ai/:_auth=THEIR_NEW_TOKEN"
```