# Deployment Guide

This guide covers the complete deployment process for the Lovas Zoltán György political website, including production configuration, environment setup, and deployment procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.17.0 or later
- **npm**: 9.0.0 or later
- **Database**: MySQL 8.0+ or PostgreSQL 13+
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: 20GB+ available space

### Required Services

- **Email Service**: Resend account with verified domain
- **Database**: MySQL/PostgreSQL server or managed database service
- **Hosting**: Vercel, Railway, DigitalOcean, or similar
- **Domain**: Registered domain with SSL certificate

## Environment Configuration

### 1. Environment Variables Setup

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

### 2. Configure Required Variables

Edit `.env.production` and set all required variables:

```bash
# Basic Configuration
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
PORT=3000

# Database
DATABASE_URL=mysql://user:password@host:port/database
DIRECT_URL=mysql://user:password@host:port/database

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-32-character-secret-here

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password

# Email Service
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM_DOMAIN=noreply@yourdomain.com

# Security
CSRF_SECRET=your-32-character-csrf-secret
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 3. Generate Secure Secrets

Use these commands to generate secure secrets:

```bash
# Generate NextAuth Secret
openssl rand -base64 32

# Generate CSRF Secret
openssl rand -base64 32

# Generate Encryption Key
openssl rand -base64 32
```

### 4. Validate Environment

Run the environment validation script:

```bash
npm run validate:production
```

## Database Setup

### 1. Create Database

Create a new database for the application:

```sql
-- MySQL
CREATE DATABASE lovaszoltan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lovaszoltan_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON lovaszoltan_db.* TO 'lovaszoltan_user'@'%';
FLUSH PRIVILEGES;

-- PostgreSQL
CREATE DATABASE lovaszoltan_db;
CREATE USER lovaszoltan_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE lovaszoltan_db TO lovaszoltan_user;
```

### 2. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 3. Verify Database Setup

```bash
# Test database connection
npx prisma db pull
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.production`
   - Set `NODE_ENV=production`

3. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm ci"
   }
   ```

### Option 2: Railway

1. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Configure Environment Variables**
   - Use Railway dashboard to set environment variables
   - Or use Railway CLI: `railway variables set KEY=value`

### Option 3: DigitalOcean App Platform

1. **Create App Spec**
   ```yaml
   name: lovas-political-site
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/lovas-political-site
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     # Add other environment variables
   ```

### Option 4: Self-Hosted (Ubuntu/Debian)

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/lovas-political-site.git
   cd lovas-political-site
   
   # Install dependencies
   npm ci
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "lovas-site" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Production Checklist

### Pre-Deployment

- [ ] Environment variables configured and validated
- [ ] Database created and migrations run
- [ ] Email service configured and tested
- [ ] Domain and SSL certificate configured
- [ ] Security secrets generated and stored securely
- [ ] Code reviewed and tested
- [ ] Build process tested locally

### Security Checklist

- [ ] All secrets are 32+ characters long
- [ ] Admin password is strong and unique
- [ ] Database user has minimal required permissions
- [ ] HTTPS enabled on all domains
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Input sanitization enabled
- [ ] Error handling doesn't expose sensitive data
- [ ] File upload restrictions configured
- [ ] Session timeout configured

### Performance Checklist

- [ ] Image optimization enabled
- [ ] Lazy loading implemented
- [ ] Database queries optimized
- [ ] Caching headers configured
- [ ] CDN configured (if applicable)
- [ ] Bundle size optimized
- [ ] Memory usage monitored

### SEO Checklist

- [ ] Meta tags configured
- [ ] Structured data implemented
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Google Analytics configured
- [ ] Search Console verification
- [ ] Social media meta tags

## Monitoring & Maintenance

### Health Checks

The application provides several health check endpoints:

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed readiness check
curl https://yourdomain.com/api/ready

# Environment info
curl https://yourdomain.com/api/env
```

### Monitoring Setup

1. **Application Monitoring**
   - Set up Uptime Robot or similar for uptime monitoring
   - Configure alerts for API health checks
   - Monitor application logs for errors

2. **Database Monitoring**
   - Monitor database performance and connections
   - Set up automated backups
   - Monitor disk space usage

3. **Performance Monitoring**
   - Use Google PageSpeed Insights for performance monitoring
   - Set up Core Web Vitals monitoring
   - Monitor server response times

### Backup Strategy

1. **Database Backups**
   ```bash
   # MySQL backup
   mysqldump -u user -p database > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # PostgreSQL backup
   pg_dump -U user database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **File Backups**
   ```bash
   # Backup uploaded files
   tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
   ```

3. **Automated Backups**
   - Set up daily database backups
   - Configure backup retention policy
   - Test backup restoration process

### Log Management

1. **Application Logs**
   ```bash
   # View PM2 logs
   pm2 logs lovas-site
   
   # View specific log files
   tail -f logs/error.log
   tail -f logs/access.log
   ```

2. **Log Rotation**
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/lovas-site
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check database connectivity
   npx prisma db pull
   
   # Verify DATABASE_URL format
   echo $DATABASE_URL
   ```

2. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment Variable Issues**
   ```bash
   # Validate environment
   npm run validate:env
   
   # Check environment loading
   node -e "console.log(process.env.NODE_ENV)"
   ```

4. **Email Not Sending**
   ```bash
   # Test Resend API key
   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

5. **Performance Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check disk space
   df -h
   
   # Monitor application
   pm2 monit
   ```

### Debugging Steps

1. **Check Application Status**
   ```bash
   # Health check
   curl -I https://yourdomain.com/api/health
   
   # Check response times
   curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
   ```

2. **Review Logs**
   ```bash
   # Application logs
   pm2 logs lovas-site --lines 100
   
   # System logs
   sudo journalctl -u nginx -f
   ```

3. **Test Database**
   ```bash
   # Test connection
   npx prisma db pull
   
   # Check tables
   npx prisma studio
   ```

### Emergency Procedures

1. **Service Downtime**
   - Enable maintenance mode: Set `ENABLE_MAINTENANCE_MODE=true`
   - Check health endpoints
   - Review error logs
   - Rollback if necessary

2. **Database Issues**
   - Restore from backup
   - Check database server status
   - Verify connection strings

3. **Security Incident**
   - Change all passwords and secrets
   - Review access logs
   - Update security measures
   - Notify users if necessary

### Support Contacts

- **Technical Support**: admin@lovaszoltan.hu
- **Emergency Contact**: +36 (XX) XXX-XXXX
- **Hosting Provider**: [Provider Support]
- **Database Provider**: [Provider Support]

---

## Deployment Commands Quick Reference

```bash
# Environment validation
npm run validate:production

# Full deployment check
npm run deploy:check

# Database operations
npm run db:migrate
npm run db:seed

# Health checks
npm run health:check
npm run ready:check

# Build and start
npm run build
npm run start
```

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Railway Deployment Guide](https://docs.railway.app/)
- [DigitalOcean App Platform Guide](https://docs.digitalocean.com/products/app-platform/)

---

*Last updated: 2025-01-02*