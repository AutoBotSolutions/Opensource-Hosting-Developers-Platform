#!/bin/bash

# Docker Up Script for HostingCo
# Usage: ./scripts/docker-up.sh [environment] [options]
# Environments: development, staging, production (default: development)
# Options: --build, --pull, --detach, --logs, --scale SERVICE=N

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${1:-development}
BUILD_IMAGES=false
PULL_IMAGES=true
DETACH=true
SHOW_LOGS=false
SCALE_SERVICES=""

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
DOCKER_COMPOSE_OVERRIDE="$PROJECT_ROOT/docker-compose.$ENVIRONMENT.yml"

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
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --no-pull)
            PULL_IMAGES=false
            shift
            ;;
        --attach)
            DETACH=false
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --scale)
            SCALE_SERVICES="--scale $2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [environment] [options]"
            echo "Environments: development, staging, production (default: development)"
            echo "Options:"
            echo "  --build           Build images before starting"
            echo "  --no-pull         Don't pull latest images"
            echo "  --attach          Don't run in detached mode"
            echo "  --logs            Show logs after startup"
            echo "  --scale SERVICE=N Scale specific service"
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
    local compose_file="$1"
    local env="$2"
    
    if [ ! -f "$compose_file" ]; then
        error "Docker Compose file not found for $env: $compose_file"
    fi
}

# Function to create environment file
create_env_file() {
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    local template_file="$PROJECT_ROOT/.env.example"
    
    if [ ! -f "$env_file" ]; then
        if [ -f "$template_file" ]; then
            log "Creating environment file for $ENVIRONMENT..."
            cp "$template_file" "$env_file"
            warning "Please edit $env_file with your $ENVIRONMENT configuration"
        else
            error "Environment template file not found: $template_file"
        fi
    fi
}

# Function to pull images
pull_images() {
    if [ "$PULL_IMAGES" = false ]; then
        return
    fi
    
    log "Pulling latest images..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    
    if $compose_cmd -f "$DOCKER_COMPOSE_FILE" -f "$DOCKER_COMPOSE_OVERRIDE" pull; then
        success "Images pulled successfully"
    else
        warning "Some images could not be pulled (they may be built locally)"
    fi
}

# Function to build images
build_images() {
    if [ "$BUILD_IMAGES" = false ]; then
        return
    fi
    
    log "Building Docker images..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    
    if $compose_cmd -f "$DOCKER_COMPOSE_FILE" -f "$DOCKER_COMPOSE_OVERRIDE" build; then
        success "Images built successfully"
    else
        error "Image build failed"
    fi
}

# Function to start services
start_services() {
    log "Starting HostingCo services for $ENVIRONMENT environment..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    local compose_args="-f $DOCKER_COMPOSE_FILE"
    
    if [ -f "$DOCKER_COMPOSE_OVERRIDE" ]; then
        compose_args="$compose_args -f $DOCKER_COMPOSE_OVERRIDE"
    fi
    
    # Set environment file
    if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        export COMPOSE_FILE="$DOCKER_COMPOSE_FILE"
        if [ -f "$DOCKER_COMPOSE_OVERRIDE" ]; then
            export COMPOSE_FILE="$DOCKER_COMPOSE_FILE:$DOCKER_COMPOSE_OVERRIDE"
        fi
    fi
    
    # Build arguments
    local up_args="up -d"
    
    if [ "$DETACH" = false ]; then
        up_args="up"
    fi
    
    if [ -n "$SCALE_SERVICES" ]; then
        up_args="$up_args $SCALE_SERVICES"
    fi
    
    # Start services
    if eval "$compose_cmd $compose_args $up_args"; then
        success "Services started successfully"
    else
        error "Failed to start services"
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    local max_wait=60
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        # Check backend health
        if curl -s http://localhost:3003/api/health >/dev/null 2>&1; then
            success "Backend service is ready"
            break
        fi
        
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        warning "Services may still be starting up"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        success "Frontend service is ready"
    else
        warning "Frontend service may still be starting up"
    fi
}

# Function to show logs
show_logs() {
    if [ "$SHOW_LOGS" = false ]; then
        return
    fi
    
    log "Showing service logs..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    local compose_args="-f $DOCKER_COMPOSE_FILE"
    
    if [ -f "$DOCKER_COMPOSE_OVERRIDE" ]; then
        compose_args="$compose_args -f $DOCKER_COMPOSE_OVERRIDE"
    fi
    
    $compose_cmd $compose_args logs -f --tail=50
}

# Function to show service status
show_status() {
    log "Checking service status..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    local compose_args="-f $DOCKER_COMPOSE_FILE"
    
    if [ -f "$DOCKER_COMPOSE_OVERRIDE" ]; then
        compose_args="$compose_args -f $DOCKER_COMPOSE_OVERRIDE"
    fi
    
    echo ""
    info "Service Status:"
    $compose_cmd $compose_args ps
    echo ""
}

# Function to show URLs
show_urls() {
    echo ""
    info "Service URLs:"
    
    case $ENVIRONMENT in
        development)
            echo "  - Frontend: http://localhost:3000"
            echo "  - Backend:  http://localhost:3003"
            echo "  - API Docs: http://localhost:3003/api/docs"
            ;;
        staging)
            echo "  - Frontend: http://localhost:3000"
            echo "  - Backend:  http://localhost:3003"
            echo "  - API Docs: http://localhost:3003/api/docs"
            ;;
        production)
            echo "  - Frontend: https://your-domain.com"
            echo "  - Backend:  https://api.your-domain.com"
            echo "  - API Docs: https://api.your-domain.com/docs"
            ;;
    esac
    
    echo ""
    info "Useful commands:"
    echo "  - View logs:     $0 $ENVIRONMENT --logs"
    echo "  - Stop services: ./scripts/docker-down.sh"
    echo "  - Restart:      ./scripts/docker-restart.sh $ENVIRONMENT"
    echo ""
}

# Function to check port conflicts
check_port_conflicts() {
    log "Checking for port conflicts..."
    
    local ports=("3000" "3003" "5432" "6379" "80" "443")
    local conflicts=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            conflicts+=($port)
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        warning "Port conflicts detected: ${conflicts[*]}"
        warning "Services may not start properly. Please stop the conflicting processes."
        read -p "Continue anyway? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            exit 0
        fi
    fi
}

# Main execution
log "Starting HostingCo Docker environment for $ENVIRONMENT..."

# Check prerequisites
check_docker_daemon
check_compose_file "$DOCKER_COMPOSE_FILE" "base"

if [ -f "$DOCKER_COMPOSE_OVERRIDE" ]; then
    check_compose_file "$DOCKER_COMPOSE_OVERRIDE" "$ENVIRONMENT"
fi

# Create environment file
create_env_file

# Check port conflicts
check_port_conflicts

# Pull images
pull_images

# Build images if requested
build_images

# Start services
start_services

# Wait for services to be ready
wait_for_services

# Show status
show_status

# Show URLs
show_urls

# Show logs if requested
if [ "$SHOW_LOGS" = true ]; then
    show_logs
fi

success "Docker environment started successfully!"
