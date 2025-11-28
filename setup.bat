@echo off
REM GießPlan Setup Script
REM Automated setup for the Plant Watering Scheduler

echo.
echo ========================================
echo   GießPlan Setup - Plant Watering Scheduler
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please download and install Node.js from https://nodejs.org/
    echo Minimum version required: 18.0.0
    pause
    exit /b 1
)

REM Display Node.js version
for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo Found Node.js %NODE_VERSION%

REM Check if npm is available
echo [2/5] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure npm is installed with Node.js
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
echo Found npm %NPM_VERSION%

REM Install dependencies
echo.
echo [3/5] Installing dependencies...
echo This may take a few minutes depending on your internet connection...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo Dependencies installed successfully!

REM Run tests to verify installation
echo.
echo [4/5] Running verification tests...
call npm run test -- --run --silent
if %errorlevel% neq 0 (
    echo WARNING: Some tests failed, but the application should still work
    echo You can investigate later with: npm run test
) else (
    echo All tests passed!
)

REM Start development server
echo.
echo [5/5] Starting development server...
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your GießPlan application is ready!
echo.
echo What happens next:
echo   1. Development server will start automatically
echo   2. Your browser will open to http://localhost:5173
echo   3. Select a folder to store your schedule data
echo   4. Start adding people and creating schedules
echo.
echo Available commands:
echo   npm run dev      - Start development server
echo   npm run build    - Build for production  
echo   npm run test     - Run test suite
echo   npm run lint     - Check code quality
echo.
echo Press any key to start the development server...
pause >nul

call npm run dev