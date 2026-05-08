#!/bin/bash

# Backend Development Server Script for HostingCo
# Usage: ./scripts/dev-backend.sh [options]
# Options: --port PORT, --no-logs, --debug, --watch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
PORT=3003
SHOW_LOGS=true
DEBUG_MODE=false
WATCH_MODE=true

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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --port)
            PORT="$2"
            shift 2
            ;;
        --no-logs)
            SHOW_LOGS=false
            shift
            ;;
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        --no-watch)
            WATCH_MODE=false
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --port PORT        Set backend port (default: 3003)"
            echo "  --no-logs          Suppress detailed logs"
            echo "  --debug            Enable debug mode"
            echo "  --no-watch         Disable file watching"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $arg. Use --help for available options."
            ;;
    esac
done

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    error "Backend directory not found at $BACKEND_DIR"
fi

# Check if node_modules exist
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    log "Backend dependencies not found. Installing..."
    cd "$BACKEND_DIR" && npm install
fi

# Check if environment file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        warning "Backend .env not found. Copying from .env.example"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        info "Please edit $BACKEND_DIR/.env with your configuration"
    else
        error "Backend environment file not found. Please create $BACKEND_DIR/.env"
    fi
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        error "Port $port is already in use. Please choose a different port or stop the process using it."
    fi
}

# Check if database is accessible
check_database() {
    log "Checking database connection..."
    cd "$BACKEND_DIR"
    
    if ! npm run db:check >/dev/null 2>&1; then
        warning "Database connection failed. Please check your DATABASE_URL in .env"
        read -p "Continue anyway? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            exit 0
        fi
    fi
}

# Function to start backend server
start_backend() {
    log "Starting backend server..."
    check_port $PORT
    check_database
    
    cd "$BACKEND_DIR"
    
    # Set environment variables
    export PORT=$PORT
    export NODE_ENV=development
    
    if [ "$DEBUG_MODE" = true ]; then
        export DEBUG=hostingco:*
        info "Debug mode enabled"
    fi
    
    # Determine the npm script to run
    if [ "$WATCH_MODE" = true ]; then
        NPM_SCRIPT="dev"
    else
        NPM_SCRIPT="start"
    fi
    
    if [ "$SHOW_LOGS" = true ]; then
        info "Backend server starting on: http://localhost:$PORT"
        info "API Documentation: http://localhost:$PORT/api/docs"
        info "Health Check: http://localhost:$PORT/api/health"
        echo ""
        npm run $NPM_SCRIPT
    else
        npm run $NPM_SCRIPT >/dev/null 2>&1 &
        BACKEND_PID=$!
        success "Backend server started in background on port $PORT (PID: $BACKEND_PID)"
        info "Logs are available at: $PROJECT_ROOT/.backend.log"
        info "To stop server: kill $BACKEND_PID"
    fi
}

# Main execution
log "Starting HostingCo backend development server..."

# Check for TypeScript compilation
if [ ! -d "$BACKEND_DIR/dist" ] && [ "$WATCH_MODE" = true ]; then
    log "Building TypeScript definitions..."
    cd "$BACKEND_DIR" && npm run build >/dev/null 2>&1 || true
fi

start_backend

# Show useful information
if [ "$SHOW_LOGS" = true ]; then
    echo ""
    info "Backend server is running!"
    echo ""
    info "Available endpoints:"
    echo "  - API Base:     http://localhost:$PORT/api"
    echo "  - Health Check: http://localhost:$PORT/api/health"
    echo "  - API Docs:     http://localhost:$PORT/api/docs"
    echo "  - Metrics:      http://localhost:$PORT/api/metrics"
    echo ""
    info "Development tools:"
    echo "  - Database migrations: npm run migrate"
    echo "  - Seed data:          npm run seed"
    echo "  - Run tests:          npm test"
    echo ""
    info "To stop server, press Ctrl+C"
fi
