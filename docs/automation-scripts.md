# Automation Scripts Reference

This comprehensive reference covers all automation scripts available in the HostingCo system, providing detailed usage instructions, examples, and best practices.

## Script Overview

The HostingCo project includes a complete suite of automation scripts that handle every aspect of the development lifecycle, from initial setup to deployment and maintenance.

### Script Categories

| Category | Scripts | Purpose |
|----------|---------|---------|
| **Database** | `db-migrate.sh`, `db-seed.sh`, `db-reset.sh` | Database operations and management |
| **Development** | `dev.sh`, `dev-backend.sh`, `dev-frontend.sh` | Development server management |
| **Build & Deploy** | `build.sh`, `deploy.sh` | Application building and deployment |
| **Testing** | `test.sh`, `test-watch.sh`, `test-coverage.sh` | Test execution and coverage analysis |
| **Docker** | `docker-build.sh`, `docker-up.sh`, `docker-down.sh` | Docker container management |
| **Maintenance** | `clean.sh`, `setup.sh`, `health-check.sh` | System maintenance and monitoring |

## Database Management Scripts

### db-migrate.sh
Run database migrations for specific environments with safety checks and rollback capabilities.

#### Usage
```bash
./scripts/db-migrate.sh [environment]
```

#### Environments
- `development` (default)
- `staging`
- `production`

#### Examples
```bash
# Migrate development database
./scripts/db-migrate.sh development

# Migrate production database
./scripts/db-migrate.sh production
```

#### Features
- Environment-specific configuration
- Pre-flight database connection checks
- Migration status reporting
- Production safety checks
- Detailed logging and error handling

### db-seed.sh
Seed database with test data for development and testing environments.

#### Usage
```bash
./scripts/db-seed.sh [environment] [seed-type]
```

#### Seed Types
- `all` (default) - All seed data
- `users` - User accounts and roles
- `hosting` - Hosting plans and servers
- `billing` - Billing and invoice data
- `support` - Support tickets and categories

#### Examples
```bash
# Seed all test data
./scripts/db-seed.sh development

# Seed only users
./scripts/db-seed.sh development users

# Seed hosting data for staging
./scripts/db-seed.sh staging hosting
```

#### Features
- Selective data seeding
- Production protection (no full seeding in prod)
- Data validation and integrity checks
- Progress reporting

### db-reset.sh
Reset database to clean state with automatic backup creation.

#### Usage
```bash
./scripts/db-reset.sh [environment] [--force]
```

#### Options
- `--force` - Skip confirmation prompts
- Environment-specific safety checks

#### Examples
```bash
# Reset development database
./scripts/db-reset.sh development

# Force reset without confirmation
./scripts/db-reset.sh development --force
```

#### Features
- Automatic backup creation (except development)
- Environment-specific safety checks
- Post-reset migration and seeding
- Rollback capabilities

## Development Scripts

### dev.sh
Unified development server startup with intelligent port management and service monitoring.

#### Usage
```bash
./scripts/dev.sh [options]
```

#### Options
- `--backend-only` - Start only backend server
- `--frontend-only` - Start only frontend server
- `--no-logs` - Suppress detailed logs
- `--port-backend PORT` - Set backend port (default: 3003)
- `--port-frontend PORT` - Set frontend port (default: 3000)

#### Examples
```bash
# Start both servers
./scripts/dev.sh

# Start with custom ports
./scripts/dev.sh --port-backend 3004 --port-frontend 3001

# Start only backend with debug mode
./scripts/dev.sh --backend-only --port-backend 3004
```

#### Features
- Intelligent port conflict detection
- Automatic dependency installation
- Environment file validation
- Service health monitoring
- Concurrent server management

### dev-backend.sh
Backend development server with advanced debugging and configuration options.

#### Usage
```bash
./scripts/dev-backend.sh [options]
```

#### Options
- `--port PORT` - Set backend port (default: 3003)
- `--no-logs` - Suppress detailed logs
- `--debug` - Enable debug mode
- `--no-watch` - Disable file watching

#### Examples
```bash
# Start backend with default settings
./scripts/dev-backend.sh

# Start with debug and custom port
./scripts/dev-backend.sh --debug --port 3004
```

