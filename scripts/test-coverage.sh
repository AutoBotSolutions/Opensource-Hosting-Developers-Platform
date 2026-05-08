#!/bin/bash

# Test Coverage Script for HostingCo
# Usage: ./scripts/test-coverage.sh [scope] [options]
# Scopes: all, backend, frontend, shared (default: all)
# Options: --report, --threshold NUM, --compare, --html

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
GENERATE_REPORT=false
COVERAGE_THRESHOLD=80
COMPARE_COVERAGE=false
HTML_REPORT=false

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SHARED_DIR="$PROJECT_ROOT/shared"
COVERAGE_DIR="$PROJECT_ROOT/coverage"

# Coverage results
declare -A COVERAGE_RESULTS
TOTAL_COVERAGE=0

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
        --report)
            GENERATE_REPORT=true
            shift
            ;;
        --threshold)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        --compare)
            COMPARE_COVERAGE=true
            shift
            ;;
        --html)
            HTML_REPORT=true
            shift
            ;;
        --help)
            echo "Usage: $0 [scope] [options]"
            echo "Scopes: all, backend, frontend, shared (default: all)"
            echo "Options:"
            echo "  --report         Generate detailed coverage report"
            echo "  --threshold NUM  Set coverage threshold (default: 80)"
            echo "  --compare        Compare with previous coverage"
            echo "  --html           Generate HTML coverage reports"
            echo "  --help           Show this help message"
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

# Validate threshold
if ! [[ "$COVERAGE_THRESHOLD" =~ ^[0-9]+$ ]] || [ "$COVERAGE_THRESHOLD" -lt 0 ] || [ "$COVERAGE_THRESHOLD" -gt 100 ]; then
    error "Coverage threshold must be a number between 0 and 100"
fi

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
        warning "$name directory not found: $dir"
        return 1
    fi
    
    if [ ! -d "$dir/node_modules" ]; then
        log "Installing $name dependencies..."
        cd "$dir" && npm install
    fi
    
    # Check if there are test files
    if [ ! -d "$dir/test" ] && [ ! -d "$dir/tests" ] && [ ! -d "$dir/src/__tests__" ]; then
        warning "No test directory found for $name"
        return 1
    fi
    
    return 0
}

# Function to run coverage for backend
run_backend_coverage() {
    if ! check_test_directory "$BACKEND_DIR" "backend"; then
        COVERAGE_RESULTS[backend]="N/A"
        return
    fi
    
    log "Running backend coverage analysis..."
    cd "$BACKEND_DIR"
    
    local coverage_cmd="npm run test:coverage"
    local args=""
    
    if [ "$HTML_REPORT" = true ]; then
        # Check if the test script supports HTML output
        if grep -q "coverage" package.json; then
            args="$args --coverageReport=html"
        fi
    fi
    
    if [ -n "$args" ]; then
        coverage_cmd="$coverage_cmd -- $args"
    fi
    
    if eval "$coverage_cmd" >/dev/null 2>&1; then
        # Extract coverage percentage
        if [ -f "coverage/coverage-summary.json" ]; then
            local coverage=$(node -e "console.log(JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json', 'utf8')).total.lines.pct)" 2>/dev/null || echo "0")
            COVERAGE_RESULTS[backend]=$coverage
            success "Backend coverage: ${coverage}%"
        else
            COVERAGE_RESULTS[backend]="N/A"
            warning "Backend coverage summary not found"
        fi
    else
        COVERAGE_RESULTS[backend]="0"
        error "Backend coverage analysis failed"
    fi
}

# Function to run coverage for frontend
run_frontend_coverage() {
    if ! check_test_directory "$FRONTEND_DIR" "frontend"; then
        COVERAGE_RESULTS[frontend]="N/A"
        return
    fi
    
    log "Running frontend coverage analysis..."
    cd "$FRONTEND_DIR"
    
    local coverage_cmd="npm run test:coverage"
    
    # Handle different test runners
    if [ -f "package.json" ]; then
        if grep -q "test:react-scripts" package.json; then
            # React Scripts
            coverage_cmd="CI=true npm test -- --coverage --watchAll=false"
        elif grep -q "vite" package.json; then
            # Vite
            coverage_cmd="npm run test:coverage"
        else
            # Generic
            coverage_cmd="npm run test:coverage"
        fi
    fi
    
    if eval "$coverage_cmd" >/dev/null 2>&1; then
        # Extract coverage percentage
        if [ -f "coverage/coverage-summary.json" ]; then
            local coverage=$(node -e "console.log(JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json', 'utf8')).total.lines.pct)" 2>/dev/null || echo "0")
            COVERAGE_RESULTS[frontend]=$coverage
            success "Frontend coverage: ${coverage}%"
        else
            COVERAGE_RESULTS[frontend]="N/A"
            warning "Frontend coverage summary not found"
        fi
    else
        COVERAGE_RESULTS[frontend]="0"
        error "Frontend coverage analysis failed"
    fi
}

