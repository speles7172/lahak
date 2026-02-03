@echo off
REM Simple HTTP Server Launcher for Windows
REM This script tries different methods to start a local web server

echo ================================================
echo Mobile Inventory Manager - Local Server
echo ================================================
echo.

REM Check for Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Python HTTP server on port 8000...
    echo Open your browser to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Check for Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Node.js HTTP server on port 8000...
    echo Open your browser to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    npx -y serve . -p 8000
    goto :end
)

REM Check for PHP
php --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting PHP built-in server on port 8000...
    echo Open your browser to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    php -S localhost:8000
    goto :end
)

REM No server found
echo ERROR: No suitable HTTP server found!
echo.
echo Please install one of the following:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo   - PHP: https://www.php.net/downloads
echo.
pause
goto :end

:end
