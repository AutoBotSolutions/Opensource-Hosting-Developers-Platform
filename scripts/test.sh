#!/bin/bash

# Testing Script for HostingCo
# Usage: ./scripts/test.sh [scope] [options]
# Scopes: all, backend, frontend, shared, integration, e2e (default: all)
# Options: --watch, --coverage, --verbose, --report, --fix

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
SCOPE=${1:-all}
WATCH_MODE=false
COVERAGE_MODE=false
VERBOSE_MODE=false
REPORT_MODE=false
FIX_MODE=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SHARED_DIR="$PROJECT_ROOT/shared"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
COVERAGE_PERCENTAGE=0

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

result() {
    echo -e "${MAGENTA}[RESULT]${NC} $1"
}

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --coverage)
            COVERAGE_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE_MODE=true
            shift
            ;;
        --report)
            REPORT_MODE=true
            shift
            ;;
        --fix)
            FIX_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [scope] [options]"
            echo "Scopes: all, backend, frontend, shared, integration, e2e (default: all)"
            echo "Options:"
            echo "  --watch      Run tests in watch mode"
            echo "  --coverage   Generate coverage report"
            echo "  --verbose    Show detailed test output"
            echo "  --report     Generate test report"
            echo "  --fix        Auto-fix linting issues"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            if [[ $arg != --* ]]; then
                SCOPE=$arg
            else
                error "Unknown option: $arg. Use --help for available options."
            fi
            shift
            ;;
    esac
done

# Validate scope
case $SCOPE in
    all|backend|frontend|shared|integration|e2e)
        ;;
    *)
        error "Invalid scope: $SCOPE. Use: all, backend, frontend, shared, integration, or e2e"
        ;;
esac

