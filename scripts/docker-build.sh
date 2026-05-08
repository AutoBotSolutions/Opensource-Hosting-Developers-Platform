#!/bin/bash

# Docker Build Script for HostingCo
# Usage: ./scripts/docker-build.sh [environment] [options]
# Environments: development, staging, production (default: production)
# Options: --no-cache, --push, --tag TAG, --verbose

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
NO_CACHE=false
PUSH_IMAGES=false
CUSTOM_TAG=""
VERBOSE=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SHARED_DIR="$PROJECT_ROOT/shared"

# Docker configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
PROJECT_NAME="hostingco"
VERSION_TAG=${CUSTOM_TAG:-$(date +%Y%m%d_%H%M%S)}

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
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --tag)
            CUSTOM_TAG="$2"
            VERSION_TAG="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [environment] [options]"
            echo "Environments: development, staging, production (default: production)"
            echo "Options:"
            echo "  --no-cache        Build without using cache"
            echo "  --push           Push images to registry after build"
            echo "  --tag TAG        Use custom tag instead of timestamp"
            echo "  --verbose        Show detailed build output"
            echo "  --help           Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DOCKER_REGISTRY  Docker registry URL (default: your-registry.com)"
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

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is required but not installed"
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running"
fi

# Function to build Docker image
build_image() {
    local context_dir="$1"
    local dockerfile="$2"
    local image_name="$3"
    local build_args="$4"
    
    log "Building $image_name image..."
    
    local build_cmd="docker build"
    
    if [ "$NO_CACHE" = true ]; then
        build_cmd="$build_cmd --no-cache"
    fi
    
    if [ "$VERBOSE" = true ]; then
        build_cmd="$build_cmd --progress=plain"
    else
        build_cmd="$build_cmd --progress=auto"
    fi
    
    build_cmd="$build_cmd -t $image_name:$VERSION_TAG"
    build_cmd="$build_cmd -t $image_name:latest"
    build_cmd="$build_cmd -f $dockerfile"
    
    if [ -n "$build_args" ]; then
        build_cmd="$build_cmd $build_args"
    fi
    
    build_cmd="$build_cmd $context_dir"
    
    if [ "$VERBOSE" = true ]; then
        info "Running: $build_cmd"
    fi
    
    if eval "$build_cmd"; then
        success "$image_name image built successfully"
    else
        error "$image_name image build failed"
    fi
}

# Function to push Docker image
push_image() {
    local image_name="$1"
    
    if [ "$PUSH_IMAGES" = false ]; then
        return
    fi
    
    log "Pushing $image_name images..."
    
    # Push with version tag
    if docker push "$image_name:$VERSION_TAG"; then
        success "$image_name:$VERSION_TAG pushed successfully"
    else
        error "$image_name:$VERSION_TAG push failed"
    fi
    
    # Push latest tag
    if docker push "$image_name:latest"; then
        success "$image_name:latest pushed successfully"
    else
        error "$image_name:latest push failed"
    fi
}

# Function to check if Dockerfile exists
check_dockerfile() {
    local dockerfile="$1"
    local component="$2"
    
    if [ ! -f "$dockerfile" ]; then
        error "Dockerfile not found for $component: $dockerfile"
    fi
}

# Function to build shared package first
build_shared() {
    log "Building shared package for Docker context..."
    cd "$SHARED_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    npm run build
    
    success "Shared package built successfully"
}

# Function to build backend Docker image
build_backend() {
    local dockerfile="$BACKEND_DIR/Dockerfile"
    local image_name="$DOCKER_REGISTRY/$PROJECT_NAME-backend"
    
    check_dockerfile "$dockerfile" "backend"
    
    # Build shared package first
    build_shared
    
    # Build arguments
    local build_args="--build-arg ENVIRONMENT=$ENVIRONMENT"
    build_args="$build_args --build-arg VERSION=$VERSION_TAG"
    
    build_image "$BACKEND_DIR" "$dockerfile" "$image_name" "$build_args"
    push_image "$image_name"
}

