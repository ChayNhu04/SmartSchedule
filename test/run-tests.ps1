# PowerShell script để chạy tests cho SmartSchedule backend

param(
    [Parameter(Position=0)]
    [ValidateSet('unit', 'e2e', 'cov', 'all')]
    [string]$TestType = 'all'
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 SmartSchedule Test Runner" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "../backend/package.json")) {
    Write-Host "❌ Error: Please run this script from the test/ directory" -ForegroundColor Red
    exit 1
}

# Function to run tests
function Run-Test {
    param(
        [string]$TestName,
        [string]$Command
    )
    
    Write-Host "Running $TestName..." -ForegroundColor Yellow
    try {
        Invoke-Expression $Command
        Write-Host "✅ $TestName passed!" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "❌ $TestName failed!" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

switch ($TestType) {
    'unit' {
        Write-Host "Running Unit Tests only..." -ForegroundColor Cyan
        Write-Host ""
        Run-Test "Unit Tests" "pnpm --filter smartschedule-backend test -- --testPathIgnorePatterns=e2e"
    }
    
    'e2e' {
        Write-Host "Running E2E Tests only..." -ForegroundColor Cyan
        Write-Host "⚠️  Make sure PostgreSQL is running and DATABASE_URL is set!" -ForegroundColor Yellow
        Write-Host ""
        Run-Test "E2E Tests" "pnpm --filter smartschedule-backend test:e2e"
    }
    
    'cov' {
        Write-Host "Running Tests with Coverage..." -ForegroundColor Cyan
        Write-Host ""
        Run-Test "Coverage Tests" "pnpm --filter smartschedule-backend test:cov"
    }
    
    'all' {
        Write-Host "Running All Tests..." -ForegroundColor Cyan
        Write-Host ""
        
        # Run unit tests
        $unitPassed = Run-Test "Unit Tests" "pnpm --filter smartschedule-backend test -- --testPathIgnorePatterns=e2e"
        
        if (-not $unitPassed) {
            Write-Host "Unit tests failed. Skipping E2E tests." -ForegroundColor Red
            exit 1
        }
        
        # Ask before running E2E tests
        Write-Host "Do you want to run E2E tests? (requires PostgreSQL) [y/N]" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -match '^[yY]') {
            Run-Test "E2E Tests" "pnpm --filter smartschedule-backend test:e2e"
        }
        else {
            Write-Host "Skipping E2E tests." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🎉 Test run completed!" -ForegroundColor Green
