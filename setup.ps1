# GießPlan Setup Script (PowerShell)
# Automated setup for the Plant Watering Scheduler

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GießPlan Setup - Plant Watering Scheduler" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Node.js is installed
Write-Host "[1/5] Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Minimum version required: 18.0.0" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Host "Found Node.js $nodeVersion" -ForegroundColor Green

# Check if npm is available
Write-Host "[2/5] Checking npm..." -ForegroundColor Yellow
if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not available" -ForegroundColor Red
    Write-Host "Please ensure npm is installed with Node.js" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$npmVersion = npm --version
Write-Host "Found npm $npmVersion" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes depending on your internet connection..." -ForegroundColor Cyan

try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Run tests to verify installation
Write-Host ""
Write-Host "[4/5] Running verification tests..." -ForegroundColor Yellow

try {
    npm run test -- --run --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Some tests failed, but the application should still work" -ForegroundColor Yellow
        Write-Host "You can investigate later with: npm run test" -ForegroundColor Cyan
    } else {
        Write-Host "All tests passed!" -ForegroundColor Green
    }
}
catch {
    Write-Host "WARNING: Could not run tests, but installation appears successful" -ForegroundColor Yellow
}

# Display completion message
Write-Host ""
Write-Host "[5/5] Setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your GießPlan application is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "What happens next:" -ForegroundColor Yellow
Write-Host "  1. Development server will start automatically" -ForegroundColor White
Write-Host "  2. Your browser will open to http://localhost:5173" -ForegroundColor White
Write-Host "  3. Select a folder to store your schedule data" -ForegroundColor White
Write-Host "  4. Start adding people and creating schedules" -ForegroundColor White
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  npm run dev      - Start development server" -ForegroundColor White
Write-Host "  npm run build    - Build for production" -ForegroundColor White
Write-Host "  npm run test     - Run test suite" -ForegroundColor White
Write-Host "  npm run lint     - Check code quality" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Press Enter to start the development server (or 'n' to exit)"
if ($choice -ne 'n') {
    Write-Host "Starting development server..." -ForegroundColor Green
    npm run dev
}