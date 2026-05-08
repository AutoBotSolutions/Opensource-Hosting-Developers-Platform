# Deployment Procedures

This guide covers all procedures for deploying the HostingCo system to production environments.

## Deployment Overview

The HostingCo system supports multiple deployment strategies:

- **Docker Compose** (Recommended for production)
- **Kubernetes** (For large-scale deployments)
- **Traditional Server** (Direct server deployment)
- **Cloud Platforms** (AWS, Google Cloud, Azure)

## Docker Compose Deployment (Recommended)

### Prerequisites
- Docker 20.10.0 or higher
- Docker Compose 2.0.0 or higher
- Server with at least 4GB RAM
- SSL certificates (optional but recommended)

### Step 1: Project Setup
```bash
# Clone repository
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system

# Install all dependencies
npm run install:all

# Copy environment configuration
cp .env.example .env
```

### Step 2: Build for Production
```bash
# Build all packages for production
npm run build

# Or build individual packages
npm run build:backend
npm run build:frontend
npm run build:shared  # from shared directory
```

### Step 3: Docker Deployment
```bash
# Build and start with Docker Compose
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 4: Configure Production Environment
**Production .env**:
```env
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://hostingco:secure_password@postgres:5432/hostingco
POSTGRES_DB=hostingco
POSTGRES_USER=hostingco
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret-change-this
JWT_EXPIRES_IN=24h

# Frontend
FRONTEND_URL=https://yourdomain.com

# Email
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# SSL
SSL_CERT_PATH=/etc/nginx/ssl/certificate.crt
SSL_KEY_PATH=/etc/nginx/ssl/private.key
```

### Step 5: Production Docker Compose
**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - hostingco-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://hostingco:secure_password@postgres:5432/hostingco
      - REDIS_URL=redis://redis:6379
      - FRONTEND_URL=https://yourdomain.com
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads
    networks:
      - hostingco-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=hostingco
      - POSTGRES_USER=hostingco
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - hostingco-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - hostingco-network

volumes:
  postgres_data:
  redis_data:

networks:
  hostingco-network:
    driver: bridge
```

### Step 6: Build and Deploy
```bash
# Use automated deployment scripts (recommended)
./scripts/build.sh production
./scripts/deploy.sh production

# Or use Docker scripts:
./scripts/docker-build.sh production
./scripts/docker-up.sh production

# Or use docker-compose directly:
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
docker-compose -f docker-compose.prod.yml exec backend npm run seed

# Check services status
docker-compose -f docker-compose.prod.yml ps
```

### Step 5: SSL Configuration
```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt

# Or use Let's Encrypt (for production)
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private.key
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (v1.24+)
- kubectl configured
- Helm 3.0+ (optional)

### Step 1: Create Kubernetes Manifests
**namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hostingco
```

**configmap.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hostingco-config
  namespace: hostingco
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  FRONTEND_URL: "https://yourdomain.com"
```

**secret.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hostingco-secrets
  namespace: hostingco
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

**backend-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: hostingco
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: hostingco/backend:latest
        ports:
        - containerPort: 3003
        envFrom:
        - configMapRef:
            name: hostingco-config
        - secretRef:
            name: hostingco-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Step 2: Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n hostingco
kubectl get services -n hostingco

# Check logs
kubectl logs -f deployment/backend -n hostingco
```

## Traditional Server Deployment

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+ installed
- PostgreSQL 15+
- Redis 7+
- Nginx

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Application Setup
```bash
# Create application user
sudo useradd -m -s /bin/bash hostingco
sudo usermod -aG sudo hostingco

# Clone repository
sudo -u hostingco git clone https://github.com/your-org/hostingco-system.git /home/hostingco/app
cd /home/hostingco/app

# Install dependencies
sudo -u hostingco npm run install:all

# Build applications
sudo -u hostingco npm run build

# Setup database
sudo -u postgres createdb hostingco
sudo -u postgres createuser hostingco
sudo -u postgres psql -c "ALTER USER hostingco PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hostingco TO hostingco;"

# Run migrations
sudo -u hostingco cd backend && npm run migrate && npm run seed
```

### Step 3: Systemd Services
**backend.service**:
```ini
[Unit]
Description=HostingCo Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=hostingco
WorkingDirectory=/home/hostingco/app/backend
Environment=NODE_ENV=production
Environment=PORT=3003
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Install service files
sudo cp backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable backend
sudo systemctl start backend
```