# Function to build frontend Docker image
build_frontend() {
    local dockerfile="$FRONTEND_DIR/Dockerfile"
    local image_name="$DOCKER_REGISTRY/$PROJECT_NAME-frontend"
    
    check_dockerfile "$dockerfile" "frontend"
    
    # Build shared package first
    build_shared
    
    # Build arguments
    local build_args="--build-arg ENVIRONMENT=$ENVIRONMENT"
    build_args="$build_args --build-arg VERSION=$VERSION_TAG"
    
    build_image "$FRONTEND_DIR" "$dockerfile" "$image_name" "$build_args"
    push_image "$image_name"
}

# Function to build nginx Docker image
build_nginx() {
    local nginx_dir="$PROJECT_ROOT/nginx"
    local dockerfile="$nginx_dir/Dockerfile"
    local image_name="$DOCKER_REGISTRY/$PROJECT_NAME-nginx"
    
    if [ ! -d "$nginx_dir" ]; then
        warning "Nginx directory not found: $nginx_dir"
        return
    fi
    
    check_dockerfile "$dockerfile" "nginx"
    
    # Build arguments
    local build_args="--build-arg ENVIRONMENT=$ENVIRONMENT"
    
    build_image "$nginx_dir" "$dockerfile" "$image_name" "$build_args"
    push_image "$image_name"
}

# Function to show build summary
show_summary() {
    echo ""
    success "Docker build process completed!"
    echo ""
    info "Built images:"
    echo "  - $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION_TAG"
    echo "  - $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION_TAG"
    
    if [ -d "$PROJECT_ROOT/nginx" ]; then
        echo "  - $DOCKER_REGISTRY/$PROJECT_NAME-nginx:$VERSION_TAG"
    fi
    
    echo ""
    info "Latest tags:"
    echo "  - $DOCKER_REGISTRY/$PROJECT_NAME-backend:latest"
    echo "  - $DOCKER_REGISTRY/$PROJECT_NAME-frontend:latest"
    
    if [ -d "$PROJECT_ROOT/nginx" ]; then
        echo "  - $DOCKER_REGISTRY/$PROJECT_NAME-nginx:latest"
    fi
    
    echo ""
    info "Next steps:"
    echo "  - Deploy:    ./scripts/deploy.sh $ENVIRONMENT"
    echo "  - Docker up: ./scripts/docker-up.sh $ENVIRONMENT"
    echo "  - Docker down: ./scripts/docker-down.sh"
    
    if [ "$PUSH_IMAGES" = false ]; then
        echo "  - Push:      docker push $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION_TAG"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking Docker build prerequisites..."
    
    # Check if builds exist
    if [ ! -d "$BACKEND_DIR/dist" ]; then
        log "Backend build not found. Building..."
        cd "$BACKEND_DIR" && npm run build
    fi
    
    if [ ! -d "$FRONTEND_DIR/dist" ]; then
        log "Frontend build not found. Building..."
        cd "$FRONTEND_DIR" && npm run build
    fi
    
    # Check Dockerfiles
    for component in backend frontend; do
        local dir=""
        case $component in
            backend) dir="$BACKEND_DIR" ;;
            frontend) dir="$FRONTEND_DIR" ;;
        esac
        
        if [ ! -f "$dir/Dockerfile" ]; then
            error "Dockerfile not found for $component: $dir/Dockerfile"
        fi
    done
    
    success "Prerequisites check passed"
}

# Function to clean up old images
cleanup_images() {
    log "Cleaning up old Docker images..."
    
    # Remove old untagged images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove old versions of our images (keep last 5)
    local images=("$PROJECT_NAME-backend" "$PROJECT_NAME-frontend" "$PROJECT_NAME-nginx")
    
    for image in "${images[@]}"; do
        # Get old images (excluding latest and current version)
        local old_images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "$DOCKER_REGISTRY/$image" | grep -v "latest" | grep -v "$VERSION_TAG" | tail -n +6 | awk '{print $1}')
        
        if [ -n "$old_images" ]; then
            echo "$old_images" | xargs docker rmi -f >/dev/null 2>&1 || true
        fi
    done
    
    success "Docker cleanup completed"
}

# Main execution
log "Starting HostingCo Docker build process for $ENVIRONMENT environment..."

# Check prerequisites
check_prerequisites

# Clean up old images
cleanup_images

# Build images
build_backend
build_frontend
build_nginx

# Show summary
show_summary