# Function to run coverage for shared
run_shared_coverage() {
    if ! check_test_directory "$SHARED_DIR" "shared"; then
        COVERAGE_RESULTS[shared]="N/A"
        return
    fi
    
    log "Running shared coverage analysis..."
    cd "$SHARED_DIR"
    
    local coverage_cmd="npm run test:coverage"
    
    if eval "$coverage_cmd" >/dev/null 2>&1; then
        # Extract coverage percentage
        if [ -f "coverage/coverage-summary.json" ]; then
            local coverage=$(node -e "console.log(JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json', 'utf8')).total.lines.pct)" 2>/dev/null || echo "0")
            COVERAGE_RESULTS[shared]=$coverage
            success "Shared coverage: ${coverage}%"
        else
            COVERAGE_RESULTS[shared]="N/A"
            warning "Shared coverage summary not found"
        fi
    else
        COVERAGE_RESULTS[shared]="0"
        error "Shared coverage analysis failed"
    fi
}

# Function to compare with previous coverage
compare_coverage() {
    if [ "$COMPARE_COVERAGE" = false ]; then
        return
    fi
    
    log "Comparing with previous coverage..."
    
    local previous_file="$PROJECT_ROOT/.previous-coverage"
    
    if [ ! -f "$previous_file" ]; then
        warning "No previous coverage data found. Saving current coverage for future comparison."
        echo "${COVERAGE_RESULTS[backend]}:${COVERAGE_RESULTS[frontend]}:${COVERAGE_RESULTS[shared]}" > "$previous_file"
        return
    fi
    
    local previous=$(cat "$previous_file")
    local prev_backend=$(echo "$previous" | cut -d: -f1)
    local prev_frontend=$(echo "$previous" | cut -d: -f2)
    local prev_shared=$(echo "$previous" | cut -d: -f3)
    
    echo ""
    info "Coverage Comparison:"
    
    if [ "${COVERAGE_RESULTS[backend]}" != "N/A" ] && [ "$prev_backend" != "N/A" ]; then
        local diff=$((${COVERAGE_RESULTS[backend]} - prev_backend))
        if [ $diff -gt 0 ]; then
            result "Backend: +${diff}% (was ${prev_backend}%, now ${COVERAGE_RESULTS[backend]}%)"
        elif [ $diff -lt 0 ]; then
            warning "Backend: ${diff}% (was ${prev_backend}%, now ${COVERAGE_RESULTS[backend]}%)"
        else
            result "Backend: no change (${prev_backend}%)"
        fi
    fi
    
    if [ "${COVERAGE_RESULTS[frontend]}" != "N/A" ] && [ "$prev_frontend" != "N/A" ]; then
        local diff=$((${COVERAGE_RESULTS[frontend]} - prev_frontend))
        if [ $diff -gt 0 ]; then
            result "Frontend: +${diff}% (was ${prev_frontend}%, now ${COVERAGE_RESULTS[frontend]}%)"
        elif [ $diff -lt 0 ]; then
            warning "Frontend: ${diff}% (was ${prev_frontend}%, now ${COVERAGE_RESULTS[frontend]}%)"
        else
            result "Frontend: no change (${prev_frontend}%)"
        fi
    fi
    
    if [ "${COVERAGE_RESULTS[shared]}" != "N/A" ] && [ "$prev_shared" != "N/A" ]; then
        local diff=$((${COVERAGE_RESULTS[shared]} - prev_shared))
        if [ $diff -gt 0 ]; then
            result "Shared: +${diff}% (was ${prev_shared}%, now ${COVERAGE_RESULTS[shared]}%)"
        elif [ $diff -lt 0 ]; then
            warning "Shared: ${diff}% (was ${prev_shared}%, now ${COVERAGE_RESULTS[shared]}%)"
        else
            result "Shared: no change (${prev_shared}%)"
        fi
    fi
    
    # Update previous coverage file
    echo "${COVERAGE_RESULTS[backend]}:${COVERAGE_RESULTS[frontend]}:${COVERAGE_RESULTS[shared]}" > "$previous_file"
}

# Function to check coverage threshold
check_threshold() {
    local failed=false
    
    echo ""
    info "Checking coverage threshold (${COVERAGE_THRESHOLD}%):"
    
    for component in backend frontend shared; do
        local coverage=${COVERAGE_RESULTS[$component]}
        if [ "$coverage" != "N/A" ]; then
            if [ "$coverage" -ge "$COVERAGE_THRESHOLD" ]; then
                success "$component: ${coverage}% ✓"
            else
                warning "$component: ${coverage}% ✗ (below threshold)"
                failed=true
            fi
        else
            warning "$component: N/A ✗ (no coverage data)"
            failed=true
        fi
    done
    
    if [ "$failed" = true ]; then
        error "Coverage threshold not met for some components"
    fi
}

