#!/bin/bash

# Development Server Startup Script for HostingCo
# Usage: ./scripts/dev.sh [options]
# Options: --backend-only, --frontend-only, --no-logs, --port-backend PORT, --port-frontend PORT

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
BACKEND_ONLY=false
FRONTEND_ONLY=false
SHOW_LOGS=true
BACKEND_PORT=3003
FRONTEND_PORT=3000

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

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
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --no-logs)
            SHOW_LOGS=false
            shift
            ;;
        --port-backend)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --port-frontend)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --backend-only     Start only the backend server"
            echo "  --frontend-only    Start only the frontend server"
            echo "  --no-logs          Suppress detailed logs"
            echo "  --port-backend PORT    Set backend port (default: 3003)"
            echo "  --port-frontend PORT   Set frontend port (default: 3000)"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $arg. Use --help for available options."
            ;;
    esac
done

# Validate arguments
if [ "$BACKEND_ONLY" = true ] && [ "$FRONTEND_ONLY" = true ]; then
    error "Cannot specify both --backend-only and --frontend-only"
fi

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    error "Backend directory not found at $BACKEND_DIR"
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    error "Frontend directory not found at $FRONTEND_DIR"
fi

# Check if node_modules exist
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    log "Backend dependencies not found. Installing..."
    cd "$BACKEND_DIR" && npm install
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "Frontend dependencies not found. Installing..."
    cd "$FRONTEND_DIR" && npm install
fi

# Check if environment files exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        warning "Backend .env not found. Copying from .env.example"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        info "Please edit $BACKEND_DIR/.env with your configuration"
    else
        error "Backend environment file not found. Please create $BACKEND_DIR/.env"
    fi
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
    if [ -f "$FRONTEND_DIR/.env.example" ]; then
        warning "Frontend .env not found. Copying from .env.example"
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
        info "Please edit $FRONTEND_DIR/.env with your configuration"
    else
        error "Frontend environment file not found. Please create $FRONTEND_DIR/.env"
    fi
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        error "Port $port is already in use. Please choose a different port or stop the process using it."
    fi
}

# Function to start backend server
start_backend() {
    log "Starting backend server on port $BACKEND_PORT..."
    check_port $BACKEND_PORT
    
    cd "$BACKEND_DIR"
    
    # Set backend port environment variable
    export PORT=$BACKEND_PORT
    
    if [ "$SHOW_LOGS" = true ]; then
        info "Backend will be available at: http://localhost:$BACKEND_PORT"
        info "API Documentation: http://localhost:$BACKEND_PORT/api/docs"
        npm run dev
    else
        npm run dev >/dev/null 2>&1 &
        success "Backend server started in background on port $BACKEND_PORT"
    fi
}

# Function to start frontend server
start_frontend() {
    log "Starting frontend server on port $FRONTEND_PORT..."
    check_port $FRONTEND_PORT
    
    cd "$FRONTEND_DIR"
    
    # Set frontend port environment variable
    export PORT=$FRONTEND_PORT
    
    if [ "$SHOW_LOGS" = true ]; then
        info "Frontend will be available at: http://localhost:$FRONTEND_PORT"
        npm run dev
    else
        npm run dev >/dev/null 2>&1 &
        success "Frontend server started in background on port $FRONTEND_PORT"
    fi
}

# Function to start both servers
start_both() {
    log "Starting both backend and frontend servers..."
    
    # Start backend in background
    check_port $BACKEND_PORT
    cd "$BACKEND_DIR"
    export PORT=$BACKEND_PORT
    npm run dev >"$PROJECT_ROOT/.backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Check if backend started successfully
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        error "Backend server failed to start. Check $PROJECT_ROOT/.backend.log"
    fi
    
    success "Backend server started on port $BACKEND_PORT (PID: $BACKEND_PID)"
    
    # Start frontend
    start_frontend
}

# Main execution
log "Starting HostingCo development environment..."

if [ "$BACKEND_ONLY" = true ]; then
    start_backend
elif [ "$FRONTEND_ONLY" = true ]; then
    start_frontend
else
    start_both
fi

# Show summary
echo ""
success "Development environment started!"
echo ""
info "Services:"
if [ "$BACKEND_ONLY" = false ]; then
    echo "  - Frontend: http://localhost:$FRONTEND_PORT"
fi
if [ "$FRONTEND_ONLY" = false ]; then
    echo "  - Backend:  http://localhost:$BACKEND_PORT"
    echo "  - API Docs: http://localhost:$BACKEND_PORT/api/docs"
fi
echo ""
info "To stop servers, press Ctrl+C"
if [ "$BACKEND_ONLY" = false ] && [ "$FRONTEND_ONLY" = false ]; then
    info "Backend logs: $PROJECT_ROOT/.backend.log"
fi
