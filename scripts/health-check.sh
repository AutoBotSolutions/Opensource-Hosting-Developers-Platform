#!/bin/bash

# Health Check Script for HostingCo
# Usage: ./scripts/health-check.sh [options]
# Options: --detailed, --watch, --endpoint URL, --timeout SECONDS, --output FORMAT

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default configuration
DETAILED_CHECK=false
WATCH_MODE=false
BACKEND_URL="http://localhost:3003"
FRONTEND_URL="http://localhost:3000"
TIMEOUT=10
OUTPUT_FORMAT="table"
CHECK_INTERVAL=30

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Health check results
declare -A HEALTH_RESULTS
OVERALL_STATUS="healthy"

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
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

result() {
    echo -e "${MAGENTA}[RESULT]${NC} $1"
}

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --detailed)
            DETAILED_CHECK=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --interval)
            CHECK_INTERVAL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --detailed       Show detailed health information"
            echo "  --watch          Run health checks continuously"
            echo "  --backend-url    Backend URL (default: http://localhost:3003)"
            echo "  --frontend-url   Frontend URL (default: http://localhost:3000)"
            echo "  --timeout SECONDS Request timeout (default: 10)"
            echo "  --output FORMAT  Output format: table, json, csv (default: table)"
            echo "  --interval SECONDS Check interval for watch mode (default: 30)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $arg. Use --help for available options."
            ;;
    esac
done

# Validate output format
case $OUTPUT_FORMAT in
    table|json|csv)
        ;;
    *)
        error "Invalid output format: $OUTPUT_FORMAT. Use: table, json, or csv"
        ;;
esac

# Validate timeout
if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]] || [ "$TIMEOUT" -lt 1 ]; then
    error "Timeout must be a positive number"
fi

# Validate interval
if ! [[ "$CHECK_INTERVAL" =~ ^[0-9]+$ ]] || [ "$CHECK_INTERVAL" -lt 5 ]; then
    error "Check interval must be at least 5 seconds"
fi

# Function to make HTTP request with timeout
make_request() {
    local url="$1"
    local timeout="$2"
    
    if command -v curl >/dev/null 2>&1; then
        curl -s -f -m "$timeout" "$url" 2>/dev/null
    elif command -v wget >/dev/null 2>&1; then
        wget -q -T "$timeout" -O - "$url" 2>/dev/null
    else
        error "Neither curl nor wget is available for HTTP requests"
    fi
}

# Function to check HTTP status
check_http_status() {
    local url="$1"
    local timeout="$2"
    
    if command -v curl >/dev/null 2>&1; then
        local status=$(curl -s -o /dev/null -w "%{http_code}" -m "$timeout" "$url" 2>/dev/null || echo "000")
        echo "$status"
    else
        # Fallback with wget
        if make_request "$url" "$timeout" >/dev/null 2>&1; then
            echo "200"
        else
            echo "000"
        fi
    fi
}