# Function to generate coverage report
generate_coverage_report() {
    if [ "$GENERATE_REPORT" = false ]; then
        return
    fi
    
    local report_file="$PROJECT_ROOT/coverage-report-$(date +%Y%m%d_%H%M%S).md"
    
    log "Generating coverage report: $report_file"
    
    cat > "$report_file" << EOF
# HostingCo Coverage Report

**Report Date:** $(date)  
**Scope:** $SCOPE  
**Coverage Threshold:** ${COVERAGE_THRESHOLD}%

## Coverage Summary

| Component | Coverage | Status |
|-----------|----------|--------|
EOF

    for component in backend frontend shared; do
        local coverage=${COVERAGE_RESULTS[$component]}
        local status="❌"
        
        if [ "$coverage" != "N/A" ]; then
            if [ "$coverage" -ge "$COVERAGE_THRESHOLD" ]; then
                status="✅"
            fi
            echo "| $component | ${coverage}% | $status |" >> "$report_file"
        else
            echo "| $component | N/A | $status |" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

## Detailed Coverage Reports

EOF

    # Add detailed coverage for each component
    for component in backend frontend shared; do
        local dir=""
        case $component in
            backend) dir="$BACKEND_DIR" ;;
            frontend) dir="$FRONTEND_DIR" ;;
            shared) dir="$SHARED_DIR" ;;
        esac
        
        if [ -f "$dir/coverage/coverage-summary.json" ]; then
            echo "### $component Coverage Details" >> "$report_file"
            echo "" >> "$report_file"
            
            if command -v node >/dev/null 2>&1; then
                node -e "
const data = JSON.parse(require('fs').readFileSync('$dir/coverage/coverage-summary.json', 'utf8'));
console.log('| Metric | Coverage |');
console.log('|--------|----------|');
console.log('| Lines | ' + data.total.lines.pct + '% |');
console.log('| Functions | ' + data.total.functions.pct + '% |');
console.log('| Branches | ' + data.total.branches.pct + '% |');
console.log('| Statements | ' + data.total.statements.pct + '% |');
" >> "$report_file"
            fi
            
            echo "" >> "$report_file"
        fi
    done
    
    # Add HTML report links if available
    if [ "$HTML_REPORT" = true ]; then
        cat >> "$report_file" << EOF

## HTML Coverage Reports

EOF
        for component in backend frontend shared; do
            local dir=""
            case $component in
                backend) dir="$BACKEND_DIR" ;;
                frontend) dir="$FRONTEND_DIR" ;;
                shared) dir="$SHARED_DIR" ;;
            esac
            
            if [ -f "$dir/coverage/lcov-report/index.html" ]; then
                echo "- [$component HTML Report]($dir/coverage/lcov-report/index.html)" >> "$report_file"
            fi
        done
    fi
    
    success "Coverage report generated: $report_file"
}

# Function to show coverage summary
show_summary() {
    echo ""
    result "Coverage Analysis Summary:"
    echo ""
    
    for component in backend frontend shared; do
        local coverage=${COVERAGE_RESULTS[$component]}
        if [ "$coverage" != "N/A" ]; then
            echo "  - $component: ${coverage}%"
        else
            echo "  - $component: N/A"
        fi
    done
    
    echo ""
    info "Coverage threshold: ${COVERAGE_THRESHOLD}%"
    
    # Calculate overall coverage
    local valid_count=0
    local total_coverage=0
    
    for component in backend frontend shared; do
        local coverage=${COVERAGE_RESULTS[$component]}
        if [ "$coverage" != "N/A" ]; then
            total_coverage=$((total_coverage + coverage))
            ((valid_count++))
        fi
    done
    
    if [ $valid_count -gt 0 ]; then
        local overall=$((total_coverage / valid_count))
        echo "  - Overall: ${overall}%"
        
        if [ $overall -ge "$COVERAGE_THRESHOLD" ]; then
            success "Overall coverage meets threshold! ✅"
        else
            warning "Overall coverage below threshold ❌"
        fi
    fi
    
    echo ""
    if [ "$HTML_REPORT" = true ]; then
        info "HTML coverage reports available in respective coverage/ directories"
    fi
}

# Main execution
log "Starting HostingCo coverage analysis for scope: $SCOPE"

# Check for required commands
if ! command -v npm >/dev/null 2>&1; then
    error "npm is required but not installed"
fi

# Create coverage directory
mkdir -p "$COVERAGE_DIR"

# Run coverage based on scope
case $SCOPE in
    all)
        run_shared_coverage
        run_backend_coverage
        run_frontend_coverage
        ;;
    backend)
        run_backend_coverage
        ;;
    frontend)
        run_frontend_coverage
        ;;
    shared)
        run_shared_coverage
        ;;
esac

# Compare with previous coverage
compare_coverage

# Check coverage threshold
check_threshold

# Generate report
generate_coverage_report

# Show summary
show_summary

# Exit with appropriate code
for component in backend frontend shared; do
    local coverage=${COVERAGE_RESULTS[$component]}
    if [ "$coverage" != "N/A" ] && [ "$coverage" -lt "$COVERAGE_THRESHOLD" ]; then
        exit 1
    fi
done
