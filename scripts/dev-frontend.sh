#!/bin/bash

# Frontend Development Server Script for HostingCo
# Usage: ./scripts/dev-frontend.sh [options]
# Options: --port PORT, --no-logs, --host HOST, --open

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
PORT=3000
HOST=localhost
SHOW_LOGS=true
OPEN_BROWSER=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
        --port)
            PORT="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        --no-logs)
            SHOW_LOGS=false
            shift
            ;;
        --open)
            OPEN_BROWSER=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --port PORT        Set frontend port (default: 3000)"
            echo "  --host HOST        Set frontend host (default: localhost)"
            echo "  --no-logs          Suppress detailed logs"
            echo "  --open             Open browser automatically"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $arg. Use --help for available options."
            ;;
    esac
done

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    error "Frontend directory not found at $FRONTEND_DIR"
fi

# Check if node_modules exist
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "Frontend dependencies not found. Installing..."
    cd "$FRONTEND_DIR" && npm install
fi

# Check if environment file exists
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

# Function to check if backend is available
check_backend() {
    local backend_url=${REACT_APP_API_URL:-"http://localhost:3003"}
    
    log "Checking backend connectivity at $backend_url..."
    
    if curl -s "$backend_url/api/health" >/dev/null 2>&1; then
        success "Backend is accessible"
    else
        warning "Backend is not accessible at $backend_url"
        warning "Make sure the backend server is running"
        read -p "Continue anyway? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            exit 0
        fi
    fi
}

# Function to start frontend server
start_frontend() {
    log "Starting frontend server..."
    check_port $PORT
    check_backend
    
    cd "$FRONTEND_DIR"
    
    # Set environment variables
    export PORT=$PORT
    export HOST=$HOST
    export NODE_ENV=development
    
    # Prepare Vite command
    VITE_CMD="npm run dev"
    
    if [ "$OPEN_BROWSER" = true ]; then
        VITE_CMD="$VITE_CMD -- --open"
    fi
    
    if [ "$HOST" != "localhost" ]; then
        VITE_CMD="$VITE_CMD -- --host $HOST"
    fi
    
    if [ "$SHOW_LOGS" = true ]; then
        info "Frontend server starting on: http://$HOST:$PORT"
        echo ""
        eval $VITE_CMD
    else
        eval $VITE_CMD >/dev/null 2>&1 &
        FRONTEND_PID=$!
        success "Frontend server started in background on port $PORT (PID: $FRONTEND_PID)"
        info "Logs are available at: $PROJECT_ROOT/.frontend.log"
        info "To stop server: kill $FRONTEND_PID"
    fi
}

# Function to check for TypeScript issues
check_typescript() {
    cd "$FRONTEND_DIR"
    
    if [ -f "tsconfig.json" ]; then
        log "Checking TypeScript configuration..."
        if ! npm run type-check >/dev/null 2>&1; then
            warning "TypeScript check failed. There may be type errors in your code."
        fi
    fi
}

# Main execution
log "Starting HostingCo frontend development server..."

# Check TypeScript configuration
check_typescript

# Check for common issues
if [ ! -f "$FRONTEND_DIR/index.html" ]; then
    error "index.html not found. This is required for Vite to work."
fi

if [ ! -d "$FRONTEND_DIR/src" ]; then
    error "src directory not found. This is required for the React application."
fi

start_frontend

# Show useful information
if [ "$SHOW_LOGS" = true ]; then
    echo ""
    success "Frontend server is running!"
    echo ""
    info "Application available at: http://$HOST:$PORT"
    info "Vite dev server: http://$HOST:$PORT"
    echo ""
    info "Development tools:"
    echo "  - React DevTools: Available in browser dev tools"
    echo "  - Vite HMR: Hot module replacement enabled"
    echo "  - TypeScript: Type checking enabled"
    echo ""
    info "Build commands:"
    echo "  - npm run build      Build for production"
    echo "  - npm run preview    Preview production build"
    echo "  - npm run lint       Run ESLint"
    echo "  - npm run type-check Run TypeScript check"
    echo ""
    info "To stop server, press Ctrl+C"
fi