# Function to check backend health
check_backend_health() {
    local health_url="$BACKEND_URL/api/health"
    local status_code=$(check_http_status "$health_url" "$TIMEOUT")
    local response=$(make_request "$health_url" "$TIMEOUT")
    
    if [ "$status_code" = "200" ]; then
        HEALTH_RESULTS[backend]="healthy"
        
        if [ "$DETAILED_CHECK" = true ]; then
            # Parse health response for detailed info
            local uptime=$(echo "$response" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
            local version=$(echo "$response" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
            local timestamp=$(echo "$response" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
            
            HEALTH_RESULTS[backend_uptime]="$uptime"
            HEALTH_RESULTS[backend_version]="$version"
            HEALTH_RESULTS[backend_timestamp]="$timestamp"
        fi
    elif [ "$status_code" = "000" ]; then
        HEALTH_RESULTS[backend]="unreachable"
        OVERALL_STATUS="unhealthy"
    else
        HEALTH_RESULTS[backend]="error ($status_code)"
        OVERALL_STATUS="unhealthy"
    fi
}

# Function to check frontend health
check_frontend_health() {
    local status_code=$(check_http_status "$FRONTEND_URL" "$TIMEOUT")
    
    if [ "$status_code" = "200" ]; then
        HEALTH_RESULTS[frontend]="healthy"
        
        if [ "$DETAILED_CHECK" = true ]; then
            # Check if it's serving HTML
            local response=$(make_request "$FRONTEND_URL" "$TIMEOUT")
            if echo "$response" | grep -q "<!DOCTYPE html\|<html"; then
                HEALTH_RESULTS[frontend_type]="html"
            else
                HEALTH_RESULTS[frontend_type]="other"
            fi
        fi
    elif [ "$status_code" = "000" ]; then
        HEALTH_RESULTS[frontend]="unreachable"
        OVERALL_STATUS="unhealthy"
    else
        HEALTH_RESULTS[frontend]="error ($status_code)"
        OVERALL_STATUS="unhealthy"
    fi
}

# Function to check database health
check_database_health() {
    if [ "$DETAILED_CHECK" = false ]; then
        return
    fi
    
    # Try to connect to database via backend API
    local db_health_url="$BACKEND_URL/api/health/database"
    local status_code=$(check_http_status "$db_health_url" "$TIMEOUT")
    
    if [ "$status_code" = "200" ]; then
        local response=$(make_request "$db_health_url" "$TIMEOUT")
        local db_status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        local connections=$(echo "$response" | grep -o '"connections":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "unknown")
        
        HEALTH_RESULTS[database]="$db_status"
        HEALTH_RESULTS[database_connections]="$connections"
        
        if [ "$db_status" != "healthy" ]; then
            OVERALL_STATUS="degraded"
        fi
    else
        HEALTH_RESULTS[database]="unreachable"
        OVERALL_STATUS="degraded"
    fi
}

# Function to check Redis health
check_redis_health() {
    if [ "$DETAILED_CHECK" = false ]; then
        return
    fi
    
    # Try to connect to Redis via backend API
    local redis_health_url="$BACKEND_URL/api/health/redis"
    local status_code=$(check_http_status "$redis_health_url" "$TIMEOUT")
    
    if [ "$status_code" = "200" ]; then
        local response=$(make_request "$redis_health_url" "$TIMEOUT")
        local redis_status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        local memory=$(echo "$response" | grep -o '"memory":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        
        HEALTH_RESULTS[redis]="$redis_status"
        HEALTH_RESULTS[redis_memory]="$memory"
        
        if [ "$redis_status" != "healthy" ]; then
            OVERALL_STATUS="degraded"
        fi
    else
        HEALTH_RESULTS[redis]="unreachable"
        OVERALL_STATUS="degraded"
    fi
}

# Function to check system resources
check_system_resources() {
    if [ "$DETAILED_CHECK" = false ]; then
        return
    fi
    
    # Check disk space
    local disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    HEALTH_RESULTS[disk_usage]="$disk_usage%"
    
    if [ "$disk_usage" -gt 90 ]; then
        OVERALL_STATUS="degraded"
    fi
    
    # Check memory usage (if available)
    if command -v free >/dev/null 2>&1; then
        local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        HEALTH_RESULTS[memory_usage]="$memory_usage%"
        
        if [ "$memory_usage" -gt 90 ]; then
            OVERALL_STATUS="degraded"
        fi
    fi
    
    # Check load average (if available)
    if command -v uptime >/dev/null 2>&1; then
        local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        HEALTH_RESULTS[load_average]="$load_avg"
    fi
}

# Function to format output as table
format_table() {
    echo ""
    result "Health Check Results - $(date)"
    echo ""
    
    printf "%-15s | %-20s | %-15s\n" "Component" "Status" "Details"
    printf "%-15s-+-%-20s-+-%-15s\n" "---------------" "--------------------" "---------------"
    
    # Backend
    local backend_status=${HEALTH_RESULTS[backend]}
    local backend_details=""
    if [ "$DETAILED_CHECK" = true ]; then
        backend_details="v${HEALTH_RESULTS[backend_version]} (${HEALTH_RESULTS[backend_uptime]})"
    fi
    printf "%-15s | %-20s | %-15s\n" "Backend" "$backend_status" "$backend_details"
    
    # Frontend
    local frontend_status=${HEALTH_RESULTS[frontend]}
    local frontend_details=""
    if [ "$DETAILED_CHECK" = true ]; then
        frontend_details="${HEALTH_RESULTS[frontend_type]}"
    fi
    printf "%-15s | %-20s | %-15s\n" "Frontend" "$frontend_status" "$frontend_details"
    
    # Database (detailed only)
    if [ "$DETAILED_CHECK" = true ]; then
        local db_status=${HEALTH_RESULTS[database]:-"unknown"}
        local db_details=${HEALTH_RESULTS[database_connections]:-""}
        printf "%-15s | %-20s | %-15s\n" "Database" "$db_status" "$db_details connections"
        
        # Redis
        local redis_status=${HEALTH_RESULTS[redis]:-"unknown"}
        local redis_details=${HEALTH_RESULTS[redis_memory]:-""}
        printf "%-15s | %-20s | %-15s\n" "Redis" "$redis_status" "$redis_details"
        
        # System Resources
        printf "%-15s | %-20s | %-15s\n" "Disk Usage" "${HEALTH_RESULTS[disk_usage]}" ""
        printf "%-15s | %-20s | %-15s\n" "Memory Usage" "${HEALTH_RESULTS[memory_usage]}" ""
        printf "%-15s | %-20s | %-15s\n" "Load Average" "${HEALTH_RESULTS[load_average]}" ""
    fi
    
    echo ""
    
    # Overall status
    if [ "$OVERALL_STATUS" = "healthy" ]; then
        success "Overall Status: $OVERALL_STATUS ✓"
    elif [ "$OVERALL_STATUS" = "degraded" ]; then
        warning "Overall Status: $OVERALL_STATUS ⚠"
    else
        error "Overall Status: $OVERALL_STATUS ✗"
    fi
    
    echo ""
}

# Function to format output as JSON
format_json() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat << EOF
{
  "timestamp": "$timestamp",
  "overall_status": "$OVERALL_STATUS",
  "checks": {
    "backend": {
      "status": "${HEALTH_RESULTS[backend]}",
      "url": "$BACKEND_URL/api/health"
EOF
    
    if [ "$DETAILED_CHECK" = true ]; then
        cat << EOF
      ,
      "version": "${HEALTH_RESULTS[backend_version]}",
      "uptime": "${HEALTH_RESULTS[backend_uptime]}",
      "timestamp": "${HEALTH_RESULTS[backend_timestamp]}"
EOF
    fi
    
    cat << EOF
    },
    "frontend": {
      "status": "${HEALTH_RESULTS[frontend]}",
      "url": "$FRONTEND_URL"
EOF
    
    if [ "$DETAILED_CHECK" = true ]; then
        cat << EOF
      ,
      "type": "${HEALTH_RESULTS[frontend_type]}"
EOF
    fi
    
    cat << EOF
    }
EOF
    
    if [ "$DETAILED_CHECK" = true ]; then
        cat << EOF
    ,
    "database": {
      "status": "${HEALTH_RESULTS[database]}",
      "connections": "${HEALTH_RESULTS[database_connections]}"
    },
    "redis": {
      "status": "${HEALTH_RESULTS[redis]}",
      "memory": "${HEALTH_RESULTS[redis_memory]}"
    },
    "system": {
      "disk_usage": "${HEALTH_RESULTS[disk_usage]}",
      "memory_usage": "${HEALTH_RESULTS[memory_usage]}",
      "load_average": "${HEALTH_RESULTS[load_average]}"
    }
EOF
    fi
    
    cat << EOF
  }
}
EOF
}

# Function to format output as CSV
format_csv() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "timestamp,component,status,url,details"
    echo "$timestamp,backend,${HEALTH_RESULTS[backend]},$BACKEND_URL/api/health,"
    echo "$timestamp,frontend,${HEALTH_RESULTS[frontend]},$FRONTEND_URL,"
    
    if [ "$DETAILED_CHECK" = true ]; then
        echo "$timestamp,database,${HEALTH_RESULTS[database]},,${HEALTH_RESULTS[database_connections]} connections"
        echo "$timestamp,redis,${HEALTH_RESULTS[redis]},,${HEALTH_RESULTS[redis_memory]}"
        echo "$timestamp,disk_usage,${HEALTH_RESULTS[disk_usage]},,"
        echo "$timestamp,memory_usage,${HEALTH_RESULTS[memory_usage]},,"
        echo "$timestamp,load_average,${HEALTH_RESULTS[load_average]},,"
    fi
    
    echo "$timestamp,overall,$OVERALL_STATUS,,"
}

# Function to run health checks
run_health_checks() {
    # Reset results
    unset HEALTH_RESULTS
    declare -gA HEALTH_RESULTS
    OVERALL_STATUS="healthy"
    
    # Run all checks
    check_backend_health
    check_frontend_health
    check_database_health
    check_redis_health
    check_system_resources
}

# Function to watch mode
watch_mode() {
    log "Starting health check watch mode (interval: ${CHECK_INTERVAL}s)..."
    log "Press Ctrl+C to stop watching"
    echo ""
    
    while true; do
        run_health_checks
        
        # Clear screen for better readability
        clear 2>/dev/null || printf "\033c"
        
        # Show results
        case $OUTPUT_FORMAT in
            table)
                format_table
                ;;
            json)
                format_json
                ;;
            csv)
                format_csv
                ;;
        esac
        
        # Wait for next check
        sleep $CHECK_INTERVAL
    done
}

# Function to check prerequisites
check_prerequisites() {
    # Check if curl or wget is available
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        error "curl or wget is required for health checks"
    fi
}

# Main execution
log "Starting HostingCo health check..."

# Check prerequisites
check_prerequisites

# Run health checks
run_health_checks

# Output results
case $OUTPUT_FORMAT in
    table)
        format_table
        ;;
    json)
        format_json
        ;;
    csv)
        format_csv
        ;;
esac

# Watch mode
if [ "$WATCH_MODE" = true ]; then
    watch_mode
fi

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "healthy" ]; then
    exit 0
elif [ "$OVERALL_STATUS" = "degraded" ]; then
    exit 1
else
    exit 2
fi
