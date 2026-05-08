#!/bin/bash

# Clean Script for HostingCo
# Usage: ./scripts/clean.sh [options]
# Options: --deep, --docker, --node-modules, --logs, --cache, --all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
CLEAN_DEEP=false
CLEAN_DOCKER=false
CLEAN_NODE_MODULES=false
CLEAN_LOGS=false
CLEAN_CACHE=false
CLEAN_ALL=false

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
        --deep)
            CLEAN_DEEP=true
            shift
            ;;
        --docker)
            CLEAN_DOCKER=true
            shift
            ;;
        --node-modules)
            CLEAN_NODE_MODULES=true
            shift
            ;;
        --logs)
            CLEAN_LOGS=true
            shift
            ;;
        --cache)
            CLEAN_CACHE=true
            shift
            ;;
        --all)
            CLEAN_ALL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --deep           Deep clean (includes build artifacts, logs, cache)"
            echo "  --docker         Clean Docker resources"
            echo "  --node-modules   Remove node_modules directories"
            echo "  --logs           Remove log files"
            echo "  --cache          Remove cache directories"
            echo "  --all            Clean everything"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $arg. Use --help for available options."
            ;;
    esac
done

# If --all is specified, enable all cleaning options
if [ "$CLEAN_ALL" = true ]; then
    CLEAN_DEEP=true
    CLEAN_DOCKER=true
    CLEAN_NODE_MODULES=true
    CLEAN_LOGS=true
    CLEAN_CACHE=true
fi

# Function to confirm cleaning
confirm_clean() {
    local clean_type="$1"
    
    echo ""
    warning "This will perform a $clean_type clean of the HostingCo project"
    warning "This action cannot be undone"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Cleaning cancelled by user"
        exit 0
    fi
}

