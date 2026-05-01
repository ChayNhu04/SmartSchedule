#!/bin/bash

# Script để chạy TẤT CẢ tests cho SmartSchedule (backend + web + mobile)

set -e

echo "🧪 SmartSchedule - Complete Test Suite"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FAILED=0
PASSED=0

# Function to run tests
run_test_suite() {
    local suite_name=$1
    local command=$2
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Running $suite_name...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if eval "$command"; then
        echo ""
        echo -e "${GREEN}✅ $suite_name PASSED!${NC}"
        echo ""
        PASSED=$((PASSED + 1))
        return 0
    else
        echo ""
        echo -e "${RED}❌ $suite_name FAILED!${NC}"
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the test/ directory${NC}"
    exit 1
fi

echo "This will run ALL tests for backend, web, and mobile."
echo "Estimated time: 2-5 minutes"
echo ""
echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
read

# Backend Unit Tests
run_test_suite "Backend Unit Tests" "cd backend && pnpm test -- --testPathIgnorePatterns=e2e --passWithNoTests" || true

# Backend E2E Tests (optional)
echo -e "${YELLOW}Do you want to run Backend E2E tests? (requires PostgreSQL) [y/N]${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    run_test_suite "Backend E2E Tests" "cd backend && pnpm test:e2e" || true
else
    echo "Skipping Backend E2E tests."
    echo ""
fi

# Web Tests
run_test_suite "Web Tests" "cd ../test/web && npm test -- --passWithNoTests" || true

# Mobile Tests
run_test_suite "Mobile Tests" "cd ../test/mobile && npm test -- --passWithNoTests" || true

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}           TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All test suites passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some test suites failed. Please check the output above.${NC}"
    exit 1
fi
