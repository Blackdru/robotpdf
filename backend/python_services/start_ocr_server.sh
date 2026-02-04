#!/bin/bash
# Start OCR Server on Linux/Mac
echo "Starting Python OCR Server with EasyOCR..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from your package manager"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set environment variables
export OCR_SERVER_PORT=5050
export PYTHONUNBUFFERED=1

# Start OCR server
echo ""
echo "========================================"
echo "OCR Server Starting on port $OCR_SERVER_PORT"
echo "Using EasyOCR (Primary) + Tesseract (Fallback)"
echo "========================================"
echo ""

python3 ocr_server.py

# If server exits with error, show message
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: OCR Server failed to start"
    read -p "Press Enter to continue..."
fi
