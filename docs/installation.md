# Installation & Setup Guide

This guide covers the complete installation and setup process for the HostingCo system.

## Prerequisites

### System Requirements (Verified)
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **Node.js**: Version 18.0.0 or higher (verified: v20.19.2)
- **npm**: Version 8.0.0 or higher (verified: v9.2.0)
- **Git**: For version control

### Optional Requirements
- **PostgreSQL**: Version 15 or higher (optional for development)
- **Redis**: Version 7 or higher (optional for development)
- **Docker**: Version 20.10.0 or higher (for containerized deployment)
- **Docker Compose**: Version 2.0.0 or higher
- **Nginx**: For reverse proxy (production)

## Installation Methods

### Method 1: Manual Installation (Verified)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system
```

#### Step 2: Install Dependencies
```bash
# Install all dependencies for all packages
npm run install:all

# This installs dependencies for:
# - Root package (concurrently, etc.)
# - Backend package
# - Frontend package  
# - Shared package
```

#### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables as needed
nano .env
```

#### Step 4: Build Packages
```bash
# Build all packages for development
npm run build

# Or build individually:
npm run build:backend
npm run build:frontend
cd shared && npm run build
```

#### Step 5: Load Data (Optional)
```bash
# The system includes comprehensive seed data in /data directory
# Data is automatically loaded when the application starts
# See Data Management Guide for details
```

### Method 2: Docker Installation

#### Step 1: Clone and Setup
```bash
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system
cp .env.example .env
```

#### Step 2: Docker Build and Run
```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## Installation Verification

After installation, verify the system is working:

#### Check Dependencies
```bash
# Verify Node.js and npm versions
node --version  # Should be v18.0.0+
npm --version   # Should be v8.0.0+

# Verify package installation
ls node_modules
ls backend/node_modules
ls frontend/node_modules
ls shared/node_modules
```

#### Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# In separate terminals, you can also start individually:
npm run dev:backend    # Backend on port 3003
npm run dev:frontend   # Frontend on port 3000
```

#### Verify Services
```bash
# Test backend health
curl http://localhost:3003/api/health

# Test frontend
curl http://localhost:3000

# Test API endpoints
curl http://localhost:3003/api/hosting/plans
```

### Method 2: Standard Installation

#### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system
```

#### Step 2: Install Dependencies
```bash
# Install all dependencies for root, backend, frontend, and shared packages
npm run install:all
```

#### Step 3: Environment Configuration
```bash
# Copy environment example files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files with your configuration
nano .env
nano backend/.env
nano frontend/.env
```

#### Step 4: Database Setup
```bash
# Use automated database setup (recommended)
./scripts/db-migrate.sh development
./scripts/db-seed.sh development

# Or set up manually:
# Create PostgreSQL database
sudo -u postgres createdb hostingco

# Run database migrations
cd backend
npm run migrate

# Seed database with initial data
npm run seed
```

#### Step 5: Start Development Servers
```bash
# Use automated development startup (recommended)
./scripts/dev.sh

# Or start with individual scripts:
./scripts/dev-backend.sh    # Backend on port 3003
./scripts/dev-frontend.sh   # Frontend on port 3000

# Or use npm scripts:
npm run dev

# Or start individually:
npm run dev:backend  # Backend on port 3003
npm run dev:frontend # Frontend on port 3000
```

### Method 3: Docker Installation

#### Step 1: Clone and Configure
```bash
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system

# Use automated Docker setup (recommended)
./scripts/setup.sh development --docker
cp .env.example .env
```

#### Step 2: Start with Docker Compose
```bash
# Use automated Docker scripts (recommended)
./scripts/docker-up.sh development

# Or use docker-compose directly
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
./scripts/docker-down.sh

# Or stop with docker-compose
docker-compose down
```

#### Step 3: Initialize Database
```bash
# Use automated database setup (recommended)
./scripts/db-migrate.sh development
./scripts/db-seed.sh development

# Or run manually in container:
# Run migrations (executed in backend container)
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed
```

## Environment Configuration

### Root .env Configuration
```env
# Application
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://hostingco:password@localhost:5432/hostingco

# Redis
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Backend Configuration (backend/.env)
```env
# Server
PORT=3003
NODE_ENV=development

# Database
DATABASE_URL=postgresql://hostingco:password@localhost:5432/hostingco

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration (frontend/.env)
```env
# API URL
VITE_API_URL=http://localhost:3003/api

# WebSocket URL
VITE_WS_URL=ws://localhost:3003

# Application
VITE_APP_NAME=HostingCo
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## Database Setup

### PostgreSQL Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Create Database and User
```bash
sudo -u postgres psql
CREATE DATABASE hostingco;
CREATE USER hostingco WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE hostingco TO hostingco;
\q
```

### Redis Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS
```bash
brew install redis
brew services start redis
```

## Verification

### Check Installation
```bash
# Check backend health
curl http://localhost:3003/api/health

# Expected response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-08T03:14:24.942Z",
    "uptime": 7.844690395,
    "environment": "development"
  }
}
```

### Verify Frontend
- Open browser to: http://localhost:3000
- Should see HostingCo login panel

### Verify Database Connection
```bash
cd backend
npm run db:check
```

## Common Installation Issues

### Port Conflicts
If ports are already in use:
```bash
# Check what's using ports 3000, 3003
ss -tlnp | grep -E ":300[03]"

# Kill processes if needed
sudo kill -9 <PID>

# Or change ports in .env files
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U hostingco -d hostingco

# Reset database
cd backend
npm run db:reset
```

### Permission Issues
```bash
# Fix file permissions
chmod +x scripts/setup.sh
sudo chown -R $USER:$USER .

# Fix npm permissions
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
```

### Node.js Version Issues
```bash
# Check Node version
node --version
npm --version

# Install correct version using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Post-Installation Setup

### Create Admin User
```bash
cd backend
npm run create:admin -- --email admin@hostingco.com --password admin123 --name "System Administrator"
```

### Configure SSL (Production)
```bash
# Generate SSL certificates
sudo certbot --nginx -d yourdomain.com

# Or use self-signed for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt
```

### Setup Backup Scripts
```bash
# Copy backup scripts
cp scripts/backup.sh /usr/local/bin/hostingco-backup
chmod +x /usr/local/bin/hostingco-backup

# Setup cron job
crontab -e
# Add: 0 2 * * * /usr/local/bin/hostingco-backup
```

## Next Steps

After successful installation:

1. [Quick Start Guide](./quick-start.md) - Get familiar with the system
2. [Development Setup](./development.md) - Configure development environment
3. [API Reference](./api-reference.md) - Learn the API
4. [User Management](./user-management.md) - Create users and clients

## Getting Help

If you encounter issues during installation:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review system logs: `tail -f backend/logs/app.log`
3. Check GitHub Issues for known problems
4. Contact the development team

---

*Last updated: $(date)*
