#!/bin/bash

# Database Reset Script for HostingCo
# Usage: ./scripts/db-reset.sh [environment] [--force]
# Environments: development, staging, production (default: development)
# --force: Skip confirmation prompts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default parameters
ENVIRONMENT=${1:-development}
FORCE_FLAG=""

# Parse arguments
for arg in "$@"; do
    if [ "$arg" = "--force" ]; then
        FORCE_FLAG="--force"
    fi
done

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

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

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    error "Backend directory not found at $BACKEND_DIR"
fi

# Load environment variables
if [ "$ENVIRONMENT" = "development" ]; then
    ENV_FILE="$BACKEND_DIR/.env.development"
elif [ "$ENVIRONMENT" = "staging" ]; then
    ENV_FILE="$BACKEND_DIR/.env.staging"
elif [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE="$BACKEND_DIR/.env.production"
else
    error "Unknown environment: $ENVIRONMENT. Use: development, staging, or production"
fi

if [ ! -f "$ENV_FILE" ]; then
    warning "Environment file $ENV_FILE not found. Using default .env"
    ENV_FILE="$BACKEND_DIR/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
    error "No environment file found. Please create $ENV_FILE"
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL not set in $ENV_FILE"
fi

# Safety checks
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -z "$FORCE_FLAG" ]; then
        error "Database reset in production requires --force flag"
    fi
    
    warning "WARNING: This will completely erase the production database!"
    warning "This action cannot be undone!"
    
    if [ -z "$FORCE_FLAG" ]; then
        read -p "Type 'ERASE-PRODUCTION-DATA' to confirm: " confirm
        if [ "$confirm" != "ERASE-PRODUCTION-DATA" ]; then
            log "Database reset cancelled by user"
            exit 0
        fi
    fi
elif [ "$ENVIRONMENT" = "staging" ]; then
    if [ -z "$FORCE_FLAG" ]; then
        warning "WARNING: This will completely erase the staging database!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log "Database reset cancelled by user"
            exit 0
        fi
    fi
else
    if [ -z "$FORCE_FLAG" ]; then
        warning "WARNING: This will completely erase the development database!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log "Database reset cancelled by user"
            exit 0
        fi
    fi
fi

log "Starting database reset for $ENVIRONMENT environment"

# Check if database is accessible
log "Checking database connection..."
cd "$BACKEND_DIR"
if ! npm run db:check; then
    error "Database connection failed. Please check your DATABASE_URL"
fi

# Create backup before reset (except for development)
if [ "$ENVIRONMENT" != "development" ]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    log "Creating backup: $BACKUP_FILE"
    npm run db:backup "$BACKUP_FILE"
    success "Backup created: $BACKUP_FILE"
fi

# Reset database
log "Resetting database..."
npm run db:reset

# Run migrations after reset
log "Running migrations after reset..."
npm run migrate

# Seed development data
if [ "$ENVIRONMENT" = "development" ]; then
    log "Seeding development data..."
    npm run seed:dev
fi

success "Database reset completed successfully for $ENVIRONMENT environment"

if [ "$ENVIRONMENT" != "development" ]; then
    log "Backup file: $BACKUP_FILE"
    log "To restore: npm run db:restore $BACKUP_FILE"
fi
