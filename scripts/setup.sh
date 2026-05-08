#!/bin/bash

# Setup Script for HostingCo
# Usage: ./scripts/setup.sh [environment] [options]
# Environments: development, staging, production (default: development)
# Options: --skip-deps, --skip-db, --skip-env, --docker, --verbose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${1:-development}
SKIP_DEPS=false
SKIP_DB=false
SKIP_ENV=false
DOCKER_SETUP=false
VERBOSE=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SHARED_DIR="$PROJECT_ROOT/shared"

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-env)
            SKIP_ENV=true
            shift
            ;;
        --docker)
            DOCKER_SETUP=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [environment] [options]"
            echo "Environments: development, staging, production (default: development)"
            echo "Options:"
            echo "  --skip-deps    Skip dependency installation"
            echo "  --skip-db      Skip database setup"
            echo "  --skip-env     Skip environment file creation"
            echo "  --docker       Setup for Docker environment"
            echo "  --verbose      Show detailed output"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            if [[ $arg != --* ]]; then
                ENVIRONMENT=$arg
            else
                error "Unknown option: $arg. Use --help for available options."
            fi
            shift
            ;;
    esac
done

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        error "Invalid environment: $ENVIRONMENT. Use: development, staging, or production"
        ;;
esac

# Check if directories exist
for dir in "$PROJECT_ROOT" "$BACKEND_DIR" "$FRONTEND_DIR" "$SHARED_DIR"; do
    if [ ! -d "$dir" ]; then
        error "Directory not found: $dir"
    fi
done

# Function to check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js is required but not installed"
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo "$node_version" | cut -d'.' -f1)
    
    if [ "$major_version" -lt 18 ]; then
        error "Node.js version 18+ is required. Current version: $node_version"
    fi
    
    success "Node.js version: $node_version ✓"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        error "npm is required but not installed"
    fi
    
    local npm_version=$(npm --version)
    success "npm version: $npm_version ✓"
    
    # Check Git
    if ! command -v git >/dev/null 2>&1; then
        warning "Git is not installed. Version control is recommended."
    else
        local git_version=$(git --version | cut -d' ' -f3)
        success "Git version: $git_version ✓"
    fi
    
    # Check Docker if requested
    if [ "$DOCKER_SETUP" = true ]; then
        if ! command -v docker >/dev/null 2>&1; then
            error "Docker is required for Docker setup but not installed"
        fi
        
        if ! docker info >/dev/null 2>&1; then
            error "Docker daemon is not running"
        fi
        
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        success "Docker version: $docker_version ✓"
        
        if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
            error "Docker Compose is required for Docker setup but not installed"
        fi
        
        success "Docker Compose available ✓"
    fi
    
    # Check database (PostgreSQL optional for development)
    if [ "$ENVIRONMENT" != "development" ] && [ "$SKIP_DB" = false ]; then
        if ! command -v psql >/dev/null 2>&1; then
            warning "PostgreSQL client not found. Database setup may fail."
        else
            local psql_version=$(psql --version | cut -d' ' -f3)
            success "PostgreSQL client version: $psql_version ✓"
        fi
    fi
}

# Function to install dependencies
install_dependencies() {
    if [ "$SKIP_DEPS" = true ]; then
        warning "Skipping dependency installation"
        return
    fi
    
    log "Installing project dependencies..."
    
    # Install root dependencies
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        log "Installing root dependencies..."
        cd "$PROJECT_ROOT"
        if [ "$VERBOSE" = true ]; then
            npm install
        else
            npm install >/dev/null 2>&1
        fi
        success "Root dependencies installed"
    fi
    
    # Install shared dependencies
    if [ -f "$SHARED_DIR/package.json" ]; then
        log "Installing shared dependencies..."
        cd "$SHARED_DIR"
        if [ "$VERBOSE" = true ]; then
            npm install
        else
            npm install >/dev/null 2>&1
        fi
        success "Shared dependencies installed"
    fi
    
    # Install backend dependencies
    if [ -f "$BACKEND_DIR/package.json" ]; then
        log "Installing backend dependencies..."
        cd "$BACKEND_DIR"
        if [ "$VERBOSE" = true ]; then
            npm install
        else
            npm install >/dev/null 2>&1
        fi
        success "Backend dependencies installed"
    fi
    
    # Install frontend dependencies
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        log "Installing frontend dependencies..."
        cd "$FRONTEND_DIR"
        if [ "$VERBOSE" = true ]; then
            npm install
        else
            npm install >/dev/null 2>&1
        fi
        success "Frontend dependencies installed"
    fi
}