#### Features
- TypeScript compilation checking
- Database connectivity validation
- Debug mode with enhanced logging
- Hot module replacement support

### dev-frontend.sh
Frontend development server with React/Vite optimization and browser integration.

#### Usage
```bash
./scripts/dev-frontend.sh [options]
```

#### Options
- `--port PORT` - Set frontend port (default: 3000)
- `--host HOST` - Set frontend host (default: localhost)
- `--no-logs` - Suppress detailed logs
- `--open` - Open browser automatically

#### Examples
```bash
# Start frontend with browser
./scripts/dev-frontend.sh --open

# Start on different host
./scripts/dev-frontend.sh --host 0.0.0.0
```

#### Features
- Backend connectivity validation
- TypeScript type checking
- Vite/React Scripts detection
- Browser auto-opening

## Build & Deploy Scripts

### build.sh
Comprehensive build system with multi-environment support and detailed reporting.

#### Usage
```bash
./scripts/build.sh [environment] [options]
```

#### Environments
- `development` - Development build
- `staging` - Staging build
- `production` (default) - Production build

#### Options
- `--skip-tests` - Skip running tests
- `--skip-lint` - Skip running linters
- `--verbose` - Show detailed build output
- `--analyze` - Analyze bundle size
- `--report` - Generate build report

#### Examples
```bash
# Build for production
./scripts/build.sh production

# Build with analysis and verbose output
./scripts/build.sh production --analyze --verbose

# Build without tests
./scripts/build.sh staging --skip-tests
```

#### Features
- Multi-environment builds
- Parallel build optimization
- Bundle size analysis
- Build report generation
- Dependency validation

### deploy.sh
Safe deployment system with backup creation, health checks, and rollback capabilities.

#### Usage
```bash
./scripts/deploy.sh [environment] [options]
```

#### Environments
- `staging` - Staging deployment
- `production` - Production deployment

#### Options
- `--force` - Force deployment without confirmation
- `--dry-run` - Simulate deployment without changes
- `--skip-backup` - Skip creating backup
- `--skip-health-check` - Skip post-deployment health check

#### Examples
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production with force
./scripts/deploy.sh production --force

# Dry run deployment
./scripts/deploy.sh staging --dry-run
```

#### Features
- Automatic backup creation
- Pre-deployment validation
- Health check integration
- Rollback capabilities
- Deployment reporting

## Testing Scripts

### test.sh
Comprehensive test runner with coverage analysis and reporting capabilities.

#### Usage
```bash
./scripts/test.sh [scope] [options]
```

#### Scopes
- `all` (default) - All test suites
- `backend` - Backend tests only
- `frontend` - Frontend tests only
- `shared` - Shared package tests
- `integration` - Integration tests
- `e2e` - End-to-end tests

#### Options
- `--watch` - Run tests in watch mode
- `--coverage` - Generate coverage report
- `--verbose` - Show detailed test output
- `--report` - Generate test report
- `--fix` - Auto-fix linting issues

#### Examples
```bash
# Run all tests with coverage
./scripts/test.sh all --coverage --report

# Run only backend tests
./scripts/test.sh backend

# Run tests with auto-fix
./scripts/test.sh all --fix
```

#### Features
- Multi-scope test execution
- Coverage threshold enforcement
- Parallel test execution
- Auto-fix capabilities
- Detailed reporting

### test-watch.sh
Watch mode for continuous testing during development.

#### Usage
```bash
./scripts/test-watch.sh [scope]
```

#### Scopes
- `all` (default) - All test suites
- `backend` - Backend tests only
- `frontend` - Frontend tests only
- `shared` - Shared package tests

#### Examples
```bash
# Watch all tests
./scripts/test-watch.sh all

# Watch only backend tests
./scripts/test-watch.sh backend
```

#### Features
- Intelligent file watching
- Multi-terminal support
- Tmux integration
- Test result notifications

### test-coverage.sh
Advanced coverage analysis with threshold checking and historical comparison.

#### Usage
```bash
./scripts/test-coverage.sh [scope] [options]
```

#### Options
- `--report` - Generate detailed coverage report
- `--threshold NUM` - Set coverage threshold (default: 80)
- `--compare` - Compare with previous coverage
- `--html` - Generate HTML coverage reports

#### Examples
```bash
# Generate coverage with comparison
./scripts/test-coverage.sh all --compare --html