# Function to check if directory exists and has tests
check_test_directory() {
    local dir="$1"
    local name="$2"
    
    if [ ! -d "$dir" ]; then
        warning "$name directory not found: $dir"
        return 1
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

# Function to run backend tests
run_backend_tests() {
    if ! check_test_directory "$BACKEND_DIR" "backend"; then
        return 0
    fi
    
    log "Running backend tests..."
    cd "$BACKEND_DIR"
    
    local test_cmd="npm test"
    local args=""
    
    if [ "$WATCH_MODE" = true ]; then
        args="--watch"
    fi
    
    if [ "$COVERAGE_MODE" = true ]; then
        args="$args --coverage"
    fi
    
    if [ "$VERBOSE_MODE" = true ]; then
        args="$args --verbose"
    fi
    
    if [ -n "$args" ]; then
        test_cmd="$test_cmd -- $args"
    fi
    
    if [ "$VERBOSE_MODE" = true ]; then
        info "Running: $test_cmd"
    fi
    
    if eval "$test_cmd"; then
        success "Backend tests passed"
        ((PASSED_TESTS++))
    else
        error "Backend tests failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# Function to run frontend tests
run_frontend_tests() {
    if ! check_test_directory "$FRONTEND_DIR" "frontend"; then
        return 0
    fi
    
    log "Running frontend tests..."
    cd "$FRONTEND_DIR"
    
    local test_cmd="npm test"
    local args=""
    
    if [ "$WATCH_MODE" = true ]; then
        # For watch mode, we need to run tests differently with create-react-app/vite
        args="-- --watch"
    fi
    
    if [ "$COVERAGE_MODE" = true ]; then
        args="$args --coverage"
    fi
    
    if [ "$VERBOSE_MODE" = true ]; then
        args="$args --verbose"
    fi
    
    if [ -n "$args" ]; then
        test_cmd="$test_cmd $args"
    fi
    
    if [ "$VERBOSE_MODE" = true ]; then
        info "Running: $test_cmd"
    fi
    
    # Handle different test runners
    if [ -f "package.json" ]; then
        if grep -q "test:react-scripts" package.json; then
            # React Scripts
            if [ "$WATCH_MODE" = true ]; then
                CI=true npm test -- --watchAll=false
            else
                CI=true npm test
            fi
        elif grep -q "vite" package.json; then
            # Vite
            eval "$test_cmd"
        else
            # Generic
            eval "$test_cmd"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        success "Frontend tests passed"
        ((PASSED_TESTS++))
    else
        error "Frontend tests failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# Function to run shared tests
run_shared_tests() {
    if ! check_test_directory "$SHARED_DIR" "shared"; then
        return 0
    fi
    
    log "Running shared tests..."
    cd "$SHARED_DIR"
    
    local test_cmd="npm test"
    local args=""
    
    if [ "$WATCH_MODE" = true ]; then
        args="--watch"
    fi
    
    if [ "$COVERAGE_MODE" = true ]; then
        args="$args --coverage"
    fi
    
    if [ "$VERBOSE_MODE" = true ]; then
        args="$args --verbose"
    fi
    
    if [ -n "$args" ]; then
        test_cmd="$test_cmd -- $args"
    fi
    
    if [ "$VERBOSE_MODE" = true ]; then
        info "Running: $test_cmd"
    fi
    
    if eval "$test_cmd"; then
        success "Shared tests passed"
        ((PASSED_TESTS++))
    else
        error "Shared tests failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# Function to run integration tests
run_integration_tests() {
    log "Running integration tests..."
    
    local integration_dir="$PROJECT_ROOT/tests/integration"
    
    if [ ! -d "$integration_dir" ]; then
        warning "Integration tests directory not found: $integration_dir"
        return 0
    fi
    
    cd "$integration_dir"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    local test_cmd="npm test"
    
    if [ "$VERBOSE_MODE" = true ]; then
        info "Running: $test_cmd"
    fi
    
    if eval "$test_cmd"; then
        success "Integration tests passed"
        ((PASSED_TESTS++))
    else
        error "Integration tests failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# Function to run e2e tests
run_e2e_tests() {
    log "Running E2E tests..."
    
    local e2e_dir="$PROJECT_ROOT/tests/e2e"
    
    if [ ! -d "$e2e_dir" ]; then
        warning "E2E tests directory not found: $e2e_dir"
        return 0
    fi
    
    cd "$e2e_dir"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Check if development servers are running
    if ! curl -s http://localhost:3003/api/health >/dev/null 2>&1; then
        warning "Backend server is not running. Please start it with: ./scripts/dev.sh --backend-only"
        return 0
    fi
    
    if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
        warning "Frontend server is not running. Please start it with: ./scripts/dev.sh --frontend-only"
        return 0
    fi
    
    local test_cmd="npm test"
    
    if [ "$VERBOSE_MODE" = true ]; then
        info "Running: $test_cmd"
    fi
    
    if eval "$test_cmd"; then
        success "E2E tests passed"
        ((PASSED_TESTS++))
    else
        error "E2E tests failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# Function to run linting and auto-fix
run_linting() {
    if [ "$FIX_MODE" = false ]; then
        return
    fi
    
    log "Running linting with auto-fix..."
    
    # Backend linting
    if check_test_directory "$BACKEND_DIR" "backend"; then
        cd "$BACKEND_DIR"
        if npm run lint:fix >/dev/null 2>&1; then
            success "Backend linting fixed"
        else
            warning "Backend linting issues remain"
        fi
    fi
    
    # Frontend linting
    if check_test_directory "$FRONTEND_DIR" "frontend"; then
        cd "$FRONTEND_DIR"
        if npm run lint:fix >/dev/null 2>&1; then
            success "Frontend linting fixed"
        else
            warning "Frontend linting issues remain"
        fi
    fi
    
    # Shared linting
    if check_test_directory "$SHARED_DIR" "shared"; then
        cd "$SHARED_DIR"
        if npm run lint:fix >/dev/null 2>&1; then
            success "Shared linting fixed"
        else
            warning "Shared linting issues remain"
        fi
    fi
}

# Function to generate test report
generate_report() {
    if [ "$REPORT_MODE" = false ]; then
        return
    fi
    
    local report_file="$PROJECT_ROOT/test-report-$(date +%Y%m%d_%H%M%S).md"
    
    log "Generating test report: $report_file"
    
    cat > "$report_file" << EOF
# HostingCo Test Report

**Test Date:** $(date)  
**Scope:** $SCOPE  
**Environment:** ${NODE_ENV:-development}

## Test Results Summary

- **Total Test Suites:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Test Suite Results

EOF

    if [ "$SCOPE" = "all" ] || [ "$SCOPE" = "backend" ]; then
        echo "### Backend Tests" >> "$report_file"
        if [ -d "$BACKEND_DIR/coverage" ]; then
            echo "- Coverage report available: \`$BACKEND_DIR/coverage\`" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi
    
    if [ "$SCOPE" = "all" ] || [ "$SCOPE" = "frontend" ]; then
        echo "### Frontend Tests" >> "$report_file"
        if [ -d "$FRONTEND_DIR/coverage" ]; then
            echo "- Coverage report available: \`$FRONTEND_DIR/coverage\`" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi
    
    if [ "$SCOPE" = "all" ] || [ "$SCOPE" = "shared" ]; then
        echo "### Shared Tests" >> "$report_file"
        if [ -d "$SHARED_DIR/coverage" ]; then
            echo "- Coverage report available: \`$SHARED_DIR/coverage\`" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Coverage Summary

EOF

    # Extract coverage information if available
    for dir in "$BACKEND_DIR" "$FRONTEND_DIR" "$SHARED_DIR"; do
        if [ -d "$dir/coverage" ]; then
            local name=$(basename "$dir")
            echo "### $name Coverage" >> "$report_file"
            if [ -f "$dir/coverage/coverage-summary.json" ]; then
                # Parse coverage summary if node is available
                if command -v node >/dev/null 2>&1; then
                    local lines=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$dir/coverage/coverage-summary.json', 'utf8')).total.lines.pct)" 2>/dev/null || echo "N/A")
                    local functions=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$dir/coverage/coverage-summary.json', 'utf8')).total.functions.pct)" 2>/dev/null || echo "N/A")
                    local branches=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$dir/coverage/coverage-summary.json', 'utf8')).total.branches.pct)" 2>/dev/null || echo "N/A")
                    local statements=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$dir/coverage/coverage-summary.json', 'utf8')).total.statements.pct)" 2>/dev/null || echo "N/A")
                    
                    echo "- Lines: $lines%" >> "$report_file"
                    echo "- Functions: $functions%" >> "$report_file"
                    echo "- Branches: $branches%" >> "$report_file"
                    echo "- Statements: $statements%" >> "$report_file"
                fi
            fi
            echo "" >> "$report_file"
        fi
    done
    
    success "Test report generated: $report_file"
}

# Function to show test summary
show_summary() {
    echo ""
    if [ $FAILED_TESTS -eq 0 ]; then
        success "All tests passed! ✅"
    else
        error "Some tests failed! ❌"
    fi
    
    echo ""
    result "Test Summary:"
    echo "  - Scope: $SCOPE"
    echo "  - Total Suites: $TOTAL_TESTS"
    echo "  - Passed: $PASSED_TESTS"
    echo "  - Failed: $FAILED_TESTS"
    echo "  - Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo ""
    
    if [ "$COVERAGE_MODE" = true ]; then
        info "Coverage reports generated in respective coverage/ directories"
    fi
    
    if [ "$REPORT_MODE" = true ]; then
        info "Test report generated (see above for file location)"
    fi
}

# Main execution
log "Starting HostingCo test suite for scope: $SCOPE"

# Run linting with auto-fix if requested
run_linting

# Run tests based on scope
case $SCOPE in
    all)
        run_shared_tests
        run_backend_tests
        run_frontend_tests
        run_integration_tests
        run_e2e_tests
        ;;
    backend)
        run_backend_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    shared)
        run_shared_tests
        ;;
    integration)
        run_integration_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
esac

# Generate report
generate_report

# Show summary
show_summary

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
fi