# Function to create environment files
create_environment_files() {
    if [ "$SKIP_ENV" = true ]; then
        warning "Skipping environment file creation"
        return
    fi
    
    log "Creating environment files..."
    
    # Create backend environment file
    local backend_env="$BACKEND_DIR/.env"
    local backend_example="$BACKEND_DIR/.env.example"
    
    if [ ! -f "$backend_env" ]; then
        if [ -f "$backend_example" ]; then
            cp "$backend_example" "$backend_env"
            success "Created backend environment file"
            info "Please edit $backend_env with your configuration"
        else
            warning "Backend environment template not found. Creating basic .env file..."
            cat > "$backend_env" << EOF
# Backend Environment Configuration
NODE_ENV=$ENVIRONMENT
PORT=3003
DATABASE_URL=postgresql://username:password@localhost:5432/hostingco_$ENVIRONMENT
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF
            success "Created basic backend environment file"
        fi
    else
        info "Backend environment file already exists"
    fi
    
    # Create frontend environment file
    local frontend_env="$FRONTEND_DIR/.env"
    local frontend_example="$FRONTEND_DIR/.env.example"
    
    if [ ! -f "$frontend_env" ]; then
        if [ -f "$frontend_example" ]; then
            cp "$frontend_example" "$frontend_env"
            success "Created frontend environment file"
            info "Please edit $frontend_env with your configuration"
        else
            warning "Frontend environment template not found. Creating basic .env file..."
            cat > "$frontend_env" << EOF
# Frontend Environment Configuration
REACT_APP_API_URL=http://localhost:3003/api
REACT_APP_ENVIRONMENT=$ENVIRONMENT
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
EOF
            success "Created basic frontend environment file"
        fi
    else
        info "Frontend environment file already exists"
    fi
    
    # Create Docker environment file if Docker setup
    if [ "$DOCKER_SETUP" = true ]; then
        local docker_env="$PROJECT_ROOT/.env.$ENVIRONMENT"
        
        if [ ! -f "$docker_env" ]; then
            log "Creating Docker environment file..."
            cat > "$docker_env" << EOF
# Docker Environment Configuration for $ENVIRONMENT
COMPOSE_PROJECT_NAME=hostingco_$ENVIRONMENT
NODE_ENV=$ENVIRONMENT

# Database
POSTGRES_DB=hostingco_$ENVIRONMENT
POSTGRES_USER=hostingco_user
POSTGRES_PASSWORD=change-this-password
DATABASE_URL=postgresql://hostingco_user:change-this-password@postgres:5432/hostingco_$ENVIRONMENT

# Redis
REDIS_URL=redis://redis:6379

# Backend
BACKEND_PORT=3003
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend
FRONTEND_PORT=3000

# Nginx (for production)
NGINX_PORT=80
NGINX_SSL_PORT=443
EOF
            success "Created Docker environment file"
        else
            info "Docker environment file already exists"
        fi
    fi
}

# Function to setup database
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        warning "Skipping database setup"
        return
    fi
    
    log "Setting up database..."
    
    if [ "$DOCKER_SETUP" = true ]; then
        info "Database will be set up by Docker Compose"
        return
    fi
    
    # Check if PostgreSQL is running (for non-Docker setup)
    if ! pg_isready -q 2>/dev/null; then
        warning "PostgreSQL is not running. Please start PostgreSQL service."
        read -p "Continue anyway? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            exit 0
        fi
    fi
    
    # Create database if it doesn't exist
    local db_name="hostingco_$ENVIRONMENT"
    
    if psql -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        info "Database '$db_name' already exists"
    else
        log "Creating database: $db_name"
        createdb "$db_name" 2>/dev/null || {
            error "Failed to create database. Please check your PostgreSQL configuration."
        }
        success "Database created: $db_name"
    fi
    
    # Run migrations if backend is set up
    if [ -f "$BACKEND_DIR/package.json" ] && [ -d "$BACKEND_DIR/node_modules" ]; then
        log "Running database migrations..."
        cd "$BACKEND_DIR"
        
        if npm run migrate >/dev/null 2>&1; then
            success "Database migrations completed"
        else
            warning "Database migrations failed. Please run them manually:"
            warning "  cd backend && npm run migrate"
        fi
    fi
}

