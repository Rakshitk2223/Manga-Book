# Manga-Book App - Deployment & DevOps Guide

## Current State & Deployment Strategy

### Development Environment (Current)
```
Frontend: Static HTML/CSS/JS (served locally)
Backend: Node.js/Express (localhost:5000)
Database: MongoDB (localhost:27017)
```

### Recommended Production Architecture
```
Frontend: Static hosting (Netlify/Vercel/GitHub Pages)
Backend: Node.js hosting (Heroku/Railway/DigitalOcean)
Database: MongoDB Atlas (managed cloud database)
CDN: Cloudflare (for static assets and caching)
```

## Deployment Pipeline Setup

### Phase 1: Basic Production Deployment

#### 1. Database Migration (MongoDB Atlas)
```bash
# Sign up for MongoDB Atlas
# Create cluster and get connection string
# Example connection string:
# mongodb+srv://username:password@cluster.mongodb.net/mangabook?retryWrites=true&w=majority
```

**Update Environment Variables:**
```env
# Production .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mangabook
JWT_SECRET=super-secure-jwt-secret-for-production-min-32-chars
PORT=5000
NODE_ENV=production
```

#### 2. Backend Deployment (Heroku)
```bash
# Install Heroku CLI
# heroku --version

# Login and create app
heroku login
heroku create manga-book-api

# Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-production-jwt-secret"
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix=backend heroku main
```

**Alternative: Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add --service mongodb
railway deploy
```

#### 3. Frontend Deployment (Netlify)
```bash
# Update API_URL in script.js
const API_URL = 'https://manga-book-api.herokuapp.com/api';

# Deploy to Netlify
# Option 1: Drag and drop (root folder to Netlify dashboard)
# Option 2: Netlify CLI
npm install -g netlify-cli
netlify deploy
netlify deploy --prod
```

### Phase 2: CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Manga-Book App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: cd backend && npm ci
    - run: cd backend && npm test
    
  deploy-backend:
    needs: test-backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "manga-book-api"
        heroku_email: "your-email@example.com"
        appdir: "backend"
        
  deploy-frontend:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - run: npm install -g netlify-cli
    - run: netlify deploy --prod --dir=. --site=${{secrets.NETLIFY_SITE_ID}}
      env:
        NETLIFY_AUTH_TOKEN: ${{secrets.NETLIFY_AUTH_TOKEN}}
```

#### Environment Secrets Setup
```bash
# GitHub Repository Secrets
HEROKU_API_KEY=your-heroku-api-key
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-netlify-site-id
MONGODB_ATLAS_URI=your-mongodb-connection-string
JWT_SECRET=your-production-jwt-secret
```

### Phase 3: Advanced DevOps Features

#### Docker Containerization
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/mangabook
      - JWT_SECRET=dev-secret
    depends_on:
      - mongo
      
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
      
volumes:
  mongo-data:
```

#### Kubernetes Deployment (Advanced)
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: manga-book-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: manga-book-api
  template:
    metadata:
      labels:
        app: manga-book-api
    spec:
      containers:
      - name: api
        image: your-registry/manga-book-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: token
```

## Monitoring & Observability

### Application Monitoring
```javascript
// backend/middleware/monitoring.js
const morgan = require('morgan');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Request logging middleware
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

module.exports = { logger };
```

### Health Check Endpoints
```javascript
// backend/routes/health.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Check external API availability
    const jikanStatus = await checkJikanAPI();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      externalAPIs: {
        jikan: jikanStatus
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

async function checkJikanAPI() {
  try {
    const response = await fetch('https://api.jikan.moe/v4/anime/1');
    return response.ok ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

module.exports = router;
```

### Error Tracking (Sentry Integration)
```javascript
// backend/middleware/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());

// Frontend error tracking
// Add to script.js
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

## Security Hardening

### Production Security Checklist
```javascript
// backend/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.jikan.moe"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Auth endpoint rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 5 attempts per 15 minutes
});
app.use('/api/auth/', authLimiter);

// NoSQL injection prevention
app.use(mongoSanitize());
```

### SSL/HTTPS Configuration
```javascript
// backend/server.js - HTTPS setup for production
if (process.env.NODE_ENV === 'production') {
  const https = require('https');
  const fs = require('fs');
  
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
  };
  
  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
}
```

## Performance Optimization

### Database Indexing
```javascript
// backend/models/User.js - Add indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// backend/models/MangaList.js
mangaListSchema.index({ userId: 1 });
mangaListSchema.index({ 'categories.manga.title': 'text' });
```

### Caching Strategy
```javascript
// backend/middleware/cache.js
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};

// Use caching for manga list endpoint
app.get('/api/list', authenticateToken, cache(300), getMangaList);
```

### CDN Configuration
```html
<!-- index.html - CDN for static assets -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://cdn.jsdelivr.net">

<!-- Use CDN for libraries in production -->
<script src="https://cdn.jsdelivr.net/npm/axios@1.5.0/dist/axios.min.js"></script>
```

## Backup & Recovery

### Database Backup Strategy
```bash
# Automated MongoDB Atlas backups (built-in)
# Manual backup script for self-hosted MongoDB
#!/bin/bash
# backup-mongo.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mangabook_backup_$DATE"
BACKUP_PATH="/backups/$BACKUP_NAME"

mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH"
tar -czf "$BACKUP_PATH.tar.gz" "$BACKUP_PATH"
rm -rf "$BACKUP_PATH"

# Upload to S3 or similar
aws s3 cp "$BACKUP_PATH.tar.gz" s3://your-backup-bucket/
```

### Disaster Recovery Plan
1. **Database Recovery**: Restore from MongoDB Atlas point-in-time recovery
2. **Application Recovery**: Redeploy from Git repository
3. **Configuration Recovery**: Environment variables stored in CI/CD secrets
4. **DNS Recovery**: Cloudflare DNS configuration backup

## Cost Optimization

### Resource Planning
```yaml
# Estimated Monthly Costs (USD)
Development:
  - MongoDB Atlas (M0): $0 (Free tier)
  - Heroku Dyno: $7 (Eco dyno)
  - Netlify: $0 (Free tier)
  Total: ~$7/month

Production (Small Scale):
  - MongoDB Atlas (M2): $57
  - Heroku Professional: $25
  - Netlify Pro: $19
  - Cloudflare Pro: $20
  Total: ~$121/month

Production (Medium Scale):
  - MongoDB Atlas (M10): $57
  - DigitalOcean Droplet: $24
  - Netlify Business: $99
  - Cloudflare Business: $200
  Total: ~$380/month
```

## Maintenance & Updates

### Update Strategy
```bash
# Automated dependency updates
npm install -g npm-check-updates
ncu -u
npm audit fix

# Security updates
npm audit
npm audit fix --force
```

### Rollback Strategy
```bash
# Heroku rollback
heroku releases --app manga-book-api
heroku rollback v123 --app manga-book-api

# Database rollback (MongoDB Atlas)
# Use point-in-time recovery from Atlas dashboard
```

---

## Summary

This deployment guide provides a comprehensive roadmap for taking your Manga-Book app from development to production. The recommended approach is:

1. **Start Simple**: Deploy to Heroku + Netlify + MongoDB Atlas
2. **Add Monitoring**: Implement health checks and error tracking
3. **Enhance Security**: Add rate limiting and security headers
4. **Scale Gradually**: Move to containerized deployments when needed

The total setup time for basic production deployment should be 2-4 hours, with advanced features adding additional time as needed.

---

*Deployment Guide Version: 1.0*
*Target Environments: Development → Staging → Production*
