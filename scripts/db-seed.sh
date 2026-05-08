#!/bin/bash

# Database Seeding Script for HostingCo
# Usage: ./scripts/db-seed.sh [environment] [seed-type]
# Environments: development, staging, production (default: development)
# Seed types: all, users, hosting, billing, support (default: all)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default parameters
ENVIRONMENT=${1:-development}
SEED_TYPE=${2:-all}

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

# Safety check for production
if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$SEED_TYPE" = "all" ]; then
        error "Seeding all data in production is not allowed. Please specify a specific seed type."
    fi
    
    read -p "Are you sure you want to seed $SEED_TYPE data in production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Seeding cancelled by user"
        exit 0
    fi
fi

log "Starting database seeding for $ENVIRONMENT environment (seed type: $SEED_TYPE)"

# Check if database is accessible
log "Checking database connection..."
cd "$BACKEND_DIR"
if ! npm run db:check; then
    error "Database connection failed. Please check your DATABASE_URL"
fi

# Run seeds based on type
case $SEED_TYPE in
    "all")
        log "Seeding all data..."
        npm run seed:all
        ;;
    "users")
        log "Seeding users data..."
        npm run seed:users
        ;;
    "hosting")
        log "Seeding hosting data..."
        npm run seed:hosting
        ;;
    "billing")
        log "Seeding billing data..."
        npm run seed:billing
        ;;
    "support")
        log "Seeding support data..."
        npm run seed:support
        ;;
    *)
        error "Unknown seed type: $SEED_TYPE. Use: all, users, hosting, billing, or support"
        ;;
esac

success "Database seeding completed successfully for $ENVIRONMENT environment"

# Show seed status
log "Seed data status:"
npm run seed:status
