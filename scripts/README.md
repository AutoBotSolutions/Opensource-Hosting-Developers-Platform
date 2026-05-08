# HostingCo Scripts

This directory contains automation scripts for the HostingCo project management system.

## 📋 Script Categories

### 🗄️ Database Management
- **`db-migrate.sh`** - Run database migrations
- **`db-seed.sh`** - Seed database with test data
- **`db-reset.sh`** - Reset database to clean state

### 🚀 Development
- **`dev.sh`** - Start both frontend and backend development servers
- **`dev-backend.sh`** - Start backend development server only
- **`dev-frontend.sh`** - Start frontend development server only

### 🏗️ Build & Deploy
- **`build.sh`** - Build project for production
- **`deploy.sh`** - Deploy to staging/production environments

### 🧪 Testing
- **`test.sh`** - Run test suites
- **`test-watch.sh`** - Run tests in watch mode
- **`test-coverage.sh`** - Generate coverage reports

### 🐳 Docker
- **`docker-build.sh`** - Build Docker images
- **`docker-up.sh`** - Start Docker environment
- **`docker-down.sh`** - Stop Docker environment

### 🔧 Maintenance
- **`clean.sh`** - Clean build artifacts and cache
- **`setup.sh`** - Initial project setup
- **`health-check.sh`** - Monitor application health

## 🚀 Quick Start

### Initial Setup
```bash
# Set up the project for development
./scripts/setup.sh development

# Or for Docker setup
./scripts/setup.sh development --docker
```

### Development Workflow
```bash
# Start development servers
./scripts/dev.sh

# Run tests
./scripts/test.sh

# Build for production
./scripts/build.sh production

# Deploy to staging
./scripts/deploy.sh staging
```

### Docker Workflow
```bash
# Build Docker images
./scripts/docker-build.sh production

# Start Docker environment
./scripts/docker-up.sh production

# Check health
./scripts/health-check.sh --detailed

# Stop Docker environment
./scripts/docker-down.sh --volumes
```

## 📖 Detailed Usage

### Database Scripts

#### db-migrate.sh
Run database migrations for specific environments.

```bash
# Migrate development database
./scripts/db-migrate.sh development

# Migrate production database
./scripts/db-migrate.sh production
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string

#### db-seed.sh
Seed database with test data.

```bash
# Seed all test data
./scripts/db-seed.sh development

# Seed only users
./scripts/db-seed.sh development users

# Seed hosting data
./scripts/db-seed.sh development hosting
```

#### db-reset.sh
Reset database to clean state.

```bash
# Reset development database
./scripts/db-reset.sh development

# Force reset without confirmation
./scripts/db-reset.sh development --force
```

⚠️ **Warning:** This will delete all data in the database.

### Development Scripts

#### dev.sh
Start both frontend and backend development servers.

```bash
# Start both servers
./scripts/dev.sh

# Start with custom ports
./scripts/dev.sh --port-backend 3004 --port-frontend 3001

# Start without detailed logs
./scripts/dev.sh --no-logs

# Start only backend
./scripts/dev.sh --backend-only

# Start only frontend
./scripts/dev.sh --frontend-only
```

#### dev-backend.sh
Start backend development server only.

```bash
# Start backend with default port
./scripts/dev-backend.sh

# Start with custom port and debug mode
./scripts/dev-backend.sh --port 3004 --debug

# Start without file watching
./scripts/dev-backend.sh --no-watch
```

#### dev-frontend.sh
Start frontend development server only.

```bash
# Start frontend with default port
./scripts/dev-frontend.sh

# Start with custom port and open browser
./scripts/dev-frontend.sh --port 3001 --open

# Start on different host
./scripts/dev-frontend.sh --host 0.0.0.0
```

### Build & Deploy Scripts

#### build.sh
Build project for specific environments.

```bash
# Build for production
./scripts/build.sh production

# Build with analysis and verbose output
./scripts/build.sh production --analyze --verbose

# Build without tests and linting
./scripts/build.sh production --skip-tests --skip-lint
```

#### deploy.sh
Deploy to staging or production environments.

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production with force
./scripts/deploy.sh production --force

# Dry run deployment
./scripts/deploy.sh staging --dry-run
```

**Environment Variables:**
- `DEPLOY_USER` - SSH user for deployment
- `DEPLOY_HOST_STAGING` - Staging server host
- `DEPLOY_HOST_PRODUCTION` - Production server host

### Testing Scripts

#### test.sh
Run test suites with various options.

```bash
# Run all tests
./scripts/test.sh

# Run only backend tests
./scripts/test.sh backend

# Run tests with coverage and report
./scripts/test.sh all --coverage --report

# Run tests with auto-fix
./scripts/test.sh all --fix
```

#### test-watch.sh
Run tests in watch mode.

```bash
# Watch all tests
./scripts/test-watch.sh all

# Watch only backend tests
./scripts/test-watch.sh backend
```

#### test-coverage.sh
Generate coverage reports.

