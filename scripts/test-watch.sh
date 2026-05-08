#!/bin/bash

# Test Watch Script for HostingCo
# Usage: ./scripts/test-watch.sh [scope]
# Scopes: backend, frontend, shared, all (default: all)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
SCOPE=${1:-all}

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

# Validate scope
case $SCOPE in
    all|backend|frontend|shared)
        ;;
    *)
        error "Invalid scope: $SCOPE. Use: all, backend, frontend, or shared"
        ;;
esac

# Function to check if directory exists and has tests
check_test_directory() {
    local dir="$1"
    local name="$2"
    
    if [ ! -d "$dir" ]; then
        error "$name directory not found: $dir"
    fi
    
    if [ ! -d "$dir/node_modules" ]; then
        log "Installing $name dependencies..."
        cd "$dir" && npm install
    fi
    
    # Check if there are test files
    if [ "$name" = "backend" ] || [ "$name" = "shared" ]; then
        if [ ! -d "$dir/test" ] && [ ! -d "$dir/tests" ] && [ ! -d "$dir/src/__tests__" ]; then
            warning "No test directory found for $name"
            return 1
        fi
    elif [ "$name" = "frontend" ]; then
        if [ ! -d "$dir/src/__tests__" ] && [ ! -d "$dir/test" ] && [ ! -d "$dir/tests" ]; then
            warning "No test directory found for $name"
            return 1
        fi
    fi
    
    return 0
}

# Function to run backend tests in watch mode
run_backend_watch() {
    if ! check_test_directory "$BACKEND_DIR" "backend"; then
        return
    fi
    
    log "Starting backend test watch mode..."
    cd "$BACKEND_DIR"
    
    info "Backend tests are now watching for changes..."
    info "Press Ctrl+C to stop watching"
    echo ""
    
    npm test -- --watch
}

# Function to run frontend tests in watch mode
run_frontend_watch() {
    if ! check_test_directory "$FRONTEND_DIR" "frontend"; then
        return
    fi
    
    log "Starting frontend test watch mode..."
    cd "$FRONTEND_DIR"
    
    info "Frontend tests are now watching for changes..."
    info "Press Ctrl+C to stop watching"
    echo ""
    
    # Handle different test runners
    if [ -f "package.json" ]; then
        if grep -q "test:react-scripts" package.json; then
            # React Scripts
            npm test -- --watch
        elif grep -q "vite" package.json; then
            # Vite
            npm test -- --watch
        else
            # Generic
            npm test -- --watch
        fi
    fi
}

# Function to run shared tests in watch mode
run_shared_watch() {
    if ! check_test_directory "$SHARED_DIR" "shared"; then
        return
    fi
    
    log "Starting shared test watch mode..."
    cd "$SHARED_DIR"
    
    info "Shared tests are now watching for changes..."
    info "Press Ctrl+C to stop watching"
    echo ""
    
    npm test -- --watch
}

# Function to run all tests in watch mode using concurrent processes
run_all_watch() {
    log "Starting all test suites in watch mode..."
    
    # We'll use a different approach for 'all' - run them in separate terminals/tabs
    info "To watch all test suites, open multiple terminals and run:"
    echo ""
    info "Terminal 1: ./scripts/test-watch.sh backend"
    info "Terminal 2: ./scripts/test-watch.sh frontend"
    info "Terminal 3: ./scripts/test-watch.sh shared"
    echo ""
    info "Or use the following commands to run in background:"
    echo ""
    
    # Check if we can run concurrent processes
    if command -v gnome-terminal >/dev/null 2>&1; then
        info "Opening new terminals for each test suite..."
        gnome-terminal --tab --title="Backend Tests" -- bash -c "cd $BACKEND_DIR && npm test -- --watch; exec bash"
        gnome-terminal --tab --title="Frontend Tests" -- bash -c "cd $FRONTEND_DIR && npm test -- --watch; exec bash"
        gnome-terminal --tab --title="Shared Tests" -- bash -c "cd $SHARED_DIR && npm test -- --watch; exec bash"
    elif command -v tmux >/dev/null 2>&1; then
        info "Creating tmux session with test watchers..."
        tmux new-session -d -s hostingco-tests
        tmux send-keys -t hostingco-tests "cd $BACKEND_DIR && npm test -- --watch" C-m
        tmux split-window -t hostingco-tests
        tmux send-keys -t hostingco-tests "cd $FRONTEND_DIR && npm test -- --watch" C-m
        tmux split-window -t hostingco-tests
        tmux send-keys -t hostingco-tests "cd $SHARED_DIR && npm test -- --watch" C-m
        tmux attach-session -t hostingco-tests
    else
        warning "Cannot automatically open multiple terminals"
        info "Please manually open terminals and run the commands above"
    fi
}

# Main execution
log "Starting HostingCo test watch mode for scope: $SCOPE"

# Check for required commands
if ! command -v npm >/dev/null 2>&1; then
    error "npm is required but not installed"
fi

# Run tests based on scope
case $SCOPE in
    all)
        run_all_watch
        ;;
    backend)
        run_backend_watch
        ;;
    frontend)
        run_frontend_watch
        ;;
    shared)
        run_shared_watch
        ;;
esac
