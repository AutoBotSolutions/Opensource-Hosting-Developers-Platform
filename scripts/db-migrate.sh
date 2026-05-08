#!/bin/bash

# Database Migration Script for HostingCo
# Usage: ./scripts/db-migrate.sh [environment]
# Environments: development, staging, production (default: development)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-development}

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

log "Starting database migration for $ENVIRONMENT environment"

# Check if database is accessible
log "Checking database connection..."
if ! cd "$BACKEND_DIR" && npm run db:check; then
    error "Database connection failed. Please check your DATABASE_URL"
fi

# Run migrations
log "Running database migrations..."
cd "$BACKEND_DIR"

if [ "$ENVIRONMENT" = "production" ]; then
    log "Production environment detected. Running migrations with extra safety checks..."
    npm run migrate:prod
else
    npm run migrate
fi

success "Database migration completed successfully for $ENVIRONMENT environment"

# Show migration status
log "Migration status:"
npm run migrate:status
