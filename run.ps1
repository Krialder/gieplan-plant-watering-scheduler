# Giessplan Plant Watering Application Runner
# This script checks for required dependencies and starts the application

Write-Host "=== Giessplan Plant Watering Application ===" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check for Node.js
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Red
    Write-Host "Recommended version: 18.x or higher" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = node --version
Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green

# Check for npm
Write-Host "Checking for npm..." -ForegroundColor Yellow
if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Write-Host "npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Red
    exit 1
}

$npmVersion = npm --version
Write-Host "npm found: v$npmVersion" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencies not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} else {
    # Check if package.json was modified more recently than node_modules
    $packageJsonTime = (Get-Item "package.json").LastWriteTime
    $nodeModulesTime = (Get-Item "node_modules").LastWriteTime
    
    if ($packageJsonTime -gt $nodeModulesTime) {
        Write-Host "package.json has been updated. Reinstalling dependencies..." -ForegroundColor Yellow
        Write-Host ""
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
            exit 1
        }
        Write-Host ""
        Write-Host "Dependencies updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Dependencies already installed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Starting Application ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Gray
Write-Host ""

# Start the development server
npm run dev
