# Deployment Documentation

## Overview
This document outlines the deployment process and infrastructure setup for the Ivan Prints Business Management System.

## Infrastructure

### Cloud Provider
- **Platform**: Vercel
- **Region**: US East (N. Virginia)
- **Pricing Tier**: Pro

### Database
- **Provider**: Supabase
- **Region**: US East (N. Virginia)
- **Pricing Tier**: Pro
- **Database Size**: 8GB
- **Connections**: 50



### File Storage
- **Provider**: Supabase Storage
- **Region**: Same as database
- **Bucket Types**:
  - public-assets
  - private-documents
  - user-uploads

## Environment Setup

### Development Environment
```bash
# Clone repository
git clone https://github.com/your-org/ivan-prints.git
cd ivan-prints

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables
```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@ivanprints.com

# Security
JWT_SECRET=your-jwt-secret
PIN_ENCRYPTION_KEY=your-encryption-key

# Feature Flags
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
```

## Build Process

### Production Build
```bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
```

### Build Optimization
1. **Code Optimization**
   - Tree shaking
   - Code splitting
   - Image optimization
   - Font optimization

2. **Performance Monitoring**
   - Lighthouse scores
   - Core Web Vitals
   - Bundle analysis
   - Performance metrics

## Deployment Process

### Continuous Integration
1. **GitHub Actions Workflow**
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/actions/deploy@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Environments
1. **Development**
   - Branch: develop
   - URL: dev.ivanprints.com
   - Auto-deploy: Yes
   - Database: Development instance

2. **Staging**
   - Branch: staging
   - URL: staging.ivanprints.com
   - Auto-deploy: Yes
   - Database: Staging instance

3. **Production**
   - Branch: main
   - URL: ivanprints.com
   - Auto-deploy: No
   - Database: Production instance

### Database Migrations
```bash
# Generate migration
npm run migration:generate

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Monitoring & Logging

### Application Monitoring
1. **Error Tracking**
   - Service: Sentry
   - Error alerts
   - Performance monitoring
   - User session tracking

2. **Performance Monitoring**
   - Service: Vercel Analytics
   - Page load times
   - API response times
   - Resource usage

### Database Monitoring
1. **Performance Metrics**
   - Query performance
   - Connection pool
   - Cache hit ratio
   - Disk usage

2. **Health Checks**
   - Connection status
   - Replication lag
   - Backup status
   - Error rates

### Log Management
1. **Application Logs**
   - Error logs
   - Access logs
   - Audit logs
   - Performance logs

2. **System Logs**
   - Server logs
   - Database logs
   - Security logs
   - Backup logs

## Backup & Recovery

### Database Backups
1. **Automated Backups**
   - Frequency: Daily
   - Retention: 30 days
   - Storage: Encrypted S3
   - Verification: Automated

2. **Manual Backups**
   - Pre-deployment
   - Major updates
   - Data migrations
   - Emergency situations

### Recovery Procedures
1. **Database Recovery**
```bash
# Download backup
supabase db download -b <backup-id>

# Restore backup
supabase db restore -f backup.sql
```

2. **Application Recovery**
```bash
# Rollback deployment
vercel rollback

# Verify application status
vercel logs
```

## Security Measures

### SSL/TLS Configuration
```nginx
# NGINX SSL Configuration
server {
    listen 443 ssl http2;
    server_name ivanprints.com;

    ssl_certificate /etc/letsencrypt/live/ivanprints.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ivanprints.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

### Security Headers
```typescript
// Next.js Security Headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

## Performance Optimization

### CDN Configuration
```typescript
// Next.js Image Configuration
module.exports = {
  images: {
    domains: ['storage.googleapis.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  }
};
```

### Caching Strategy
1. **Browser Caching**
```nginx
# NGINX Caching Configuration
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 7d;
    add_header Cache-Control "public, no-transform";
}
```

2. **API Caching**
```typescript
// API Route Caching
export const config = {
  runtime: 'edge',
  regions: ['iad1'],
  cache: {
    maxAge: 60,
    staleWhileRevalidate: 30,
  },
};
```

## Scaling Strategy

### Horizontal Scaling
1. **Load Balancing**
   - Algorithm: Round Robin
   - Health checks
   - SSL termination
   - Session affinity

2. **Auto Scaling**
   - Minimum instances: 2
   - Maximum instances: 10
   - Scale up: CPU > 70%
   - Scale down: CPU < 30%

### Database Scaling
1. **Connection Pooling**
   - Pool size: 20
   - Idle timeout: 10s
   - Maximum lifetime: 1h

2. **Read Replicas**
   - Number of replicas: 2
   - Region distribution
   - Automated failover
   - Load balancing

## Maintenance Procedures

### Routine Maintenance
1. **Database Maintenance**
```bash
# Vacuum database
npm run db:vacuum

# Analyze tables
npm run db:analyze

# Update statistics
npm run db:update-stats
```

2. **Application Maintenance**
```bash
# Clear cache
npm run cache:clear

# Update dependencies
npm run deps:update

# Run security audit
npm run security:audit
```

### Emergency Procedures
1. **Incident Response**
   - Issue identification
   - Impact assessment
   - Resolution steps
   - Post-mortem analysis

2. **Communication Plan**
   - Internal notification
   - User communication
   - Status updates
   - Resolution confirmation

## Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions) 