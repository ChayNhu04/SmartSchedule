# PowerShell script để chạy TẤT CẢ tests cho SmartSchedule (backend + web + mobile)

$ErrorActionPreference = "Continue"

Write-Host "🧪 SmartSchedule - Complete Test Suite" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$Failed = 0
$Passed = 0

# Function to run test suite
function Run-TestSuite {
    param(
        [string]$SuiteName,
        [string]$Command
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "Running $SuiteName..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
    
    try {
        Invoke-Expression $Command
        Write-Host ""
        Write-Host "✅ $SuiteName PASSED!" -ForegroundColor Green
        Write-Host ""
        $script:Passed++
        return $true
    }
    catch {
        Write-Host ""
        Write-Host "❌ $SuiteName FAILED!" -ForegroundColor Red
        Write-Host ""
        $script:Failed++
        return $false
    }
}

# Check if we're in the right directory
if (-not (Test-Path "../package.json")) {
    Write-Host "❌ Error: Please run this script from the test/ directory" -ForegroundColor Red
    exit 1
}

Write-Host "This will run ALL tests for backend, web, and mobile." -ForegroundColor Cyan
Write-Host "Estimated time: 2-5 minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
Read-Host

# Backend Unit Tests
Run-TestSuite "Backend Unit Tests" "pnpm --filter smartschedule-backend test -- --testPathIgnorePatterns=e2e --passWithNoTests"

# Backend E2E Tests (optional)
Write-Host "Do you want to run Backend E2E tests? (requires PostgreSQL) [y/N]" -ForegroundColor Yellow
$response = Read-Host
if ($response -match '^[yY]') {
    Run-TestSuite "Backend E2E Tests" "pnpm --filter smartschedule-backend test:e2e"
}
else {
    Write-Host "Skipping Backend E2E tests." -ForegroundColor Yellow
    Write-Host ""
}

# Web Tests
Run-TestSuite "Web Tests" "cd web; npm test -- --passWithNoTests"

# Mobile Tests
Run-TestSuite "Mobile Tests" "cd mobile; npm test -- --passWithNoTests"

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "           TEST SUMMARY" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "🎉 All test suites passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ Some test suites failed. Please check the output above." -ForegroundColor Red
    exit 1
}
