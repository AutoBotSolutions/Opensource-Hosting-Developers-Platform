#!/bin/bash

# Docker Down Script for HostingCo
# Usage: ./scripts/docker-down.sh [options]
# Options: --volumes, --remove-orphans, --timeout SECONDS, --force

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
REMOVE_VOLUMES=false
REMOVE_ORPHANS=false
TIMEOUT=30
FORCE=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

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
        --volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        --remove-orphans)
            REMOVE_ORPHANS=true
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --volumes         Remove named volumes"
            echo "  --remove-orphans  Remove orphaned containers"
            echo "  --timeout SECONDS Set shutdown timeout (default: 30)"
            echo "  --force           Force shutdown without confirmation"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $arg. Use --help for available options."
            ;;
    esac
done

# Validate timeout
if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]] || [ "$TIMEOUT" -lt 0 ]; then
    error "Timeout must be a positive number"
fi

# Check if directories exist
if [ ! -d "$PROJECT_ROOT" ]; then
    error "Project root directory not found: $PROJECT_ROOT"
fi

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is required but not installed"
fi

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose is required but not installed"
fi

# Function to get Docker Compose command
get_docker_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# Function to check Docker daemon
check_docker_daemon() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running"
    fi
}

# Function to check Docker Compose file
check_compose_file() {
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi
}

# Function to show running services
show_running_services() {
    local compose_cmd=$(get_docker_compose_cmd)
    
    if $compose_cmd -f "$DOCKER_COMPOSE_FILE" ps -q | grep -q .; then
        log "Currently running services:"
        $compose_cmd -f "$DOCKER_COMPOSE_FILE" ps
        echo ""
        return 0
    else
        info "No services are currently running"
        return 1
    fi
}

# Function to confirm shutdown
confirm_shutdown() {
    if [ "$FORCE" = true ]; then
        return
    fi
    
    if show_running_services; then
        warning "This will stop all running HostingCo services"
        
        if [ "$REMOVE_VOLUMES" = true ]; then
            warning "WARNING: This will also remove all named volumes and their data!"
        fi
        
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            log "Shutdown cancelled by user"
            exit 0
        fi
    else
        info "No services to stop"
        exit 0
    fi
}

# Function to stop services
stop_services() {
    log "Stopping HostingCo services..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    local down_args="down --timeout $TIMEOUT"
    
    if [ "$REMOVE_VOLUMES" = true ]; then
        down_args="$down_args --volumes"
    fi
    
    if [ "$REMOVE_ORPHANS" = true ]; then
        down_args="$down_args --remove-orphans"
    fi
    
    # Check for environment-specific compose files
    local compose_files="$DOCKER_COMPOSE_FILE"
    for env_file in "$PROJECT_ROOT/docker-compose.development.yml" "$PROJECT_ROOT/docker-compose.staging.yml" "$PROJECT_ROOT/docker-compose.production.yml"; do
        if [ -f "$env_file" ]; then
            compose_files="$compose_files -f $env_file"
        fi
    done
    
    # Stop services
    if eval "$compose_cmd $compose_files $down_args"; then
        success "Services stopped successfully"
    else
        error "Failed to stop services"
    fi
}

# Function to force remove remaining containers
force_cleanup() {
    log "Performing force cleanup..."
    
    # Remove any remaining containers
    local containers=$(docker ps -a --filter "name=hostingco" --format "{{.ID}}" 2>/dev/null || true)
    
    if [ -n "$containers" ]; then
        info "Removing remaining containers..."
        echo "$containers" | xargs docker rm -f >/dev/null 2>&1 || true
    fi
    
    # Remove orphaned containers if requested
    if [ "$REMOVE_ORPHANS" = true ]; then
        local orphans=$(docker ps -a --filter "label=com.docker.compose.project" --format "{{.ID}}" 2>/dev/null || true)
        if [ -n "$orphans" ]; then
            info "Removing orphaned containers..."
            echo "$orphans" | xargs docker rm -f >/dev/null 2>&1 || true
        fi
    fi
    
    # Remove volumes if requested
    if [ "$REMOVE_VOLUMES" = true ]; then
        local volumes=$(docker volume ls --filter "name=hostingco" --format "{{.Name}}" 2>/dev/null || true)
        if [ -n "$volumes" ]; then
            info "Removing named volumes..."
            echo "$volumes" | xargs docker volume rm -f >/dev/null 2>&1 || true
        fi
    fi
    
    success "Force cleanup completed"
}

# Function to show cleanup summary
show_cleanup_summary() {
    log "Generating cleanup summary..."
    
    local container_count=$(docker ps -a --filter "name=hostingco" --format "{{.ID}}" | wc -l 2>/dev/null || echo "0")
    local volume_count=$(docker volume ls --filter "name=hostingco" --format "{{.Name}}" | wc -l 2>/dev/null || echo "0")
    
    echo ""
    info "Cleanup Summary:"
    echo "  - Remaining containers: $container_count"
    echo "  - Remaining volumes: $volume_count"
    
    if [ "$container_count" -eq 0 ] && [ "$volume_count" -eq 0 ]; then
        success "Complete cleanup achieved"
    else
        warning "Some resources may remain. Use --force flag for thorough cleanup."
    fi
    
    echo ""
    info "Useful commands:"
    echo "  - View containers: docker ps -a --filter 'name=hostingco'"
    echo "  - View volumes:    docker volume ls --filter 'name=hostingco'"
    echo "  - Start services:  ./scripts/docker-up.sh"
    echo ""
}

# Function to check for stuck services
check_stuck_services() {
    log "Checking for stuck services..."
    
    local stuck_containers=$(docker ps --filter "name=hostingco" --filter "status=exited" --format "{{.ID}}" 2>/dev/null || true)
    
    if [ -n "$stuck_containers" ]; then
        warning "Found stuck containers. Forcing removal..."
        echo "$stuck_containers" | xargs docker rm -f >/dev/null 2>&1 || true
    fi
}

# Main execution
log "Stopping HostingCo Docker environment..."

# Check prerequisites
check_docker_daemon
check_compose_file

# Check for stuck services first
check_stuck_services

# Confirm shutdown
confirm_shutdown

# Stop services
stop_services

# Force cleanup if needed
if [ "$FORCE" = true ]; then
    force_cleanup
fi

# Show cleanup summary
show_cleanup_summary

success "Docker environment stopped successfully!"
