# Quick Start Guide

Get the HostingCo system running in minutes with this quick start guide.

## Prerequisites (Verified)

- **Node.js**: 18+ (verified: v20.19.2)
- **npm**: 8+ (verified: v9.2.0)
- **Git**: For version control
- **PostgreSQL**: 15+ (optional for development)
- **Redis**: 7+ (optional for development)

## Quick Setup (Verified)

### Method 1: Manual Setup (Recommended)
```bash
# 1. Clone repository
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system

# 2. Install all dependencies
npm run install:all

# 3. Start development servers
npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3003
# Health Check: http://localhost:3003/api/health
```

### Method 2: Docker Setup
```bash
# 1. Clone and setup
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system
cp .env.example .env

# 2. Start with Docker
docker-compose up -d --build

# 3. Check status
docker-compose ps
```

### Manual Setup Steps

#### 1. Clone and Install (Verified)
```bash
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system
npm run install:all
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional for development)
nano .env
```

#### 3. Build and Start (Verified)
```bash
# Build all packages
npm run build

# Start development servers
npm run dev

# Or start individually:
npm run dev:backend    # Backend on port 3003
npm run dev:frontend   # Frontend on port 3000
```

## Verification (Verified Commands)

### Check System Status
```bash
# Check if services are running
curl http://localhost:3003/api/health
curl http://localhost:3000

# Check processes
ps aux | grep -E "(node|vite)" | grep -v grep

# Test API endpoints
curl http://localhost:3003/api/hosting/plans
```

### Expected Output
```json
# Health check response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-08T03:52:58.868Z",
    "uptime": 571.586811102,
    "environment": "development"
  }
}
```

## Access Points

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003/api
- **Health Check**: http://localhost:3003/api/health
- **Hosting Plans**: http://localhost:3003/api/hosting/plans

### Default Login
- **Email**: admin@hostingco.com
- **Password**: admin123

## 📁 Project Structure (Current)
```
HostingCo/
├── backend/          # Node.js API (port 3003)
├── frontend/         # React SPA (port 3000)
├── shared/           # TypeScript types
├── data/             # Seed data & config
├── scripts/          # Automation scripts
├── docs/             # Documentation
└── logs/             # Application logs
```

## Common Commands (Verified)

```bash
# Development
npm run dev              # Start both servers
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Building
npm run build            # Build all packages
npm run build:backend    # Backend compilation
npm run build:frontend   # Frontend build

# Testing
npm run test             # Run all tests
npm run test:backend     # Backend tests
npm run test:frontend    # Frontend tests

# Production
npm start                # Start production server
```

## Troubleshooting

### Services Already Running
```bash
# Check current status
curl http://localhost:3003/api/health

# If restart needed
pkill -f "npm run dev"
npm run dev
```

### Authentication Issues
```bash
# Get auth token
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostingco.com","password":"admin123"}'
```

### Port Conflicts
```bash
# Check port usage
lsof -i :3000  # Frontend
lsof -i :3003  # Backend

# Kill processes if needed
sudo fuser -k 3000/tcp
sudo fuser -k 3003/tcp
```

## Next Steps

1. **Explore the API**: Test endpoints at http://localhost:3003/api
2. **Review Documentation**: Check `/docs` directory for detailed guides
3. **Data Management**: See `/data` directory for seed data and configuration
4. **Development**: Refer to [Development Guide](./development-guide.md)

---

*Last updated: 2026-05-08*

# Or set up manually:
# Create database
sudo -u postgres createdb hostingco
sudo -u postgres createuser hostingco
sudo -u postgres psql -c "ALTER USER hostingco PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hostingco TO hostingco;"

# Run migrations and seed
cd backend
npm run migrate
npm run seed
```

#### 4. Start Servers
```bash
# Use automated startup (recommended)
./scripts/dev.sh

# Or start manually:
# Start both frontend and backend
npm run dev
```

## Access the System

- **Frontend Panel**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **API Health Check**: http://localhost:3003/api/health

## First Login

1. Open http://localhost:3000 in your browser
2. Login with default admin credentials:
   - Email: `admin@hostingco.com`
   - Password: `admin123`
3. Change the default password immediately

## Quick Test

```bash
# Use automated health check
./scripts/health-check.sh --detailed

# Test API health manually
curl http://localhost:3003/api/health

# Test authentication
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostingco.com","password":"admin123"}'
```

## Common Commands

```bash
# Development servers (automated)
./scripts/dev.sh           # Start both servers
./scripts/dev-backend.sh   # Backend only
./scripts/dev-frontend.sh  # Frontend only

# Development servers (manual)
npm run dev              # Start both servers
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Database operations (automated)
./scripts/db-migrate.sh development    # Run migrations
./scripts/db-seed.sh development       # Seed data
./scripts/db-reset.sh development      # Reset database

# Database operations (manual)
npm run migrate          # Run migrations
npm run seed             # Seed data
npm run db:reset         # Reset database

# Testing (automated)
./scripts/test.sh all                   # Run all tests
./scripts/test-watch.sh all             # Watch mode
./scripts/test-coverage.sh all          # Coverage report

# Testing (manual)
npm test                 # Run all tests
npm run test:backend     # Backend tests
npm run test:frontend    # Frontend tests

# Building
npm run build            # Build both
npm run build:backend    # Build backend
npm run build:frontend   # Build frontend
```

## Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
ss -tlnp | grep -E ":300[03]"
# Kill processes or change ports in .env files
```

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Test connection
psql -h localhost -U hostingco -d hostingco
```

### Common Issues
- **Backend won't start**: Check DATABASE_URL in .env
- **Frontend can't connect**: Backend must be running on port 3003
- **Database errors**: Ensure PostgreSQL is running and user has permissions

## Next Steps

- [Installation Guide](./installation.md) - Detailed setup instructions
- [Development Guide](./development.md) - Development environment setup
- [API Reference](./api-reference.md) - Complete API documentation
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

---

*Last updated: $(date)*