```bash
# Generate coverage for all components
./scripts/test-coverage.sh all

# Generate with HTML reports and comparison
./scripts/test-coverage.sh all --html --compare

# Set custom threshold
./scripts/test-coverage.sh all --threshold 90
```

### Docker Scripts

#### docker-build.sh
Build Docker images for deployment.

```bash
# Build for production
./scripts/docker-build.sh production

# Build without cache and push
./scripts/docker-build.sh production --no-cache --push

# Build with custom tag
./scripts/docker-build.sh production --tag v1.0.0
```

**Environment Variables:**
- `DOCKER_REGISTRY` - Docker registry URL

#### docker-up.sh
Start Docker environment.

```bash
# Start development environment
./scripts/docker-up.sh development

# Start with build and logs
./scripts/docker-up.sh development --build --logs

# Scale services
./scripts/docker-up.sh production --scale backend=3
```

#### docker-down.sh
Stop Docker environment.

```bash
# Stop services
./scripts/docker-down.sh

# Stop with volume cleanup
./scripts/docker-down.sh --volumes --remove-orphans

# Force shutdown
./scripts/docker-down.sh --force --timeout 10
```

### Maintenance Scripts

#### clean.sh
Clean build artifacts and cache.

```bash
# Basic clean
./scripts/clean.sh

# Deep clean including node_modules
./scripts/clean.sh --deep --node-modules

# Clean Docker resources
./scripts/clean.sh --docker

# Clean everything
./scripts/clean.sh --all
```

#### setup.sh
Initial project setup.

```bash
# Setup for development
./scripts/setup.sh development

# Setup for Docker
./scripts/setup.sh production --docker

# Setup without dependencies
./scripts/setup.sh development --skip-deps
```

#### health-check.sh
Monitor application health.

```bash
# Basic health check
./scripts/health-check.sh

# Detailed health check
./scripts/health-check.sh --detailed

# Watch mode with JSON output
./scripts/health-check.sh --watch --output json

# Custom endpoints and timeout
./scripts/health-check.sh --backend-url http://api.example.com --timeout 5
```

## 🔧 Configuration

### Environment Files
Scripts use environment-specific configuration files:

- `.env.development` - Development configuration
- `.env.staging` - Staging configuration  
- `.env.production` - Production configuration

### Required Environment Variables

#### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS

#### Frontend
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_ENVIRONMENT` - Environment name

#### Docker
- `COMPOSE_PROJECT_NAME` - Docker Compose project name
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password

## 🚨 Safety Features

### Confirmation Prompts
Destructive operations require confirmation:
- Database reset
- Production deployment
- Volume deletion
- Complete cleanup

### Backup Creation
- Automatic database backups before reset
- Build artifacts preservation
- Configuration file backup

### Error Handling
- Graceful failure with informative messages
- Rollback capabilities for deployment
- Health checks before operations

## 📊 Output Formats

### Health Check Formats
```bash
# Table format (default)
./scripts/health-check.sh --output table

# JSON format
./scripts/health-check.sh --output json

# CSV format
./scripts/health-check.sh --output csv
```

### Test Reports
- Markdown reports with coverage details
- JSON output for CI/CD integration
- HTML coverage reports

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Setup project
        run: ./scripts/setup.sh development --skip-env
      
      - name: Run tests
        run: ./scripts/test.sh all --coverage --report
      
      - name: Build project
        run: ./scripts/build.sh production
      
      - name: Health check
        run: ./scripts/health-check.sh --detailed
```

## 🛠️ Troubleshooting

### Common Issues

#### Permission Denied
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3003

# Use different ports
./scripts/dev.sh --port-backend 3004 --port-frontend 3001
```

#### Database Connection
```bash
# Check database connectivity
./scripts/health-check.sh --detailed

# Reset database
./scripts/db-reset.sh development --force
```

#### Docker Issues
```bash
# Clean Docker resources
./scripts/clean.sh --docker

# Rebuild images
./scripts/docker-build.sh production --no-cache
```

### Debug Mode
Enable verbose output for debugging:
```bash
# Verbose build
./scripts/build.sh production --verbose

# Verbose tests
./scripts/test.sh all --verbose

# Detailed health check
./scripts/health-check.sh --detailed --watch
```

## 📝 Development Guidelines

### Adding New Scripts
1. Use consistent naming convention
2. Include help text with `--help` flag
3. Use color-coded output for better UX
4. Include error handling and validation
5. Add documentation to this README

### Script Structure
```bash
#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# ... other colors

# Parse arguments
# Main logic
# Helper functions
```

### Best Practices
- Use `set -e` for error handling
- Provide meaningful error messages
- Include confirmation prompts for destructive actions
- Support multiple environments
- Use consistent logging format

## 📞 Support

For issues with the scripts:
1. Check the troubleshooting section above
2. Run with `--verbose` flag for detailed output
3. Check environment configuration
4. Verify system requirements

For project-specific issues, refer to the main project documentation.
