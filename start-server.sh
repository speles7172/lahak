#!/bin/bash
# Simple HTTP Server Launcher for Unix-like systems (Mac/Linux)
# This script tries different methods to start a local web server

echo "================================================"
echo "Mobile Inventory Manager - Local Server"
echo "================================================"
echo ""

# Check for Python 3
if command -v python3 &> /dev/null; then
    echo "Starting Python HTTP server on port 8000..."
    echo "Open your browser to: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
    exit 0
fi

# Check for Python (legacy)
if command -v python &> /dev/null; then
    echo "Starting Python HTTP server on port 8000..."
    echo "Open your browser to: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m http.server 8000
    exit 0
fi

# Check for Node.js
if command -v node &> /dev/null; then
    echo "Starting Node.js HTTP server on port 8000..."
    echo "Open your browser to: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    npx -y serve . -p 8000
    exit 0
fi

# Check for PHP
if command -v php &> /dev/null; then
    echo "Starting PHP built-in server on port 8000..."
    echo "Open your browser to: http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    php -S localhost:8000
    exit 0
fi

# No server found
echo "ERROR: No suitable HTTP server found!"
echo ""
echo "Please install one of the following:"
echo "  - Python: https://www.python.org/downloads/"
echo "  - Node.js: https://nodejs.org/"
echo "  - PHP: https://www.php.net/downloads"
echo ""
exit 1
