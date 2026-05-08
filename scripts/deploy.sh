#!/bin/bash

# Deployment Script for HostingCo
# Usage: ./scripts/deploy.sh [environment] [options]
# Environments: staging, production (development not supported for deployment)
# Options: --force, --dry-run, --skip-backup, --skip-health-check

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${1:-staging}
FORCE_DEPLOY=false
DRY_RUN=false
SKIP_BACKUP=false
SKIP_HEALTH_CHECK=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Deployment configuration (customize based on your infrastructure)
DEPLOY_USER=${DEPLOY_USER:-deploy}
DEPLOY_HOST_STAGING=${DEPLOY_HOST_STAGING:-staging.hostingco.com}
DEPLOY_HOST_PRODUCTION=${DEPLOY_HOST_PRODUCTION:-production.hostingco.com}
DEPLOY_PATH_STAGING=${DEPLOY_PATH_STAGING:-/var/www/hostingco-staging}
DEPLOY_PATH_PRODUCTION=${DEPLOY_PATH_PRODUCTION:-/var/www/hostingco}
BACKUP_PATH=${BACKUP_PATH:-/var/backups/hostingco}

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
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --help)
            echo "Usage: $0 [environment] [options]"
            echo "Environments: staging, production"
            echo "Options:"
            echo "  --force              Force deployment without confirmation"
            echo "  --dry-run            Simulate deployment without making changes"
            echo "  --skip-backup        Skip creating backup"
            echo "  --skip-health-check  Skip post-deployment health check"
            echo "  --help               Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DEPLOY_USER          SSH user for deployment (default: deploy)"
            echo "  DEPLOY_HOST_STAGING  Staging host (default: staging.hostingco.com)"
            echo "  DEPLOY_HOST_PRODUCTION Production host (default: production.hostingco.com)"
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
if [ "$ENVIRONMENT" = "development" ]; then
    error "Development environment is not supported for deployment. Use staging or production."
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    error "Invalid environment: $ENVIRONMENT. Use: staging or production"
fi

# Set deployment variables based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
    DEPLOY_HOST=$DEPLOY_HOST_STAGING
    DEPLOY_PATH=$DEPLOY_PATH_STAGING
else
    DEPLOY_HOST=$DEPLOY_HOST_PRODUCTION
    DEPLOY_PATH=$DEPLOY_PATH_PRODUCTION
fi

# Function to run SSH command
run_ssh() {
    local cmd="$1"
    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: SSH command: $cmd"
    else
        ssh "$DEPLOY_USER@$DEPLOY_HOST" "$cmd"
    fi
}

# Function to copy files via SCP
run_scp() {
    local src="$1"
    local dest="$2"
    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: SCP copy: $src -> $dest"
    else
        scp -r "$src" "$dest"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if build exists
    if [ ! -d "$BACKEND_DIR/dist" ]; then
        error "Backend build not found. Run './scripts/build.sh $ENVIRONMENT' first"
    fi
    
    if [ ! -d "$FRONTEND_DIR/dist" ]; then
        error "Frontend build not found. Run './scripts/build.sh $ENVIRONMENT' first"
    fi
    
    # Check SSH connectivity
    if [ "$DRY_RUN" = false ]; then
        log "Testing SSH connectivity to $DEPLOY_HOST..."
        if ! ssh -o ConnectTimeout=10 "$DEPLOY_USER@$DEPLOY_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
            error "Cannot connect to $DEPLOY_HOST via SSH. Check your SSH configuration."
        fi
    fi
    
    # Check if required commands exist
    for cmd in ssh scp; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error "Required command not found: $cmd"
        fi
    done
    
    success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        warning "Skipping backup creation"
        return
    fi
    
    log "Creating backup of current deployment..."
    
    local backup_name="backup-$(date +%Y%m%d_%H%M%S)"
    local backup_dir="$BACKUP_PATH/$backup_name"
    
    run_ssh "mkdir -p $backup_dir && cp -r $DEPLOY_PATH/* $backup_dir/ 2>/dev/null || true"
    
    if [ "$DRY_RUN" = false ]; then
        success "Backup created: $backup_dir"
    fi
}

