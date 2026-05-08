#!/bin/bash

# Build Script for HostingCo
# Usage: ./scripts/build.sh [environment] [options]
# Environments: development, staging, production (default: production)
# Options: --skip-tests, --skip-lint, --verbose, --analyze

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${1:-production}
SKIP_TESTS=false
SKIP_LINT=false
VERBOSE=false
ANALYZE=false

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
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --analyze)
            ANALYZE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [environment] [options]"
            echo "Environments: development, staging, production (default: production)"
            echo "Options:"
            echo "  --skip-tests      Skip running tests"
            echo "  --skip-lint       Skip running linters"
            echo "  --verbose         Show detailed build output"
            echo "  --analyze         Analyze bundle size"
            echo "  --help            Show this help message"
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
for dir in "$BACKEND_DIR" "$FRONTEND_DIR" "$SHARED_DIR"; do
    if [ ! -d "$dir" ]; then
        error "Directory not found: $dir"
    fi
done

# Function to run command with optional verbose output
run_command() {
    local cmd="$1"
    local description="$2"
    
    log "$description"
    
    if [ "$VERBOSE" = true ]; then
        eval "$cmd"
    else
        eval "$cmd" >/dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        success "$description completed"
    else
        error "$description failed"
    fi
}

# Function to build shared package
build_shared() {
    log "Building shared package..."
    cd "$SHARED_DIR"
    
    if [ ! -d "node_modules" ]; then
        run_command "npm install" "Installing shared dependencies"
    fi
    
    run_command "npm run build" "Building shared package"
    
    if [ "$SKIP_LINT" = false ]; then
        run_command "npm run lint" "Linting shared package"
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_command "npm test" "Testing shared package"
    fi
}

# Function to build backend
build_backend() {
    log "Building backend for $ENVIRONMENT..."
    cd "$BACKEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        run_command "npm install" "Installing backend dependencies"
    fi
    
    # Set environment-specific variables
    export NODE_ENV=$ENVIRONMENT
    
    if [ "$SKIP_LINT" = false ]; then
        run_command "npm run lint" "Linting backend"
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_command "npm test" "Testing backend"
    fi
    
    # Build TypeScript
    run_command "npm run build" "Building backend"
    
    # Create production-specific files
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ -f "package.json" ]; then
            cp package.json dist/
            cp package-lock.json dist/ 2>/dev/null || true
        fi
        
        # Create .production file for environment detection
        echo "production" > dist/.env
    fi
}

# Function to build frontend
build_frontend() {
    log "Building frontend for $ENVIRONMENT..."
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        run_command "npm install" "Installing frontend dependencies"
    fi
    
    # Set environment-specific variables
    export NODE_ENV=$ENVIRONMENT
    export VITE_ENV=$ENVIRONMENT
    
    if [ "$SKIP_LINT" = false ]; then
        run_command "npm run lint" "Linting frontend"
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_command "npm test" "Testing frontend"
    fi
    
    # Build with Vite
    local build_cmd="npm run build"
    if [ "$ANALYZE" = true ]; then
        build_cmd="npm run build:analyze"
    fi
    
    run_command "$build_cmd" "Building frontend"
    
    # Generate build info
    if [ -d "dist" ]; then
        echo "Build completed at: $(date)" > dist/build-info.txt
        echo "Environment: $ENVIRONMENT" >> dist/build-info.txt
        echo "Git commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')" >> dist/build-info.txt
        
        # Show build statistics
        local build_size=$(du -sh dist | cut -f1)
        info "Frontend build size: $build_size"
    fi
}

# Function to verify builds
verify_builds() {
    log "Verifying builds..."
    
    # Check backend build
    if [ ! -f "$BACKEND_DIR/dist/index.js" ]; then
        error "Backend build verification failed - missing index.js"
    fi
    
    # Check frontend build
    if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
        error "Frontend build verification failed - missing index.html"
    fi
    
    success "All builds verified successfully"
}

# Function to generate build report
generate_report() {
    local report_file="$PROJECT_ROOT/build-report-$ENVIRONMENT-$(date +%Y%m%d_%H%M%S).md"
    
    log "Generating build report: $report_file"
    
    cat > "$report_file" << EOF
# HostingCo Build Report

**Environment:** $ENVIRONMENT  
**Build Date:** $(date)  
**Git Commit:** $(git rev-parse HEAD 2>/dev/null || echo 'unknown')

## Build Summary

### Shared Package
- Status: ✅ Built successfully
- Location: $SHARED_DIR/dist

### Backend
- Status: ✅ Built successfully
- Location: $BACKEND_DIR/dist
- Entry Point: dist/index.js

### Frontend
- Status: ✅ Built successfully
- Location: $FRONTEND_DIR/dist
- Entry Point: dist/index.html

## Build Statistics

### Frontend Bundle Analysis
EOF

    if [ -d "$FRONTEND_DIR/dist" ]; then
        echo "\`\`\`" >> "$report_file"
        du -sh "$FRONTEND_DIR/dist"/* | sort -hr >> "$report_file"
        echo "\`\`\`" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Test Results
EOF

    if [ "$SKIP_TESTS" = false ]; then
        echo "- Tests were run as part of the build process" >> "$report_file"
    else
        echo "- Tests were skipped with --skip-tests flag" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Lint Results
EOF

    if [ "$SKIP_LINT" = false ]; then
        echo "- Linting was run as part of the build process" >> "$report_file"
    else
        echo "- Linting was skipped with --skip-lint flag" >> "$report_file"
    fi
    
    success "Build report generated: $report_file"
}

# Main execution
log "Starting HostingCo build process for $ENVIRONMENT environment..."

# Check git status (optional)
if git rev-parse --git-dir > /dev/null 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
        warning "You have uncommitted changes. Consider committing before building."
    fi
fi

# Build in order: shared -> backend -> frontend
build_shared
build_backend
build_frontend

# Verify builds
verify_builds

# Generate report
generate_report

# Show summary
echo ""
success "Build process completed successfully!"
echo ""
info "Build artifacts:"
echo "  - Shared:    $SHARED_DIR/dist"
echo "  - Backend:   $BACKEND_DIR/dist"
echo "  - Frontend:  $FRONTEND_DIR/dist"
echo ""
info "Next steps:"
echo "  - Deploy:    ./scripts/deploy.sh $ENVIRONMENT"
echo "  - Docker:    ./scripts/docker-build.sh $ENVIRONMENT"
echo "  - Test:      ./scripts/test.sh $ENVIRONMENT"
