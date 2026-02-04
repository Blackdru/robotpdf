@echo off
REM Start OCR Server on Windows
echo Starting Python OCR Server with EasyOCR...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Set environment variables
set OCR_SERVER_PORT=5050
set PYTHONUNBUFFERED=1

REM Start OCR server
echo.
echo ========================================
echo OCR Server Starting on port %OCR_SERVER_PORT%
echo Using EasyOCR (Primary) + Tesseract (Fallback)
echo ========================================
echo.

python ocr_server.py

REM If server exits, pause to see error
if errorlevel 1 (
    echo.
    echo ERROR: OCR Server failed to start
    pause
)