# Function to deploy backend
deploy_backend() {
    log "Deploying backend to $ENVIRONMENT..."
    
    # Create temporary directory for deployment
    local temp_dir="/tmp/hostingco-backend-$(date +%s)"
    
    if [ "$DRY_RUN" = false ]; then
        run_ssh "mkdir -p $temp_dir"
    fi
    
    # Copy backend build
    run_scp "$BACKEND_DIR/dist/" "$DEPLOY_USER@$DEPLOY_HOST:$temp_dir/"
    
    # Copy package.json for production dependencies
    run_scp "$BACKEND_DIR/package.json" "$DEPLOY_USER@$DEPLOY_HOST:$temp_dir/"
    run_scp "$BACKEND_DIR/package-lock.json" "$DEPLOY_USER@$DEPLOY_HOST:$temp_dir/" 2>/dev/null || true
    
    # Install production dependencies and move to deployment location
    run_ssh "cd $temp_dir && npm ci --production && cd .. && rm -rf $DEPLOY_PATH/backend && mv $temp_dir $DEPLOY_PATH/backend"
    
    # Restart backend service
    if [ "$DRY_RUN" = false ]; then
        run_ssh "sudo systemctl restart hostingco-backend || sudo service hostingco-backend restart || echo 'Service restart command may need adjustment'"
    fi
    
    success "Backend deployment completed"
}

# Function to deploy frontend
deploy_frontend() {
    log "Deploying frontend to $ENVIRONMENT..."
    
    # Create temporary directory for deployment
    local temp_dir="/tmp/hostingco-frontend-$(date +%s)"
    
    if [ "$DRY_RUN" = false ]; then
        run_ssh "mkdir -p $temp_dir"
    fi
    
    # Copy frontend build
    run_scp "$FRONTEND_DIR/dist/" "$DEPLOY_USER@$DEPLOY_HOST:$temp_dir/"
    
    # Move to deployment location
    run_ssh "cd .. && rm -rf $DEPLOY_PATH/frontend && mv $temp_dir $DEPLOY_PATH/frontend"
    
    # Restart nginx/web server
    if [ "$DRY_RUN" = false ]; then
        run_ssh "sudo systemctl reload nginx || sudo service nginx reload || echo 'Nginx reload command may need adjustment'"
    fi
    
    success "Frontend deployment completed"
}

# Function to run health checks
run_health_checks() {
    if [ "$SKIP_HEALTH_CHECK" = true ]; then
        warning "Skipping health checks"
        return
    fi
    
    log "Running post-deployment health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    local backend_url="http://$DEPLOY_HOST/api/health"
    if curl -s -f "$backend_url" >/dev/null 2>&1; then
        success "Backend health check passed"
    else
        error "Backend health check failed at $backend_url"
    fi
    
    # Check frontend accessibility
    local frontend_url="http://$DEPLOY_HOST"
    if curl -s -f "$frontend_url" >/dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed at $frontend_url"
    fi
}

# Function to show deployment summary
show_summary() {
    echo ""
    success "Deployment to $ENVIRONMENT completed successfully!"
    echo ""
    info "Deployment summary:"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Host: $DEPLOY_HOST"
    echo "  - Path: $DEPLOY_PATH"
    echo "  - Backend: $DEPLOY_PATH/backend"
    echo "  - Frontend: $DEPLOY_PATH/frontend"
    echo ""
    
    if [ "$SKIP_BACKUP" = false ] && [ "$DRY_RUN" = false ]; then
        info "Backup created in $BACKUP_PATH"
    fi
    
    info "Application URLs:"
    if [ "$ENVIRONMENT" = "staging" ]; then
        echo "  - Frontend: http://$DEPLOY_HOST"
        echo "  - Backend API: http://$DEPLOY_HOST/api"
        echo "  - API Docs: http://$DEPLOY_HOST/api/docs"
    else
        echo "  - Frontend: https://$DEPLOY_HOST"
        echo "  - Backend API: https://$DEPLOY_HOST/api"
        echo "  - API Docs: https://$DEPLOY_HOST/api/docs"
    fi
    echo ""
}

# Function to confirm deployment
confirm_deployment() {
    if [ "$FORCE_DEPLOY" = true ] || [ "$DRY_RUN" = true ]; then
        return
    fi
    
    echo ""
    warning "You are about to deploy to $ENVIRONMENT environment"
    warning "This will replace the current deployment on $DEPLOY_HOST"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Deployment cancelled by user"
        exit 0
    fi
}

# Main execution
log "Starting HostingCo deployment to $ENVIRONMENT environment..."

# Check prerequisites
check_prerequisites

# Confirm deployment
confirm_deployment

if [ "$DRY_RUN" = true ]; then
    info "DRY RUN MODE: No actual changes will be made"
fi

# Create backup
create_backup

# Deploy components
deploy_backend
deploy_frontend

# Run health checks
run_health_checks

# Show summary
show_summary