# Function to build shared package
build_shared() {
    log "Building shared package..."
    
    if [ ! -f "$SHARED_DIR/package.json" ]; then
        warning "Shared package.json not found. Skipping shared build."
        return
    fi
    
    cd "$SHARED_DIR"
    
    if npm run build >/dev/null 2>&1; then
        success "Shared package built successfully"
    else
        warning "Shared package build failed. Please run it manually:"
        warning "  cd shared && npm run build"
    fi
}

# Function to create directories
create_directories() {
    log "Creating necessary directories..."
    
    local directories=(
        "$BACKEND_DIR/logs"
        "$BACKEND_DIR/uploads"
        "$BACKEND_DIR/temp"
        "$FRONTEND_DIR/build"
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/backups"
        "$PROJECT_ROOT/data"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            info "Created directory: $dir"
        fi
    done
    
    success "Directories created"
}

# Function to set permissions
set_permissions() {
    log "Setting file permissions..."
    
    # Make scripts executable
    find "$PROJECT_ROOT/scripts" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
    
    # Set proper permissions for uploads and logs
    chmod 755 "$BACKEND_DIR/uploads" 2>/dev/null || true
    chmod 755 "$BACKEND_DIR/logs" 2>/dev/null || true
    chmod 755 "$PROJECT_ROOT/logs" 2>/dev/null || true
    
    success "Permissions set"
}

# Function to show next steps
show_next_steps() {
    echo ""
    success "HostingCo setup completed for $ENVIRONMENT environment!"
    echo ""
    info "Next steps:"
    
    if [ "$DOCKER_SETUP" = true ]; then
        echo "  1. Update environment files with your configuration:"
        echo "     - $PROJECT_ROOT/.env.$ENVIRONMENT"
        echo "     - $BACKEND_DIR/.env"
        echo "     - $FRONTEND_DIR/.env"
        echo "  2. Start the application:"
        echo "     ./scripts/docker-up.sh $ENVIRONMENT"
        echo "  3. Access the application:"
        echo "     - Frontend: http://localhost:3000"
        echo "     - Backend:  http://localhost:3003"
    else
        echo "  1. Update environment files with your configuration:"
        echo "     - $BACKEND_DIR/.env"
        echo "     - $FRONTEND_DIR/.env"
        echo "  2. Ensure your database is running and configured"
        echo "  3. Start the application:"
        echo "     ./scripts/dev.sh $ENVIRONMENT"
        echo "  4. Access the application:"
        echo "     - Frontend: http://localhost:3000"
        echo "     - Backend:  http://localhost:3003"
    fi
    
    echo ""
    info "Useful commands:"
    echo "  - Development:    ./scripts/dev.sh"
    echo "  - Build:          ./scripts/build.sh"
    echo "  - Test:           ./scripts/test.sh"
    echo "  - Deploy:         ./scripts/deploy.sh"
    
    if [ "$DOCKER_SETUP" = true ]; then
        echo "  - Docker build:   ./scripts/docker-build.sh"
        echo "  - Docker up:      ./scripts/docker-up.sh"
        echo "  - Docker down:    ./scripts/docker-down.sh"
    fi
    
    echo ""
    info "Documentation:"
    echo "  - README:         $PROJECT_ROOT/README.md"
    echo "  - Development:    $PROJECT_ROOT/docs/development-guide.md"
    echo ""
}

# Main execution
log "Setting up HostingCo for $ENVIRONMENT environment..."

# Check system requirements
check_requirements

# Create directories
create_directories

# Install dependencies
install_dependencies

# Create environment files
create_environment_files

# Setup database
setup_database

# Build shared package
build_shared

# Set permissions
set_permissions

# Show next steps
show_next_steps
