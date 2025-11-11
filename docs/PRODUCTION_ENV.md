# Production Environment Variables

## Server Environment Variables

### Required

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@host:5432/dbname?sslmode=require

# Redis Cache
REDIS_URL=redis://:password@host:6379

# JWT Authentication
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Storage
S3_BUCKET_UPLOADS=mangu-uploads-production
S3_BUCKET_STATIC=mangu-static-production

# Email (SES)
SES_FROM_EMAIL=noreply@mangu-publishing.com
SES_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional

```bash
# Redis Configuration (if not using URL)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
DISABLE_REDIS=false

# CORS
CORS_ORIGIN=https://mangu-publishing.com,https://www.mangu-publishing.com

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_NOTIFICATIONS=true
ENABLE_ANALYTICS=true
```

## Client Environment Variables

### Required

```bash
# API Configuration
VITE_API_URL=https://api.mangu-publishing.com
```

### Optional

```bash
# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Feature Flags
VITE_ENABLE_BETA_FEATURES=false

# CDN
VITE_CDN_URL=https://cdn.mangu-publishing.com
```

## AWS Secrets Manager Structure

### Database Credentials Secret

Secret Name: `mangu-publishing-db-credentials-production`

```json
{
  "username": "mangu_admin",
  "password": "secure-password",
  "engine": "postgres",
  "host": "mangu-db.xxxxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "mangu_production",
  "url": "postgresql://mangu_admin:password@host:5432/mangu_production?sslmode=require"
}
```

### Redis Credentials Secret

Secret Name: `mangu-publishing-redis-credentials-production`

```json
{
  "host": "mangu-redis.xxxxx.cache.amazonaws.com",
  "port": 6379,
  "auth_token": "secure-token",
  "url": "redis://:token@host:6379"
}
```

### Application Secrets

Secret Name: `mangu-publishing-app-secrets-production`

```json
{
  "jwt_secret": "your-secure-jwt-secret",
  "stripe_secret_key": "sk_live_...",
  "stripe_webhook_secret": "whsec_...",
  "ses_access_key": "AKIA...",
  "ses_secret_key": "secret..."
}
```

## Setting Environment Variables

### In ECS Task Definition

Variables are configured in `infrastructure/terraform/ecs.tf` and pulled from Secrets Manager:

```hcl
secrets = [
  {
    name      = "DATABASE_URL"
    valueFrom = "arn:aws:secretsmanager:region:account:secret:db-credentials:url::"
  }
]
```

### In GitHub Actions

Configure in repository settings under Secrets and Variables:

```bash
Settings > Secrets and variables > Actions > New repository secret
```

### Local Development

Copy `.env.example` to `.env` and fill in values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## Environment Validation

The server validates required environment variables on startup. Check:

```bash
server/src/config/env.js
```

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use AWS Secrets Manager for production
3. ✅ Rotate credentials regularly
4. ✅ Use different credentials per environment
5. ✅ Enable encryption at rest
6. ✅ Use strong, random secrets (min 32 characters)
7. ✅ Limit IAM permissions to minimum required
8. ✅ Enable MFA for AWS console access

## Environment-Specific Configuration

### Development
- Use `.env.local` for overrides
- Redis can be disabled with `DISABLE_REDIS=1`
- Lower security requirements

### Staging
- Mirror production configuration
- Use separate database
- Test credential rotation

### Production
- All credentials from Secrets Manager
- Strict CORS policies
- Rate limiting enabled
- Full monitoring and logging