# Set custom threshold
./scripts/test-coverage.sh all --threshold 90
```

#### Features
- Coverage threshold enforcement
- Historical comparison
- HTML report generation
- Multi-format output
- CI/CD integration

## Docker Scripts

### docker-build.sh
Docker image building with registry support and optimization.

#### Usage
```bash
./scripts/docker-build.sh [environment] [options]
```

#### Options
- `--no-cache` - Build without using cache
- `--push` - Push images to registry after build
- `--tag TAG` - Use custom tag instead of timestamp
- `--verbose` - Show detailed build output

#### Examples
```bash
# Build for production
./scripts/docker-build.sh production

# Build and push
./scripts/docker-build.sh production --push

# Build with custom tag
./scripts/docker-build.sh production --tag v1.0.0
```

#### Features
- Multi-stage builds
- Registry integration
- Build optimization
- Image cleanup
- Tag management

### docker-up.sh
Docker environment management with service orchestration.

#### Usage
```bash
./scripts/docker-up.sh [environment] [options]
```

#### Options
- `--build` - Build images before starting
- `--no-pull` - Don't pull latest images
- `--attach` - Don't run in detached mode
- `--logs` - Show logs after startup
- `--scale SERVICE=N` - Scale specific service

#### Examples
```bash
# Start development environment
./scripts/docker-up.sh development

# Start with build and logs
./scripts/docker-up.sh development --build --logs

# Scale backend service
./scripts/docker-up.sh production --scale backend=3
```

#### Features
- Environment-specific configurations
- Service scaling
- Health monitoring
- Log aggregation
- Port conflict detection

### docker-down.sh
Safe Docker shutdown with cleanup and resource management.

#### Usage
```bash
./scripts/docker-down.sh [options]
```

#### Options
- `--volumes` - Remove named volumes
- `--remove-orphans` - Remove orphaned containers
- `--timeout SECONDS` - Set shutdown timeout (default: 30)
- `--force` - Force shutdown without confirmation

#### Examples
```bash
# Stop services
./scripts/docker-down.sh

# Stop with volume cleanup
./scripts/docker-down.sh --volumes --remove-orphans

# Force shutdown
./scripts/docker-down.sh --force --timeout 10
```

#### Features
- Graceful shutdown
- Resource cleanup
- Backup creation
- Force cleanup options
- Timeout management

## Maintenance Scripts

### clean.sh
Multi-level cleanup system for build artifacts, cache, and temporary files.

#### Usage
```bash
./scripts/clean.sh [options]
```

#### Options
- `--deep` - Deep clean including build artifacts
- `--docker` - Clean Docker resources
- `--node-modules` - Remove node_modules directories
- `--logs` - Remove log files
- `--cache` - Remove cache directories
- `--all` - Clean everything

#### Examples
```bash
# Basic clean
./scripts/clean.sh

# Deep clean including node_modules
./scripts/clean.sh --deep --node-modules

# Clean everything
./scripts/clean.sh --all
```

#### Features
- Multi-level cleaning
- Selective cleanup
- Docker resource management
- Cache optimization
- Size reporting

### setup.sh
Complete project initialization with environment configuration and dependency management.

#### Usage
```bash
./scripts/setup.sh [environment] [options]
```

#### Environments
- `development` (default)
- `staging`
- `production`

#### Options
- `--skip-deps` - Skip dependency installation
- `--skip-db` - Skip database setup
- `--skip-env` - Skip environment file creation
- `--docker` - Setup for Docker environment
- `--verbose` - Show detailed output

#### Examples
```bash
# Complete development setup
./scripts/setup.sh development

# Docker-based setup
./scripts/setup.sh production --docker

# Setup without dependencies
./scripts/setup.sh development --skip-deps
```

#### Features
- System requirement validation
- Automatic dependency installation
- Environment file creation
- Database setup
- Directory structure creation

### health-check.sh
Application health monitoring with multiple output formats and watch capabilities.

#### Usage
```bash
./scripts/health-check.sh [options]
```

#### Options
- `--detailed` - Show detailed health information
- `--watch` - Run health checks continuously
- `--backend-url URL` - Backend URL (default: http://localhost:3003)
- `--frontend-url URL` - Frontend URL (default: http://localhost:3000)
- `--timeout SECONDS` - Request timeout (default: 10)
- `--output FORMAT` - Output format: table, json, csv
- `--interval SECONDS` - Check interval for watch mode (default: 30)

#### Examples
```bash
# Basic health check
./scripts/health-check.sh