### Step 4: Nginx Configuration
**/etc/nginx/sites-available/hostingco**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    root /home/hostingco/app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hostingco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🌩️ Cloud Platform Deployment

### AWS Deployment
**Using AWS ECS with Fargate**:

1. **Create ECR Repository**:
```bash
aws ecr create-repository --repository-name hostingco-backend
aws ecr create-repository --repository-name hostingco-frontend
```

2. **Build and Push Images**:
```bash
# Backend
docker build -t hostingco-backend ./backend
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
docker tag hostingco-backend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/hostingco-backend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/hostingco-backend:latest

# Frontend (similar process)
```

3. **Create ECS Task Definition**:
```json
{
  "family": "hostingco",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-west-2.amazonaws.com/hostingco-backend:latest",
      "portMappings": [
        {
          "containerPort": 3003,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hostingco",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform
**Using Cloud Run**:

```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT-ID/hostingco-backend ./backend
gcloud run deploy hostingco-backend --image gcr.io/PROJECT-ID/hostingco-backend --platform managed

# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT-ID/hostingco-frontend ./frontend
gcloud run deploy hostingco-frontend --image gcr.io/PROJECT-ID/hostingco-frontend --platform managed
```

### Azure Deployment
**Using Azure Container Instances**:

```bash
# Create resource group
az group create --name hostingco-rg --location eastus

# Deploy containers
az container create \
  --resource-group hostingco-rg \
  --name hostingco-backend \
  --image hostingco/backend:latest \
  --dns-name-label hostingco-backend \
  --ports 3003
```

## Deployment Pipeline

### GitHub Actions CI/CD
**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm run install:all
      - run: npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          docker build -t hostingco-backend ./backend
          docker build -t hostingco-frontend ./frontend
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push hostingco-backend:latest
          docker push hostingco-frontend:latest
      
      - name: Deploy to production
        run: |
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} "
            cd /opt/hostingco &&
            docker-compose pull &&
            docker-compose up -d
          "
```

## Monitoring and Logging

### Application Monitoring
```bash
# Health checks
curl https://yourdomain.com/api/health

# Monitor logs
docker-compose logs -f backend
docker-compose logs -f frontend

# System metrics
docker stats
```

### Database Monitoring
```bash
# Connection status
psql -h localhost -U hostingco -d hostingco -c "SELECT * FROM pg_stat_activity;"

# Database size
psql -h localhost -U hostingco -d hostingco -c "SELECT pg_size_pretty(pg_database_size('hostingco'));"

# Slow queries
psql -h localhost -U hostingco -d hostingco -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Performance Monitoring
```bash
# Install monitoring tools
npm install -g @pm2/io
pm2 start ecosystem.config.js

# Monitor with PM2
pm2 monit
pm2 logs
```

## 🔒 Security Considerations

### SSL/TLS Configuration
```bash
# Install SSL certificates
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Security Headers
**Nginx security headers**:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Update and Maintenance

### Rolling Updates
```bash
# Docker Compose rolling update
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# Kubernetes rolling update
kubectl set image deployment/backend backend=hostingco/backend:v2 -n hostingco
```

### Backup Procedures
```bash
# Database backup
pg_dump -h localhost -U hostingco hostingco > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U hostingco hostingco > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/hostingco

# Content:
/var/log/hostingco/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 hostingco hostingco
    postrotate
        systemctl reload nginx
    endscript
}
```

## Troubleshooting Deployment

### Common Issues
1. **Port conflicts**: Check if ports 80, 443, 3003 are available
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **SSL certificates**: Ensure certificates are properly configured
4. **Memory issues**: Monitor server resources and scale if needed

### Health Checks
```bash
# Check all services
systemctl status nginx postgresql redis backend

# Check ports
netstat -tlnp | grep -E ":80|:443|:3003"

# Check logs
journalctl -u backend -f
tail -f /var/log/nginx/error.log
```

### Performance Issues
```bash
# Check system resources
top
htop
df -h
free -m

# Check database performance
psql -h localhost -U hostingco -d hostingco -c "SELECT * FROM pg_stat_activity;"

# Optimize database
psql -h localhost -U hostingco -d hostingco -c "VACUUM ANALYZE;"
```

---

*Last updated: $(date)*
