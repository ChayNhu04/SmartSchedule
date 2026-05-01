#!/bin/bash

# Script để chạy tests cho SmartSchedule backend

set -e

echo "🧪 SmartSchedule Test Runner"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "../backend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the test/ directory${NC}"
    exit 1
fi

# Function to run tests
run_test() {
    local test_type=$1
    local command=$2
    
    echo -e "${YELLOW}Running $test_type...${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✅ $test_type passed!${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ $test_type failed!${NC}"
        echo ""
        return 1
    fi
}

# Parse arguments
TEST_TYPE=${1:-all}

case $TEST_TYPE in
    unit)
        echo "Running Unit Tests only..."
        echo ""
        run_test "Unit Tests" "cd ../backend && pnpm test -- --testPathIgnorePatterns=e2e"
        ;;
    
    e2e)
        echo "Running E2E Tests only..."
        echo "⚠️  Make sure PostgreSQL is running and DATABASE_URL is set!"
        echo ""
        run_test "E2E Tests" "cd ../backend && pnpm test:e2e"
        ;;
    
    cov)
        echo "Running Tests with Coverage..."
        echo ""
        run_test "Coverage Tests" "cd ../backend && pnpm test:cov"
        ;;
    
    all)
        echo "Running All Tests..."
        echo ""
        
        # Run unit tests
        if ! run_test "Unit Tests" "cd ../backend && pnpm test -- --testPathIgnorePatterns=e2e"; then
            echo -e "${RED}Unit tests failed. Skipping E2E tests.${NC}"
            exit 1
        fi
        
        # Ask before running E2E tests
        echo -e "${YELLOW}Do you want to run E2E tests? (requires PostgreSQL) [y/N]${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            run_test "E2E Tests" "cd ../backend && pnpm test:e2e"
        else
            echo "Skipping E2E tests."
        fi
        ;;
    
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Usage: ./run-tests.sh [unit|e2e|cov|all]"
        echo ""
        echo "Options:"
        echo "  unit  - Run only unit tests (fast, no database needed)"
        echo "  e2e   - Run only E2E tests (requires PostgreSQL)"
        echo "  cov   - Run tests with coverage report"
        echo "  all   - Run all tests (default)"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Test run completed!${NC}"