# Detailed health check
./scripts/health-check.sh --detailed

# Watch mode with JSON output
./scripts/health-check.sh --watch --output json

# Custom endpoints
./scripts/health-check.sh --backend-url http://api.example.com --timeout 5
```

#### Features
- Multi-service health monitoring
- Multiple output formats
- Watch mode for continuous monitoring
- System resource monitoring
- Historical comparison

## Configuration

### Environment Variables

#### Database Configuration
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/hostingco"
export REDIS_URL="redis://localhost:6379"
```

#### Docker Configuration
```bash
export DOCKER_REGISTRY="your-registry.com"
export COMPOSE_PROJECT_NAME="hostingco"
```

#### Application Configuration
```bash
export NODE_ENV="production"
export LOG_LEVEL="info"
export JWT_SECRET="your-super-secret-jwt-key"
```

### Script Configuration Files

#### Environment Files
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

#### Docker Files
- `docker-compose.yml` - Base Docker configuration
- `docker-compose.development.yml` - Development overrides
- `docker-compose.staging.yml` - Staging overrides
- `docker-compose.production.yml` - Production overrides

## Safety Features

### Confirmation Prompts
Destructive operations require confirmation:
- Database reset operations
- Production deployments
- Volume deletion
- Complete cleanup operations

### Backup Creation
- Automatic database backups before reset
- Build artifacts preservation
- Configuration file backup
- Deployment rollback snapshots

### Error Handling
- Graceful failure with informative messages
- Rollback capabilities for failed operations
- Health checks before critical operations
- Detailed error reporting

## Output Formats

### Health Check Formats
```bash
# Table format (default)
./scripts/health-check.sh --output table

# JSON format for automation
./scripts/health-check.sh --output json

# CSV format for reporting
./scripts/health-check.sh --output csv
```

### Test Reports
- Markdown reports with coverage details
- JSON output for CI/CD integration
- HTML coverage reports with interactive charts

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Deploy
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup project
        run: ./scripts/setup.sh development --skip-env
      
      - name: Run tests
        run: ./scripts/test.sh all --coverage --report
      
      - name: Build project
        run: ./scripts/build.sh production
      
      - name: Health check
        run: ./scripts/health-check.sh --detailed

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: ./scripts/deploy.sh staging
```

### GitLab CI Example
```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - ./scripts/setup.sh development
    - ./scripts/test.sh all --coverage
  coverage: '/Lines: \d+\.\d+%/'

build:
  stage: build
  script:
    - ./scripts/build.sh production
  artifacts:
    paths:
      - backend/dist/
      - frontend/dist/

deploy_staging:
  stage: deploy
  script:
    - ./scripts/deploy.sh staging
  environment:
    name: staging
  only:
    - main
```

## Troubleshooting

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

## 📝 Best Practices

### Script Usage
1. **Always use automated scripts** over manual commands
2. **Check script help** with `--help` flag for options
3. **Use environment-specific** configurations
4. **Monitor script output** for errors and warnings
5. **Keep scripts updated** with the latest changes

### Development Workflow
1. **Setup**: Use `./scripts/setup.sh` for new environments
2. **Development**: Use `./scripts/dev.sh` for daily development
3. **Testing**: Use `./scripts/test.sh` before commits
4. **Building**: Use `./scripts/build.sh` before deployment
5. **Deployment**: Use `./scripts/deploy.sh` for safe deployments

### Production Deployment
1. **Test thoroughly** in staging first
2. **Create backups** before major changes
3. **Use health checks** to verify deployment
4. **Monitor performance** after deployment
5. **Have rollback plan** ready

## 📞 Support

For script-specific issues:
1. Check the script help: `./scripts/script-name.sh --help`
2. Run with verbose mode: `./scripts/script-name.sh --verbose`
3. Check environment configuration
4. Verify system requirements
5. Review logs for error messages

For project-specific issues, refer to the main project documentation or contact the development team.