# Function to clean build artifacts
clean_build_artifacts() {
    log "Cleaning build artifacts..."
    
    local cleaned=false
    
    # Clean backend build
    if [ -d "$BACKEND_DIR/dist" ]; then
        rm -rf "$BACKEND_DIR/dist"
        info "Removed backend build directory"
        cleaned=true
    fi
    
    if [ -d "$BACKEND_DIR/build" ]; then
        rm -rf "$BACKEND_DIR/build"
        info "Removed backend build directory (alternative)"
        cleaned=true
    fi
    
    # Clean frontend build
    if [ -d "$FRONTEND_DIR/dist" ]; then
        rm -rf "$FRONTEND_DIR/dist"
        info "Removed frontend build directory"
        cleaned=true
    fi
    
    if [ -d "$FRONTEND_DIR/build" ]; then
        rm -rf "$FRONTEND_DIR/build"
        info "Removed frontend build directory (alternative)"
        cleaned=true
    fi
    
    # Clean shared build
    if [ -d "$SHARED_DIR/dist" ]; then
        rm -rf "$SHARED_DIR/dist"
        info "Removed shared build directory"
        cleaned=true
    fi
    
    if [ -d "$SHARED_DIR/build" ]; then
        rm -rf "$SHARED_DIR/build"
        info "Removed shared build directory (alternative)"
        cleaned=true
    fi
    
    # Clean TypeScript output
    find "$PROJECT_ROOT" -name "*.d.ts" -path "*/dist/*" -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.js.map" -path "*/dist/*" -delete 2>/dev/null || true
    
    if [ "$cleaned" = true ]; then
        success "Build artifacts cleaned"
    else
        info "No build artifacts found"
    fi
}

# Function to clean node_modules
clean_node_modules() {
    log "Cleaning node_modules directories..."
    
    local cleaned=false
    
    for dir in "$BACKEND_DIR" "$FRONTEND_DIR" "$SHARED_DIR" "$PROJECT_ROOT"; do
        if [ -d "$dir/node_modules" ]; then
            rm -rf "$dir/node_modules"
            info "Removed node_modules from $(basename "$dir")"
            cleaned=true
        fi
    done
    
    if [ "$cleaned" = true ]; then
        success "Node modules cleaned"
    else
        info "No node_modules directories found"
    fi
}

# Function to clean logs
clean_logs() {
    log "Cleaning log files..."
    
    local cleaned=false
    local log_patterns=(
        "*.log"
        "*.log.*"
        "logs/"
        ".log"
        ".backend.log"
        ".frontend.log"
        "npm-debug.log*"
        "yarn-debug.log*"
        "yarn-error.log*"
        "lerna-debug.log*"
    )
    
    for pattern in "${log_patterns[@]}"; do
        local found=$(find "$PROJECT_ROOT" -name "$pattern" -type f 2>/dev/null || true)
        if [ -n "$found" ]; then
            echo "$found" | xargs rm -f 2>/dev/null || true
            info "Removed log files matching: $pattern"
            cleaned=true
        fi
    done
    
    # Remove log directories
    local log_dirs=$(find "$PROJECT_ROOT" -name "logs" -type d 2>/dev/null || true)
    if [ -n "$log_dirs" ]; then
        echo "$log_dirs" | xargs rm -rf 2>/dev/null || true
        info "Removed log directories"
        cleaned=true
    fi
    
    if [ "$cleaned" = true ]; then
        success "Log files cleaned"
    else
        info "No log files found"
    fi
}

# Function to clean cache
clean_cache() {
    log "Cleaning cache directories..."
    
    local cleaned=false
    
    # Clean npm cache
    if command -v npm >/dev/null 2>&1; then
        npm cache clean --force >/dev/null 2>&1 || true
        info "Cleaned npm cache"
        cleaned=true
    fi
    
    # Clean yarn cache
    if command -v yarn >/dev/null 2>&1; then
        yarn cache clean >/dev/null 2>&1 || true
        info "Cleaned yarn cache"
        cleaned=true
    fi
    
    # Clean various cache directories
    local cache_dirs=(
        ".cache"
        ".next/cache"
        ".vite"
        "coverage"
        ".nyc_output"
        ".eslintcache"
        ".stylelintcache"
        "node_modules/.cache"
        "tmp"
        "temp"
    )
    
    for cache_dir in "${cache_dirs[@]}"; do
        local found=$(find "$PROJECT_ROOT" -name "$cache_dir" -type d 2>/dev/null || true)
        if [ -n "$found" ]; then
            echo "$found" | xargs rm -rf 2>/dev/null || true
            info "Removed cache directory: $cache_dir"
            cleaned=true
        fi
    done
    
    # Clean lock files (optional - be careful)
    if [ "$CLEAN_DEEP" = true ]; then
        local lock_files=$(find "$PROJECT_ROOT" -name "*.lock" -o -name "package-lock.json" -o -name "yarn.lock" 2>/dev/null || true)
        if [ -n "$lock_files" ]; then
            warning "Removing lock files (deep clean)..."
            echo "$lock_files" | xargs rm -f 2>/dev/null || true
            info "Removed lock files"
            cleaned=true
        fi
    fi
    
    if [ "$cleaned" = true ]; then
        success "Cache cleaned"
    else
        info "No cache directories found"
    fi
}

# Function to clean Docker resources
clean_docker() {
    log "Cleaning Docker resources..."
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker not found, skipping Docker cleanup"
        return
    fi
    
    local cleaned=false
    
    # Stop and remove containers
    local containers=$(docker ps -a --filter "name=hostingco" --format "{{.ID}}" 2>/dev/null || true)
    if [ -n "$containers" ]; then
        echo "$containers" | xargs docker stop >/dev/null 2>&1 || true
        echo "$containers" | xargs docker rm -f >/dev/null 2>&1 || true
        info "Removed HostingCo containers"
        cleaned=true
    fi
    
    # Remove images
    local images=$(docker images --filter "reference=*hostingco*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || true)
    if [ -n "$images" ]; then
        echo "$images" | xargs docker rmi -f >/dev/null 2>&1 || true
        info "Removed HostingCo images"
        cleaned=true
    fi
    
    # Remove volumes
    local volumes=$(docker volume ls --filter "name=hostingco" --format "{{.Name}}" 2>/dev/null || true)
    if [ -n "$volumes" ]; then
        echo "$volumes" | xargs docker volume rm -f >/dev/null 2>&1 || true
        info "Removed HostingCo volumes"
        cleaned=true
    fi
    
    # Remove networks
    local networks=$(docker network ls --filter "name=hostingco" --format "{{.Name}}" 2>/dev/null || true)
    if [ -n "$networks" ]; then
        echo "$networks" | xargs docker network rm >/dev/null 2>&1 || true
        info "Removed HostingCo networks"
        cleaned=true
    fi
    
    # General Docker cleanup
    docker system prune -f >/dev/null 2>&1 || true
    info "Performed general Docker cleanup"
    cleaned=true
    
    if [ "$cleaned" = true ]; then
        success "Docker resources cleaned"
    else
        info "No Docker resources found"
    fi
}

# Function to clean temporary files
clean_temp_files() {
    log "Cleaning temporary files..."
    
    local cleaned=false
    
    # Clean temporary files
    local temp_patterns=(
        "*.tmp"
        "*.temp"
        "*.swp"
        "*.swo"
        "*~"
        ".DS_Store"
        "Thumbs.db"
        ".#*"
        "#*#"
        "*.orig"
        "*.rej"
    )
    
    for pattern in "${temp_patterns[@]}"; do
        local found=$(find "$PROJECT_ROOT" -name "$pattern" -type f 2>/dev/null || true)
        if [ -n "$found" ]; then
            echo "$found" | xargs rm -f 2>/dev/null || true
            info "Removed temporary files matching: $pattern"
            cleaned=true
        fi
    done
    
    # Clean editor backup files
    local backup_dirs=$(find "$PROJECT_ROOT" -name ".bak" -o -name "*.bak" -o -name "*~" 2>/dev/null || true)
    if [ -n "$backup_dirs" ]; then
        echo "$backup_dirs" | xargs rm -rf 2>/dev/null || true
        info "Removed backup files"
        cleaned=true
    fi
    
    if [ "$cleaned" = true ]; then
        success "Temporary files cleaned"
    else
        info "No temporary files found"
    fi
}

# Function to show clean summary
show_summary() {
    echo ""
    success "Cleaning completed!"
    echo ""
    
    local total_size=$(du -sh "$PROJECT_ROOT" 2>/dev/null | cut -f1 || echo "unknown")
    info "Current project size: $total_size"
    
    echo ""
    info "Next steps:"
    if [ "$CLEAN_NODE_MODULES" = true ] || [ "$CLEAN_ALL" = true ]; then
        echo "  - Install dependencies: npm run install:all"
    fi
    if [ "$CLEAN_DEEP" = true ] || [ "$CLEAN_ALL" = true ]; then
        echo "  - Rebuild project:     ./scripts/build.sh"
    fi
    if [ "$CLEAN_DOCKER" = true ] || [ "$CLEAN_ALL" = true ]; then
        echo "  - Rebuild Docker:     ./scripts/docker-build.sh"
        echo "  - Start Docker:       ./scripts/docker-up.sh"
    fi
    echo ""
}

# Main execution
log "Starting HostingCo cleanup process..."

# Determine what to clean based on options
if [ "$CLEAN_DEEP" = true ] || [ "$CLEAN_ALL" = true ]; then
    confirm_clean "deep"
    clean_build_artifacts
    clean_cache
    clean_temp_files
fi

if [ "$CLEAN_LOGS" = true ] || [ "$CLEAN_ALL" = true ]; then
    clean_logs
fi

if [ "$CLEAN_DOCKER" = true ] || [ "$CLEAN_ALL" = true ]; then
    clean_docker
fi

if [ "$CLEAN_NODE_MODULES" = true ] || [ "$CLEAN_ALL" = true ]; then
    clean_node_modules
fi

# If no specific options were given, do a basic clean
if [ "$CLEAN_DEEP" = false ] && [ "$CLEAN_DOCKER" = false ] && [ "$CLEAN_NODE_MODULES" = false ] && [ "$CLEAN_LOGS" = false ] && [ "$CLEAN_CACHE" = false ] && [ "$CLEAN_ALL" = false ]; then
    log "No specific clean options provided, performing basic clean..."
    clean_build_artifacts
    clean_temp_files
fi

# Show summary
show_summary
